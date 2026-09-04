require 'rails_helper'

RSpec.describe ProductSearchService do
  let(:service) { described_class.new }

  let!(:red_shirt) do
    Product.create!(
      name: 'Red Cotton Shirt',
      description: 'Comfortable cotton shirt',
      price: 25.00,
      inventory_quantity: 50,
      product_attributes: { color: 'red', size: 'medium', category: 'shirts' }
    )
  end

  let!(:blue_shirt) do
    Product.create!(
      name: 'Blue Denim Shirt',
      description: 'Classic denim shirt',
      price: 35.00,
      inventory_quantity: 30,
      product_attributes: { color: 'blue', size: 'large', category: 'shirts' }
    )
  end

  let!(:expensive_jacket) do
    Product.create!(
      name: 'Premium Leather Jacket',
      description: 'High-quality leather',
      price: 150.00,
      inventory_quantity: 10,
      product_attributes: { color: 'black', size: 'large', category: 'jackets' }
    )
  end

  let!(:out_of_stock) do
    Product.create!(
      name: 'Sold Out Item',
      description: 'Not available',
      price: 20.00,
      inventory_quantity: 0
    )
  end

  describe '#search' do
    it 'returns only products with inventory' do
      results = service.search({})

      expect(results.count).to eq(3)
      expect(results).not_to include(out_of_stock)
    end

    it 'filters by text query in name and description' do
      results = service.search({ query: 'shirt' })

      expect(results.count).to eq(2)
      expect(results).to include(red_shirt, blue_shirt)
      expect(results).not_to include(expensive_jacket)
    end

    it 'filters by price range' do
      results = service.search({ min_price: 30.0, max_price: 100.0 })

      expect(results.count).to eq(1)
      expect(results.first).to eq(blue_shirt)
    end

    it 'filters by JSONB attributes' do
      results = service.search({ attributes: { color: 'red' } })

      expect(results.count).to eq(1)
      expect(results.first).to eq(red_shirt)
    end

    it 'combines multiple filters' do
      results = service.search({
        query: 'shirt',
        max_price: 30.0,
        attributes: { color: 'red' }
      })

      expect(results.count).to eq(1)
      expect(results.first).to eq(red_shirt)
    end
  end
end
