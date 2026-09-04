module Api
  module Webhooks
    # DEPRECATED — no longer routed (see config/routes.rb).
    #
    # This controller used to power a *fake* payment provider: the frontend's
    # mockPaymentService.ts called this directly with a hardcoded
    # "payment.succeeded"/"payment.failed" event and it updated a local
    # Order/Payment record.
    #
    # Real payments now go through PayPilot's own Razorpay integration:
    #   - PayPilot's backend verifies the Razorpay webhook itself
    #     (POST /api/v1/webhooks/razorpay on the PayPilot server — never this
    #     Rails app).
    #   - This Rails app's frontend instead calls Api::PaymentsController#verify
    #     (POST /api/payments/verify) after a real Razorpay Checkout.js
    #     success callback, which forwards to PayPilot's
    #     POST /checkout/verify-payment for server-side signature
    #     verification. See app/controllers/api/payments_controller.rb.
    #
    # Kept only as a historical reference; not wired into config/routes.rb.
    class PaymentsController < ApplicationController
      def create
        render json: { error: "This endpoint is deprecated. Use POST /api/payments/verify instead." },
               status: :gone
      end
    end
  end
end
