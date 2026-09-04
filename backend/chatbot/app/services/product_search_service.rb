# ProductSearchService
#
# Rewired to search PayPilot's real, org-scoped product catalog via
# PaypilotApiClient (GET/POST /agent/catalog) instead of a local
# ActiveRecord `Product` table. Returns plain hashes shaped for the
# chatbot's UI (see #normalize_product), not ActiveRecord objects.
class ProductSearchService
  def initialize(client: PaypilotApiClient.instance)
    @client = client
  end

  # @param filters [Hash]
  # @option filters [String] :query
  # @option filters [Numeric] :min_price minor units
  # @option filters [Numeric] :max_price minor units
  # @option filters [String] :category
  # @option filters [Array<String>] :tags
  # @return [Hash] { products: [...], count:, page:, total_pages: }
  def search(filters, page: 1, limit: 20)
    response = @client.search_catalog(
      query: filters[:query],
      filters: {
        category: filters[:category],
        minPrice: filters[:min_price],
        maxPrice: filters[:max_price],
        tags: filters[:tags],
        available: true
      },
      page: page,
      limit: limit
    )

    data = @client.unwrap(response)
    items = data.is_a?(Hash) ? Array(data["data"] || data["items"]) : Array(data)
    meta = data.is_a?(Hash) ? data["meta"] : nil

    {
      products: items.map { |p| normalize_product(p) },
      count: items.size,
      page: meta&.dig("page") || page,
      total_pages: meta&.dig("totalPages")
    }
  rescue PaypilotApiClient::ApiError => e
    Rails.logger.error "ProductSearchService#search failed: #{e.message}"
    { products: [], count: 0, error: e.message }
  end

  # @return [Hash] { product: {...}, recommendations: [...] }
  def get_product(product_id)
    response = @client.product_with_recommendations(product_id)
    data = @client.unwrap(response)

    {
      product: normalize_product(data["product"]),
      recommendations: Array(data["recommendations"]).map do |rec|
        {
          type: rec["type"],
          score: rec["score"],
          reasons: rec["reasons"],
          product: normalize_product(rec["product"])
        }
      end
    }
  rescue PaypilotApiClient::ApiError => e
    Rails.logger.error "ProductSearchService#get_product failed: #{e.message}"
    { product: nil, error: e.message }
  end

  private

  # PayPilot's agent-catalog shape (see documentation/Backend_API_Reference.md §4):
  #   { id, name, description, category, tags,
  #     price: { amount, currency, unit: "minor" },
  #     availability: { available, inventoryQuantity },
  #     imageUrl }
  def normalize_product(p)
    return nil if p.nil?

    price = p["price"] || {}
    availability = p["availability"] || {}

    {
      id: p["id"],
      name: p["name"],
      description: p["description"],
      category: p["category"],
      tags: p["tags"] || [],
      price_minor: price["amount"],
      currency: price["currency"] || "INR",
      available: availability["available"],
      inventory_quantity: availability["inventoryQuantity"],
      image_url: p["imageUrl"],
      match_score: p["matchScore"],
      match_reasons: p["matchReasons"]
    }
  end
end
