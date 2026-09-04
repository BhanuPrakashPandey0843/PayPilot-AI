# DEPRECATED — see app/models/basket.rb. Not queried by any active code path.
class BasketItem < ApplicationRecord
  # Associations
  belongs_to :basket, touch: true
  belongs_to :product

  # Validations
  validates :quantity, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :price_at_addition, presence: true, numericality: { greater_than: 0 }
  validates :product_id, uniqueness: { scope: :basket_id }

  # Instance methods
  def line_total
    quantity * price_at_addition
  end
end
