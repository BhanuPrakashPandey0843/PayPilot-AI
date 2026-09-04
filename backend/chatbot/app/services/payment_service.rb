# PaymentService
#
# Rewired: PayPilot's own backend now owns payment state (its Razorpay
# webhook confirms/fails orders server-to-server — see
# documentation/Backend_API_Reference.md §8). This service's job shrinks
# to exactly one thing: after the frontend's Razorpay Checkout.js callback
# fires and Api::PaymentsController#verify has server-side-verified the
# signature via PaypilotApiClient#verify_payment, push a system message
# into the chat conversation and let CartAgent generate a natural-language
# response — mirroring how the original template notified the agent from
# its (now removed) local payment webhook.
class PaymentService
  # @param conversation [Conversation, nil]
  # @param order [Hash] result of OrderService#verify_payment — { order_id:, status:, payment_id: }
  # @param success [Boolean]
  def self.notify_agent_of_payment_status(conversation, order, success)
    return if conversation.nil?

    message = success ? build_success_system_message(order) : build_failure_system_message(order)
    conversation.messages = conversation.messages + [message]
    conversation.save!

    context = {
      conversation_id: conversation.id,
      session_id: conversation.session_id,
      messages: conversation.messages
    }

    CartAgent.instance.run_stream("", conversation.session_id, context: context) do |chunk|
      if chunk[:type] == "done"
        conversation.messages.last["ui_context"] = chunk[:ui_context] if chunk[:ui_context]
        conversation.save!
      end
    end
  rescue StandardError => e
    Rails.logger.error "PaymentService: failed to notify agent of payment status: #{e.message}"
  end

  def self.build_success_system_message(order)
    {
      "role" => "system",
      "content" => <<~MSG
        PAYMENT COMPLETED SUCCESSFULLY
        - Order ID: #{order[:order_id]}
        - Status: #{order[:status]}

        Inform the user their payment succeeded and the order is confirmed.
        Look up the order details first (view_order) and then show the order
        confirmation UI based on that data. Make it engaging — offer to help
        with anything else or suggest related products.
      MSG
    }
  end

  def self.build_failure_system_message(order)
    {
      "role" => "system",
      "content" => <<~MSG
        PAYMENT FAILED OR COULD NOT BE VERIFIED
        - Order ID: #{order[:order_id]}
        - Status: #{order[:status]}

        Inform the user their payment did not go through and offer to help
        them try again with a different payment method.
      MSG
    }
  end
end
