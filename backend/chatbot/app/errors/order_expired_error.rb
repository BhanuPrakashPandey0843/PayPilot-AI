class OrderExpiredError < StandardError
  attr_reader :order

  def initialize(order)
    @order = order
    super("Order #{order.order_number} has expired")
  end
end
