class InsufficientInventoryError < StandardError
  attr_reader :product_name, :available, :requested

  # @param product_name [String] The product with insufficient inventory
  # @param available [Integer] Current available inventory quantity
  # @param requested [Integer] Quantity that was requested
  def initialize(product_name, available, requested)
    @product_name = product_name
    @available = available
    @requested = requested
    super("Insufficient inventory for #{product_name}. Available: #{available}, Requested: #{requested}")
  end
end
