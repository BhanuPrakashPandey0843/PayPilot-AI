require 'rails_helper'

RSpec.describe BasketService do
  let(:basket) { Basket.create!(session_id: 'test-session') }
  let(:product) { Product.create!(name: 'Test Product', description: 'Description', price: 10.00, inventory_quantity: 100) }

  describe '.add_item' do
    it 'adds item to basket' do
      result = described_class.add_item(basket, product, 5)

      expect(result.quantity).to eq(5)
      expect(basket.basket_items.count).to eq(1)
    end

    it 'increments quantity for existing item' do
      described_class.add_item(basket, product, 3)
      described_class.add_item(basket, product, 2)

      basket.reload
      expect(basket.basket_items.first.quantity).to eq(5)
    end

    it 'raises error with insufficient inventory' do
      expect {
        described_class.add_item(basket, product, 150)
      }.to raise_error(InsufficientInventoryError) do |error|
        expect(error.available).to eq(100)
      end
    end
  end

  describe '.update_item_quantity' do
    it 'updates item quantity' do
      BasketItem.create!(basket: basket, product: product, quantity: 5, price_at_addition: product.price)

      result = described_class.update_item_quantity(basket, product, 8)

      expect(result.quantity).to eq(8)
    end

    it 'raises error when item not in basket' do
      other_product = Product.create!(name: 'Other', description: 'Other', price: 5.00, inventory_quantity: 10)

      expect {
        described_class.update_item_quantity(basket, other_product, 5)
      }.to raise_error(ArgumentError, 'Item not in basket')
    end
  end

  describe '.remove_item' do
    it 'removes item from basket' do
      BasketItem.create!(basket: basket, product: product, quantity: 5, price_at_addition: product.price)

      described_class.remove_item(basket, product)

      basket.reload
      expect(basket.basket_items.count).to eq(0)
    end

    it 'raises error when item not in basket' do
      expect {
        described_class.remove_item(basket, product)
      }.to raise_error(ArgumentError, 'Item not in basket')
    end
  end

  describe '.clear_basket' do
    it 'removes all items from basket' do
      BasketItem.create!(basket: basket, product: product, quantity: 3, price_at_addition: product.price)

      described_class.clear_basket(basket)

      basket.reload
      expect(basket.basket_items.count).to eq(0)
    end
  end
end
