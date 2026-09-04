# DEPRECATED: no longer the source of truth for product data. The chatbot
# now reads the live catalog from the real PayPilot AI backend via
# PaypilotApiClient/ProductSearchService (see app/services/). Kept only so
# existing migrations/db:setup don't break; not queried by any active
# controller, service, or agent. Safe to drop in a future cleanup once
# confirmed unused.
class Product < ApplicationRecord
  include PgSearch::Model

  # Validations
  validates :name, presence: true
  validates :description, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :inventory_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :reserved_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Associations
  has_many :basket_items, dependent: :restrict_with_error
  has_many :order_items, dependent: :restrict_with_error

  # Scopes
  scope :available, -> { where('inventory_quantity > 0') }

  pg_search_scope :search_product,
                  against: { name: 'A', description: 'B' },
                  using: {
                    tsearch: {
                      dictionary: 'english',
                      tsvector_column: 'ts_vector',
                    }
                  },
                  ranked_by: ':tsearch'

  # Instance methods
  def available?
    inventory_quantity > 0
  end

  def available_quantity
    inventory_quantity - reserved_quantity
  end

  # Atomically increments inventory using a single SQL UPDATE.
  #
  # @param quantity [Integer] Amount to increment
  # @return [void]
  def increment_inventory!(quantity)
    self.class.where(id: id)
        .update_all(['inventory_quantity = inventory_quantity + ?', quantity])
    reload
  end

  # Atomically fulfills reserved inventory by decrementing both inventory and reserved quantities.
  #
  # @param quantity [Integer] Amount to fulfill
  # @raise [ArgumentError] if insufficient reserved quantity
  # @return [void]
  def fulfill_reserved_inventory!(quantity)
    rows_updated = self.class.where(id: id)
                       .where('reserved_quantity >= ?', quantity)
                       .where('inventory_quantity >= ?', quantity)
                       .update_all([
                         'inventory_quantity = inventory_quantity - ?, reserved_quantity = reserved_quantity - ?',
                         quantity, quantity
                       ])
    
    if rows_updated == 0
      reload
      raise ArgumentError, "Cannot fulfill #{quantity} units: inventory=#{inventory_quantity}, reserved=#{reserved_quantity}"
    end
    
    reload
  end


  # Atomically reserves inventory by incrementing reserved_quantity.
  # If insufficient available inventory, raises an error.
  #
  # @param quantity [Integer] Amount to reserve
  # @raise [InsufficientInventoryError] if insufficient available inventory
  # @return [void]
  def reserve_inventory!(quantity)
    rows_updated = self.class.where(id: id)
                       .where('inventory_quantity - reserved_quantity >= ?', quantity)
                       .update_all(['reserved_quantity = reserved_quantity + ?', quantity])
    
    if rows_updated == 0
      reload
      raise InsufficientInventoryError.new(name, available_quantity, quantity)
    end
    
    reload
  end

  # Atomically releases reserved inventory by decrementing reserved_quantity.
  #
  # @param quantity [Integer] Amount to release
  # @return [void]
  def release_inventory!(quantity)
    rows_updated = self.class.where(id: id)
                       .where('reserved_quantity >= ?', quantity)
                       .update_all(['reserved_quantity = reserved_quantity - ?', quantity])
    
    if rows_updated == 0
      reload
      raise ArgumentError, "Cannot release #{quantity} units: only #{reserved_quantity} reserved"
    end
    
    reload
  end
end
