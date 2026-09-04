# DEPRECATED: payment records now live in PayPilot's own backend, confirmed
# via its Razorpay webhook and POST /checkout/verify-payment — see
# app/services/order_service.rb and app/controllers/api/payments_controller.rb.
# Kept only so existing migrations/db:setup don't break; not queried by any
# active controller, service, or agent. Safe to drop in a future cleanup once
# confirmed unused.
class Payment < ApplicationRecord
  # Associations
  belongs_to :order

  # Validations
  validates :payment_id, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: %w[succeeded failed] }
  validates :amount, presence: true, numericality: { greater_than: 0 }

  # Scopes
  scope :succeeded, -> { where(status: 'succeeded') }
  scope :failed, -> { where(status: 'failed') }
end
