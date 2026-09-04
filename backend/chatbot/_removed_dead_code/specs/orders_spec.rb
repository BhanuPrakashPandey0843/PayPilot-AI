require 'rails_helper'

RSpec.describe 'Api::Orders', type: :request do
  let(:session_id) { 'test-session-123' }
  let!(:product1) { Product.create!(name: 'Red Shirt', description: 'A nice red shirt', price: 29.99, inventory_quantity: 100) }
  let!(:product2) { Product.create!(name: 'Blue Jeans', description: 'Comfortable jeans', price: 49.99, inventory_quantity: 50) }
  let!(:product3) { Product.create!(name: 'Green Hat', description: 'Stylish hat', price: 19.99, inventory_quantity: 5) }

  describe 'POST /api/orders' do
    it 'creates pending order from basket with correct details' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 2, price_at_addition: product1.price)
      BasketItem.create!(basket: basket, product: product2, quantity: 1, price_at_addition: product2.price)

      post '/api/orders', params: { session_id: session_id }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      
      expect(json['message']).to eq('Order created successfully')
      expect(json['order']['order_number']).to match(/^ORD-\d{8}-[A-Z0-9]{8}$/)
      expect(json['order']['total_amount']).to eq('109.97')
      expect(json['order']['status']).to eq('pending')
      expect(json['order']['items'].length).to eq(2)
    end

    it 'does not deduct inventory or clear basket for pending order' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 3, price_at_addition: product1.price)

      initial_inventory = product1.inventory_quantity

      post '/api/orders', params: { session_id: session_id }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:created)
      
      product1.reload
      expect(product1.inventory_quantity).to eq(initial_inventory)
      
      basket.reload
      expect(basket.basket_items.count).to eq(1)
    end

    it 'returns error when session_id is missing' do
      post '/api/orders', params: {}, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['error']).to eq('session_id is required')
    end

    it 'returns error when basket is empty' do
      Basket.create!(session_id: session_id)

      post '/api/orders', params: { session_id: session_id }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['error']).to eq('Cannot create order from empty basket')
    end

    it 'rolls back transaction on insufficient inventory' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 2, price_at_addition: product1.price)
      BasketItem.create!(basket: basket, product: product3, quantity: 10, price_at_addition: product3.price)

      initial_inventory1 = product1.inventory_quantity
      initial_order_count = Order.count

      post '/api/orders', params: { session_id: session_id }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)['error']).to include('Insufficient inventory')
      
      # Verify complete rollback
      expect(Order.count).to eq(initial_order_count)
      product1.reload
      expect(product1.inventory_quantity).to eq(initial_inventory1)
      basket.reload
      expect(basket.basket_items.count).to eq(2)
    end

    it 'reserves inventory when creating pending orders' do
      basket1 = Basket.create!(session_id: 'session-1')
      BasketItem.create!(basket: basket1, product: product3, quantity: 3, price_at_addition: product3.price)

      basket2 = Basket.create!(session_id: 'session-2')
      BasketItem.create!(basket: basket2, product: product3, quantity: 2, price_at_addition: product3.price)

      # First order reserves 3 units
      post '/api/orders', params: { session_id: 'session-1' }, headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:created)
      
      product3.reload
      expect(product3.inventory_quantity).to eq(5)  # Not deducted yet
      expect(product3.reserved_quantity).to eq(3)   # But reserved
      
      # Second order reserves 2 more units
      post '/api/orders', params: { session_id: 'session-2' }, headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:created)
      
      product3.reload
      expect(product3.inventory_quantity).to eq(5)  # Still not deducted
      expect(product3.reserved_quantity).to eq(5)   # All reserved now
    end
  end

  describe 'GET /api/orders/:order_number' do
    it 'retrieves order by order_number' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 3, price_at_addition: product1.price)

      post '/api/orders', params: { session_id: session_id }, headers: { 'Accept' => 'application/json' }
      order_number = JSON.parse(response.body)['order']['order_number']

      get "/api/orders/#{order_number}", headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json['order']['order_number']).to eq(order_number)
      expect(json['order']['status']).to eq('pending')
      expect(json['order']['items'][0]['product_name']).to eq('Red Shirt')
      expect(json['order']['items'][0]['quantity']).to eq(3)
    end

    it 'returns 404 for non-existent order' do
      get '/api/orders/ORD-20250112-NOTFOUND', headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['error']).to eq('Order not found')
    end
  end
end
