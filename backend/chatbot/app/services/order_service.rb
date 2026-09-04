# OrderService
#
# Rewired to create real orders through PayPilot's actual checkout flow
# (POST /checkout/create-order → Razorpay order + POST
# /checkout/verify-payment → signature-verified confirmation) instead of
# a local `Order`/`OrderItem` ActiveRecord table. PayPilot computes the
# total itself from the session's server-side cart — this service never
# sends an amount.
class OrderService
  def initialize(client: PaypilotApiClient.instance)
    @client = client
  end

  # Resolves/creates a guest PayPilot customer for this chat session, then
  # creates a pending checkout order + Razorpay order for the current cart.
  #
  # @return [Hash] { order_id:, razorpay_order_id:, amount_minor:, currency:,
  #                  razorpay_key_id:, status:, idempotent: }
  def create_checkout(session_id:, name: nil, email: nil)
    customer = @client.find_or_create_customer(session_id: session_id, name: name, email: email)
    customer_id = customer["id"]
    raise ArgumentError, "Could not resolve a PayPilot customer for this session" if customer_id.blank?

    response = @client.create_checkout_order(session_id: session_id, customer_id: customer_id)
    data = @client.unwrap(response)

    {
      order_id: data["orderId"],
      razorpay_order_id: data["razorpayOrderId"],
      amount_minor: data["amount"],
      currency: data["currency"],
      razorpay_key_id: data["keyId"],
      status: data["status"],
      idempotent: data["idempotent"]
    }
  end

  # Server-side HMAC verification of a Razorpay Checkout.js success
  # callback. Never trust the client's "payment succeeded" claim alone —
  # this is what actually confirms it.
  #
  # @return [Hash] { order_id:, status:, payment_id: }
  def verify_payment(razorpay_order_id:, razorpay_payment_id:, razorpay_signature:)
    response = @client.verify_payment(
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature
    )
    data = @client.unwrap(response)

    { order_id: data["orderId"], status: data["status"], payment_id: data["paymentId"] }
  end

  # @return [Hash, nil] normalized order detail, or nil if not found
  def get_order(order_id)
    response = @client.get_order(order_id)
    normalize_order(@client.unwrap(response))
  rescue PaypilotApiClient::ApiError => e
    return nil if e.status == 404
    raise
  end

  private

  def normalize_order(order)
    return nil if order.nil?

    {
      id: order["id"],
      status: order["status"],
      total_amount_minor: order["totalAmount"] || order["totalAmountMinor"],
      currency: order["currency"],
      items: Array(order["items"]).map do |item|
        {
          product_name: item["productName"] || item.dig("product", "name"),
          quantity: item["quantity"],
          price_minor: item["price"],
          line_total_minor: (item["price"].to_i) * (item["quantity"].to_i)
        }
      end,
      created_at: order["createdAt"]
    }
  end
end
