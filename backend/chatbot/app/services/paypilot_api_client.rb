# PaypilotApiClient
#
# The single integration point between this Rails chatbot and the real
# PayPilot AI backend (Fastify + Drizzle/Postgres, running separately at
# PAYPILOT_API_BASE_URL). Every product, cart, order-preview and checkout
# operation the chatbot performs goes through this client and PayPilot's
# actual multi-tenant API instead of a local ActiveRecord model.
#
# Auth model: the chatbot has no end-user login of its own (it's an
# anonymous, session-based conversational widget), so it authenticates to
# PayPilot as a single "service" organization user (PAYPILOT_SERVICE_EMAIL /
# PAYPILOT_SERVICE_PASSWORD — an ORG_ADMIN account created via
# POST /auth/register in the PayPilot backend). The resulting JWT is cached
# in-process and transparently refreshed on 401.
#
# See documentation/Backend_API_Reference.md in the PayPilot AI repo root
# for the exact contract of every endpoint called here.
require "faraday"
require "faraday/net_http"
require "json"
require "singleton"

class PaypilotApiClient
  include Singleton

  class ApiError < StandardError
    attr_reader :status, :code, :details

    def initialize(message, status: nil, code: nil, details: nil)
      @status = status
      @code = code
      @details = details
      super(message)
    end
  end

  class AuthenticationError < ApiError; end

  def initialize
    @base_url = ENV.fetch("PAYPILOT_API_BASE_URL", "http://localhost:4000/api/v1")
    @email = ENV.fetch("PAYPILOT_SERVICE_EMAIL", nil)
    @password = ENV.fetch("PAYPILOT_SERVICE_PASSWORD", nil)
    @token = nil
    @token_mutex = Mutex.new
  end

  # ---------------------------------------------------------------------
  # Agent Catalog (read-only, ai.read) — GET/POST /agent/catalog
  # ---------------------------------------------------------------------

  # @param query [String, nil]
  # @param filters [Hash] category, minPrice, maxPrice, tags, available, sort, order (all optional)
  # @return [Hash] { "data" => [...products], "meta" => {...} } (envelope varies — see #unwrap_list)
  def search_catalog(query: nil, filters: {}, page: 1, limit: 20)
    body = {
      query: query,
      filters: filters.compact,
      page: page,
      limit: limit
    }.compact

    post("/agent/catalog/search", body)
  end

  # Product detail + deterministic upsell/cross-sell recommendations.
  # Used as the "get product details" tool since /agent/catalog has no
  # standalone GET /:id route — this is the closest ai.read-scoped
  # single-product lookup.
  #
  # @return [Hash] { "product" => {...}, "recommendations" => [...] }
  def product_with_recommendations(product_id)
    get("/agent/catalog/#{product_id}/recommendations")
  end

  # ---------------------------------------------------------------------
  # Commerce Agent (ai.read) — cart lives server-side in PayPilot's
  # Redis-backed session memory, namespaced by session_id.
  # ---------------------------------------------------------------------

  # @param session_id [String] required — namespaces all cart/memory state
  # @param message [String] free-text buyer message (regex-based intent extraction happens server-side)
  # @param product_id [String, nil] UUID — context for ADD_TO_CART / PRODUCT_DETAILS
  # @param product_ids [Array<String>, nil] UUIDs — context for PRODUCT_COMPARE
  # @param quantity [Integer, nil] — context for ADD_TO_CART
  def chat(session_id:, message:, product_id: nil, product_ids: nil, quantity: nil)
    body = {
      sessionId: session_id,
      message: message,
      productId: product_id,
      productIds: product_ids,
      quantity: quantity
    }.compact

    post("/commerce/chat", body)
  end

  # @return [Hash] current cart, last classified intent, last extracted filters
  def commerce_session(session_id)
    get("/commerce/session", params: { sessionId: session_id })
  end

  # Clears cart/memory/history for the session. Used to back "clear basket" —
  # note this clears the *entire* session memory (cart + filters + intent
  # history), not just cart line items, since PayPilot doesn't expose a
  # narrower "empty the cart only" endpoint.
  def clear_commerce_session(session_id)
    delete("/commerce/session", params: { sessionId: session_id })
  end

  # Hypothetical order preview (never mutates the stored cart). Runs the
  # full cart policy engine (inventory, active, budget) before totalling.
  def order_preview(session_id:, items: nil, budget: nil)
    body = { sessionId: session_id, items: items, budget: budget }.compact
    post("/commerce/order-preview", body)
  end

  # @param product_ids [Array<String>] 2-5 UUIDs
  def compare_products(product_ids)
    get("/commerce/compare", params: { productIds: product_ids.join(",") })
  end

  # ---------------------------------------------------------------------
  # Customers — needed because PayPilot's checkout requires a real,
  # org-scoped customerId. The chatbot has no login, so it resolves a
  # stable "guest" customer per browser session (idempotent: same
  # session_id always maps to the same PayPilot customer).
  # ---------------------------------------------------------------------

  def find_or_create_customer(session_id:, name: nil, email: nil)
    external_id = "chatbot-#{session_id}"

    existing = get("/customers", params: { search: external_id, limit: 1 })
    match = unwrap_list(existing).find { |c| c["externalCustomerId"] == external_id }
    return match if match

    unwrap(post("/customers", {
      externalCustomerId: external_id,
      name: name.presence || "Guest (#{session_id[0, 8]})",
      email: email
    }.compact))
  end

  # ---------------------------------------------------------------------
  # Checkout (ai.execute, rate-limited) — the ONLY code path allowed to
  # touch Razorpay. The chatbot never talks to Razorpay directly.
  # ---------------------------------------------------------------------

  # No `amount` is ever sent — PayPilot always computes the total itself
  # from the session's server-side cart.
  def create_checkout_order(session_id:, customer_id:, idempotency_key: nil)
    body = { sessionId: session_id, customerId: customer_id, idempotencyKey: idempotency_key }.compact
    post("/checkout/create-order", body)
  end

  def verify_payment(razorpay_order_id:, razorpay_payment_id:, razorpay_signature:)
    post("/checkout/verify-payment", {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    })
  end

  # ---------------------------------------------------------------------
  # Orders (orders.read) — used to render order-status / confirmation UI
  # after checkout, by the PayPilot order UUID returned from checkout.
  # ---------------------------------------------------------------------

  def get_order(order_id)
    get("/orders/#{order_id}")
  end

  # Public so services can unwrap the standard envelope consistently.
  def unwrap(parsed)
    parsed.is_a?(Hash) && parsed.key?("data") ? parsed["data"] : parsed
  end

  private

  def get(path, params: nil)
    request(:get, path, params: params)
  end

  def post(path, body)
    request(:post, path, body: body)
  end

  def delete(path, params: nil)
    request(:delete, path, params: params)
  end

  def request(method, path, body: nil, params: nil, retried: false)
    response = connection.send(method) do |req|
      req.url(path)
      req.params.update(params) if params
      req.headers["Authorization"] = "Bearer #{token}"
      req.body = body.to_json if body
    end

    if response.status == 401 && !retried
      Rails.logger.info "PaypilotApiClient: token expired/invalid, re-authenticating"
      reset_token!
      return request(method, path, body: body, params: params, retried: true)
    end

    parsed = parse(response)

    unless response.success?
      error = parsed.is_a?(Hash) ? parsed["error"] : nil
      raise ApiError.new(
        (error.is_a?(Hash) && error["message"]) || "PayPilot API request failed (#{response.status})",
        status: response.status,
        code: error.is_a?(Hash) ? error["code"] : nil,
        details: error.is_a?(Hash) ? error["details"] : nil
      )
    end

    parsed
  rescue Faraday::ConnectionFailed, Faraday::TimeoutError => e
    Rails.logger.error "PaypilotApiClient: connection error calling #{method.upcase} #{path}: #{e.message}"
    raise ApiError.new(
      "Could not reach PayPilot backend at #{@base_url}. Is it running?",
      status: 503
    )
  end

  def parse(response)
    return {} if response.body.blank?
    JSON.parse(response.body)
  rescue JSON::ParserError
    {}
  end

  # List endpoints may return the array directly under "data" or nested
  # one level deeper (e.g. { data: { data: [...], meta: {...} } }) —
  # handle both without callers needing to know which.
  def unwrap_list(parsed)
    data = unwrap(parsed)
    return data if data.is_a?(Array)
    return data["data"] if data.is_a?(Hash) && data["data"].is_a?(Array)
    []
  end

  def token
    @token_mutex.synchronize do
      @token ||= login!
    end
  end

  def reset_token!
    @token_mutex.synchronize { @token = nil }
  end

  def login!
    raise AuthenticationError, "PAYPILOT_SERVICE_EMAIL / PAYPILOT_SERVICE_PASSWORD are not configured" if @email.to_s.empty? || @password.to_s.empty?

    response = connection.post("/auth/login") do |req|
      req.body = { email: @email, password: @password }.to_json
    end

    parsed = parse(response)
    unless response.success?
      raise AuthenticationError, "PayPilot login failed for #{@email}: #{parsed.dig('error', 'message') || response.status}"
    end

    token = parsed.dig("data", "token")
    raise AuthenticationError, "PayPilot login response did not include a token" if token.to_s.empty?

    token
  end

  def connection
    @connection ||= Faraday.new(url: @base_url) do |f|
      f.request :json
      f.options.timeout = 20
      f.options.open_timeout = 10
      f.adapter :net_http
    end
  end
end
