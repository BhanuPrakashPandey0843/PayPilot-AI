class Api::ProductsController < ApplicationController
  # Rewired to read from PayPilot's real catalog via ProductSearchService
  # instead of a local `Product` table — see app/services/product_search_service.rb.

  # GET /api/products
  def index
    result = search_service.search({}, page: page_param, limit: per_page_param)
    render json: { products: result[:products], pagination: pagination_json(result) }
  end

  # GET /api/products/:id
  def show
    result = search_service.get_product(params[:id])
    if result[:product].nil?
      render json: { error: result[:error] || "Product not found" }, status: :not_found
      return
    end
    render json: { product: result[:product], recommendations: result[:recommendations] }
  end

  # GET /api/products/search
  def search
    result = search_service.search(build_search_filters, page: page_param, limit: per_page_param)
    render json: { products: result[:products], filters_applied: build_search_filters, pagination: pagination_json(result) }
  end

  private

  def search_service
    @search_service ||= ProductSearchService.new
  end

  def page_param
    params[:page]&.to_i || 1
  end

  def per_page_param
    [(params[:per_page]&.to_i || 20), 100].min
  end

  def pagination_json(result)
    { current_page: result[:page], per_page: per_page_param, total_pages: result[:total_pages] }
  end

  def build_search_filters
    filters = {}
    filters[:query] = params[:query] if params[:query].present?
    filters[:category] = params[:category] if params[:category].present?
    filters[:min_price] = params[:min_price].to_f if params[:min_price].present?
    filters[:max_price] = params[:max_price].to_f if params[:max_price].present?
    filters
  end
end
