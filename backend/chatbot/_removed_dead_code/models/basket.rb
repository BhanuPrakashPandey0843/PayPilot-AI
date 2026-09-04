# DEPRECATED: cart state now lives server-side in PayPilot's real backend
# (Redis-backed commerce-agent session, keyed by session_id) — see
# app/services/basket_service.rb / PaypilotApiClient. Kept only so existing
# migrations/db:setup don't break; not queried by any active controller,
# service, or agent. Safe to drop in a future cleanup once confirmed unused.
class Basket < ApplicationRecord
  # Validations
  validates :session_id, presence: true, uniqueness: true

  # Associations
  has_many :basket_items, dependent: :destroy

  # Instance methods
  
  # Calculates the total price of all items in the basket.
  #
  # @return [BigDecimal] Total price
  def total_price
    basket_items.sum(&:line_total)
  end

  # Adds a product to the basket or increments quantity if already present.
  # Snapshots the current product price at time of addition.
  #
  # @param product [Product] The product to add
  # @param quantity [Integer] Quantity to add
  # @param basket_item [BasketItem, nil] Optional pre-fetched basket item to avoid duplicate query
  # @return [BasketItem] The created or updated basket item
  def add_product(product, quantity, basket_item = nil)
    basket_item ||= basket_items.find_or_initialize_by(product: product)
    
    if basket_item.persisted?
      basket_item.update!(quantity: basket_item.quantity + quantity)
    else
      basket_item.quantity = quantity
      basket_item.price_at_addition = product.price
      basket_item.save!
    end
    
    basket_item
  end

  # Removes a product from the basket or decrements its quantity.
  # If quantity is nil or exceeds current quantity, removes the item entirely.
  #
  # @param product [Product] The product to remove
  # @param quantity [Integer, nil] Quantity to remove (nil = remove all)
  # @param basket_item [BasketItem, nil] Optional pre-fetched basket item to avoid duplicate query
  # @return [Boolean] true if item was found and removed/updated, false if not found
  def remove_product(product, quantity = nil, basket_item=nil)
    basket_item ||= basket_items.find_by(product: product)
    return false unless basket_item

    if quantity.nil? || basket_item.quantity <= quantity
      basket_item.destroy!
    else
      basket_item.update!(quantity: basket_item.quantity - quantity)
    end
    
    true
  end

  def clear
    basket_items.destroy_all
  end

  def expired?
    updated_at < 90.days.ago
  end

  # Class methods
  
  # Finds or creates a basket for the given session.
  #
  # @param session_id [String] The session identifier
  # @return [Basket] The found or created basket
  def self.find_or_create_by_session(session_id)
    find_or_create_by(session_id: session_id)
  end

  # Removes baskets that haven't been updated in the specified number of days.
  #
  # @param days_ago [Integer] Number of days of inactivity (default: 90)
  # @return [Integer] Number of baskets deleted
  def self.cleanup_expired(days_ago = 90)
    where('updated_at < ?', days_ago.days.ago).destroy_all
  end
end
