# DEPRECATED — see app/models/order.rb. Not queried by any active code path.
class OrderItem < ApplicationRecord
  # Associations
  belongs_to :order
  belongs_to :product

  # Validations
  validates :quantity, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :product_name, presence: true

  # Instance methods
  
  # Calculates the line total for this order item.
  #
  # @return [BigDecimal] Line total (quantity * price)
  def line_total
    quantity * price
  end
end
