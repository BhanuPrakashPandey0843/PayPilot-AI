# BasketService
#
# Rewired to hold NO local state at all. The "basket" is really PayPilot's
# own server-side, Redis-backed commerce-agent cart (POST /commerce/chat,
# GET/DELETE /commerce/session) — this class just translates between the
# chatbot's basket-shaped tool/controller calls and that API.
#
# IMPORTANT — one real limitation of the underlying PayPilot API (see
# documentation/Backend_API_Reference.md §5): there is no direct
# "set quantity" or "remove one item's line only" endpoint. Cart mutation
# only happens through POST /commerce/chat's intent extraction
# (ADD_TO_CART / REMOVE_FROM_CART), and DELETE /commerce/session clears
# the *entire* session (cart + memory), not just the cart. This class
# works around the missing "set quantity" case by diffing against the
# current cart and issuing an add/remove delta.
#
# NOTE ON RESPONSE SHAPES: PayPilot's public API reference documents field
# *names* returned by /commerce/chat and /commerce/session (memory/cart
# snapshot) but not their exact nested JSON shape byte-for-byte. This class
# parses defensively (see #extract_cart_items) and is the first place to
# check if cart line items don't populate correctly against your running
# PayPilot backend — adjust the key lookups there to match what
# GET /api/v1/commerce/session actually returns for your version.
class BasketService
  def initialize(client: PaypilotApiClient.instance)
    @client = client
  end

  def view_basket(session_id)
    response = @client.commerce_session(session_id)
    normalize_basket(session_id, @client.unwrap(response))
  end

  def add_item(session_id, product_id, quantity)
    raise ArgumentError, "Quantity must be greater than 0" if quantity.to_i <= 0

    response = @client.chat(
      session_id: session_id,
      message: "Add this to my cart",
      product_id: product_id,
      quantity: quantity.to_i
    )
    result_from_chat(session_id, response)
  end

  def remove_item(session_id, product_id, quantity = nil)
    current = view_basket(session_id)
    existing = current[:items].find { |i| i[:product_id] == product_id }
    raise ArgumentError, "Item not in basket" unless existing

    response = @client.chat(
      session_id: session_id,
      message: "Remove this from my cart",
      product_id: product_id,
      quantity: quantity
    )
    result_from_chat(session_id, response)
  end

  # PayPilot has no direct "set absolute quantity" intent, so this diffs
  # against the current cart and issues the equivalent add/remove.
  def update_item_quantity(session_id, product_id, new_quantity)
    raise ArgumentError, "Quantity can not be negative" if new_quantity.to_i < 0

    current = view_basket(session_id)
    existing = current[:items].find { |i| i[:product_id] == product_id }
    raise ArgumentError, "Item not in basket" unless existing

    delta = new_quantity.to_i - existing[:quantity].to_i
    return current if delta.zero?

    if delta.positive?
      add_item(session_id, product_id, delta)
    else
      remove_item(session_id, product_id, delta.abs)
    end
  end

  def clear_basket(session_id)
    @client.clear_commerce_session(session_id)
    { session_id: session_id, items: [], total_minor: 0, currency: "INR", item_count: 0 }
  end

  def summary(session_id)
    basket = view_basket(session_id)
    {
      total_item_count: basket[:items].sum { |i| i[:quantity] },
      unique_product_count: basket[:items].size,
      total_minor: basket[:total_minor],
      currency: basket[:currency]
    }
  end

  private

  def result_from_chat(session_id, response)
    body = @client.unwrap(response)
    basket = normalize_basket(session_id, body["memory"] || body)
    basket[:message] = body["message"]
    basket[:policy] = body["policy"]
    basket
  end

  def normalize_basket(session_id, memory)
    items = extract_cart_items(memory)

    {
      session_id: session_id,
      items: items,
      total_minor: items.sum { |i| i[:line_total_minor] },
      currency: items.first&.dig(:currency) || "INR",
      item_count: items.sum { |i| i[:quantity] }
    }
  end

  def extract_cart_items(memory)
    return [] if memory.nil?

    raw_cart = memory.is_a?(Hash) ? (memory["cart"] || memory["items"] || []) : []
    Array(raw_cart).map { |item| normalize_cart_item(item) }.compact
  end

  def normalize_cart_item(item)
    return nil unless item.is_a?(Hash)

    product = item["product"] || {}
    price = product["price"] || item["price"] || {}
    quantity = (item["quantity"] || 1).to_i
    price_minor = price.is_a?(Hash) ? price["amount"] : price

    {
      product_id: item["productId"] || product["id"],
      product_name: product["name"] || item["productName"],
      quantity: quantity,
      price_minor: price_minor.to_i,
      currency: (price.is_a?(Hash) ? price["currency"] : nil) || "INR",
      line_total_minor: price_minor.to_i * quantity
    }
  end
end
