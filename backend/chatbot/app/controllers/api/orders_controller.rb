module Api
  class OrdersController < ApplicationController
    # Rewired to create/read real orders through PayPilot's checkout API
    # (POST /checkout/create-order, GET /orders/:id) via OrderService instead
    # of a local `Order`/`OrderItem` table — see app/services/order_service.rb.

    # POST /api/orders
    # Creates a pending order + Razorpay payment session from the user's basket.
    #
    # Request body:
    # {
    #   "session_id": "abc123",
    #   "name": "optional guest name",
    #   "email": "optional@guest.example"
    # }
    #
    # Error responses:
    # - 400 Bad Request: Missing session_id
    # - 422 Unprocessable Entity: empty basket, insufficient inventory, or policy failure
    def create
      session_id = params[:session_id]
      return render json: { error: "session_id is required" }, status: :bad_request if session_id.blank?

      basket = BasketService.new.view_basket(session_id)
      if basket[:items].empty?
        return render json: { error: "Cannot create order from empty basket" }, status: :unprocessable_content
      end

      checkout = order_service.create_checkout(session_id: session_id, name: params[:name], email: params[:email])
      render json: { message: "Order created successfully", order: checkout }, status: :created
    rescue PaypilotApiClient::ApiError => e
      render json: { error: e.message }, status: (e.status && e.status >= 400 && e.status < 500) ? :unprocessable_content : :bad_gateway
    rescue ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_content
    rescue StandardError => e
      logger.error "Order creation failed: #{e.class} - #{e.message}"
      logger.error e.backtrace.join("\n")
      render json: { error: "An unexpected error occurred while creating the order" }, status: :internal_server_error
    end

    # GET /api/orders/:order_id
    # Retrieves order details by PayPilot order ID (UUID).
    def show
      @order = order_service.get_order(params[:order_id] || params[:order_number])

      if @order.nil?
        logger.error "Order: #{params[:order_id]} not found"
        return render json: { error: "Order not found" }, status: :not_found
      end

      render json: { order: @order }
    end

    private

    def order_service
      @order_service ||= OrderService.new
    end
  end
end
