require 'rails_helper'

RSpec.describe OrderService do
  let(:session_id) { 'test-session-123' }
  let!(:product1) { Product.create!(name: 'Product 1', description: 'Description 1', price: 25.00, inventory_quantity: 100) }
  let!(:product2) { Product.create!(name: 'Product 2', description: 'Description 2', price: 50.00, inventory_quantity: 50) }
  let!(:product3) { Product.create!(name: 'Limited Product', description: 'Low stock', price: 10.00, inventory_quantity: 3) }

  describe '.create_from_basket' do
    it 'creates pending order with correct attributes and order items' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 2, price_at_addition: product1.price)
      BasketItem.create!(basket: basket, product: product2, quantity: 1, price_at_addition: product2.price)

      order = OrderService.create_from_basket(basket)

      expect(order).to be_persisted
      expect(order.session_id).to eq(session_id)
      expect(order.total_amount).to eq(100.00)
      expect(order.status).to eq('pending')
      expect(order.order_number).to match(/^ORD-\d{8}-[A-Z0-9]{8}$/)
      expect(order.order_items.count).to eq(2)
      expect(order.expires_at).to be_present
    end

    it 'uses price_at_addition not current product price' do
      basket = Basket.create!(session_id: session_id)
      original_price = 30.00
      BasketItem.create!(basket: basket, product: product1, quantity: 1, price_at_addition: original_price)

      product1.update!(price: 40.00)

      order = OrderService.create_from_basket(basket)
      order_item = order.order_items.first

      expect(order_item.price).to eq(original_price)
      expect(order.total_amount).to eq(original_price)
    end

    it 'does not deduct inventory or clear basket for pending order' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 5, price_at_addition: product1.price)

      initial_inventory = product1.inventory_quantity

      OrderService.create_from_basket(basket)

      product1.reload
      expect(product1.inventory_quantity).to eq(initial_inventory)
      
      basket.reload
      expect(basket.basket_items.count).to eq(1)
    end

    it 'raises error when basket is nil' do
      expect {
        OrderService.create_from_basket(nil)
      }.to raise_error(ArgumentError, 'Basket cannot be nil')
    end

    it 'raises error when basket is empty' do
      basket = Basket.create!(session_id: session_id)

      expect {
        OrderService.create_from_basket(basket)
      }.to raise_error(ActiveRecord::RecordInvalid, /Basket is empty/)
    end

    it 'raises error and does not create order on insufficient inventory' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product3, quantity: 10, price_at_addition: product3.price)

      initial_order_count = Order.count
      initial_inventory = product3.inventory_quantity

      expect {
        OrderService.create_from_basket(basket)
      }.to raise_error(InsufficientInventoryError, /Insufficient inventory/)

      expect(Order.count).to eq(initial_order_count)
      product3.reload
      expect(product3.inventory_quantity).to eq(initial_inventory)
    end

    it 'rolls back all changes when one item has insufficient inventory' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 5, price_at_addition: product1.price)
      BasketItem.create!(basket: basket, product: product3, quantity: 10, price_at_addition: product3.price)

      initial_inventory1 = product1.inventory_quantity
      initial_order_count = Order.count

      expect {
        OrderService.create_from_basket(basket)
      }.to raise_error(InsufficientInventoryError)

      expect(Order.count).to eq(initial_order_count)
      product1.reload
      expect(product1.inventory_quantity).to eq(initial_inventory1)
      basket.reload
      expect(basket.basket_items.count).to eq(2)
    end
  end

  describe '.confirm_order' do
    it 'confirms pending order, deducts inventory and clears basket' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 5, price_at_addition: product1.price)

      order = OrderService.create_from_basket(basket)
      initial_inventory = product1.inventory_quantity

      confirmed_order = OrderService.confirm_order(order)

      expect(confirmed_order.status).to eq('completed')

      product1.reload
      expect(product1.inventory_quantity).to eq(initial_inventory - 5)

      basket.reload
      expect(basket.basket_items.count).to eq(0)
    end

    it 'raises error for expired order' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 1, price_at_addition: product1.price)

      order = OrderService.create_from_basket(basket)
      order.update!(expires_at: 1.hour.ago)

      expect {
        OrderService.confirm_order(order)
      }.to raise_error(OrderExpiredError)
    end
  end

  describe '.cancel_order' do
    it 'cancels pending order' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 1, price_at_addition: product1.price)

      order = OrderService.create_from_basket(basket)
      cancelled_order = OrderService.cancel_order(order)

      expect(cancelled_order.status).to eq('cancelled')
    end

    it 'raises error when trying to cancel non-pending order' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 1, price_at_addition: product1.price)

      order = OrderService.create_from_basket(basket)
      OrderService.confirm_order(order)

      expect {
        OrderService.cancel_order(order)
      }.to raise_error(ArgumentError, /Only pending orders can be cancelled/)
    end
  end
end
