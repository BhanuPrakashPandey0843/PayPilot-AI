module Api
  class PaymentsController < ApplicationController
    # Replaces the old app/controllers/api/webhooks/payments_controller.rb
    # (which faked payment success/failure via a local mock webhook — see
    # app/javascript/services/mockPaymentService.ts, now retired).
    #
    # Real Razorpay confirmation flow:
    #   1. Frontend gets { razorpay_order_id, razorpay_key_id, amount, currency }
    #      back from POST /api/orders (which calls PayPilot's real
    #      /checkout/create-order).
    #   2. Frontend opens Razorpay Checkout.js with that order (see
    #      app/javascript/services/razorpayService.ts).
    #   3. On success, Razorpay's JS callback hands the frontend
    #      { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
    #   4. Frontend POSTs those here. We NEVER trust that client callback by
    #      itself — this action forwards them to PayPilot's
    #      POST /checkout/verify-payment, which re-verifies the HMAC
    #      signature server-side against RAZORPAY_KEY_SECRET before
    #      confirming anything.
    #   5. On verified success/failure we push a system message into the
    #      chat conversation (if one is associated) so the agent can react
    #      naturally on the buyer's next turn or reconnect.
    #
    # POST /api/payments/verify
    def verify
      razorpay_order_id = params[:razorpay_order_id]
      razorpay_payment_id = params[:razorpay_payment_id]
      razorpay_signature = params[:razorpay_signature]

      if razorpay_order_id.blank? || razorpay_payment_id.blank? || razorpay_signature.blank?
        return render json: { error: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required" },
                      status: :bad_request
      end

      result = order_service.verify_payment(
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature
      )

      notify_conversation(result, success: true)
      render json: { status: "verified", order: result }
    rescue PaypilotApiClient::ApiError => e
      notify_conversation({ order_id: nil, status: "failed" }, success: false)
      render json: { error: e.message }, status: :unprocessable_content
    end

    private

    def order_service
      @order_service ||= OrderService.new
    end

    def notify_conversation(result, success:)
      conversation_id = params[:conversation_id]
      return if conversation_id.blank?

      conversation = Conversation.find_by(id: conversation_id)
      PaymentService.notify_agent_of_payment_status(conversation, result, success)
    end
  end
end
