module Api
  class BasketsController < ApplicationController
    # Rewired to proxy PayPilot's real commerce-agent cart via BasketService
    # instead of a local `Basket`/`BasketItem` table — see
    # app/services/basket_service.rb. Route/response shapes are unchanged so
    # the existing React frontend (app/javascript/utils/api.ts) keeps working.

    # GET /api/baskets/:session_id
    def show
      render json: basket_service.view_basket(params[:session_id])
    end

    # POST /api/baskets/:session_id/items
    def add_item
      quantity = params[:quantity].to_i
      render json: basket_service.add_item(params[:session_id], params[:product_id], quantity), status: :created
    rescue InsufficientInventoryError => e
      render json: { error: e.message, available: e.available }, status: :unprocessable_content
    rescue PaypilotApiClient::ApiError, ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_content
    end

    # PATCH /api/baskets/:session_id/items/:product_id
    def update_item
      new_quantity = params[:quantity].to_i
      render json: basket_service.update_item_quantity(params[:session_id], params[:product_id], new_quantity)
    rescue InsufficientInventoryError => e
      render json: { error: e.message, available: e.available }, status: :unprocessable_content
    rescue PaypilotApiClient::ApiError, ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_content
    end

    # DELETE /api/baskets/:session_id/items/:product_id
    # Optional query param: ?quantity=N - if provided, decrements by N; if omitted, removes entire item
    def destroy_item
      quantity = params[:quantity]&.to_i
      render json: basket_service.remove_item(params[:session_id], params[:product_id], quantity)
    rescue PaypilotApiClient::ApiError, ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_content
    end

    # DELETE /api/baskets/:session_id
    def destroy
      render json: basket_service.clear_basket(params[:session_id])
    end

    private

    def basket_service
      @basket_service ||= BasketService.new
    end
  end
end
