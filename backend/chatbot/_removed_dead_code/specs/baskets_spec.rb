require 'rails_helper'

RSpec.describe 'Api::Baskets', type: :request do
  let(:session_id) { 'test-session-123' }
  let!(:product1) { Product.create!(name: 'Test Product 1', description: 'Description 1', price: 10.00, inventory_quantity: 100) }
  let!(:product2) { Product.create!(name: 'Test Product 2', description: 'Description 2', price: 20.00, inventory_quantity: 50) }

  describe 'GET /api/baskets/:session_id' do
    it 'returns basket with items and total' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 2, price_at_addition: product1.price)

      get "/api/baskets/#{session_id}", headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items'].length).to eq(1)
      expect(json['items'][0]['quantity']).to eq(2)
      expect(json['total']).to eq('20.0')
    end
  end

  describe 'POST /api/baskets/:session_id/items' do
    it 'adds item to basket' do
      post "/api/baskets/#{session_id}/items", params: { product_id: product1.id, quantity: 3 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['items'][0]['quantity']).to eq(3)
      expect(json['total']).to eq('30.0')
    end

    it 'increments quantity for existing item' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 2, price_at_addition: product1.price)

      post "/api/baskets/#{session_id}/items", params: { product_id: product1.id, quantity: 3 }, headers: { 'Accept' => 'application/json' }

      json = JSON.parse(response.body)
      expect(json['items'][0]['quantity']).to eq(5)
    end

    it 'returns error with insufficient inventory' do
      post "/api/baskets/#{session_id}/items", params: { product_id: product1.id, quantity: 150 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json['error']).to include('Insufficient inventory')
      expect(json['available']).to eq(100)
    end

    it 'returns error for invalid quantity' do
      post "/api/baskets/#{session_id}/items", params: { product_id: product1.id, quantity: 0 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json['error']).to include('Quantity must be greater than 0')
    end
  end

  describe 'PATCH /api/baskets/:session_id/items/:product_id' do
    it 'updates item quantity' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 5, price_at_addition: product1.price)

      patch "/api/baskets/#{session_id}/items/#{product1.id}", params: { quantity: 8 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items'][0]['quantity']).to eq(8)
    end

    it 'returns error when item not in basket' do
      Basket.create!(session_id: session_id)

      patch "/api/baskets/#{session_id}/items/#{product2.id}", params: { quantity: 5 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json['error']).to include('Item not in basket')
    end
  end

  describe 'DELETE /api/baskets/:session_id/items/:product_id' do
    it 'removes entire item from basket' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 3, price_at_addition: product1.price)
      BasketItem.create!(basket: basket, product: product2, quantity: 2, price_at_addition: product2.price)

      delete "/api/baskets/#{session_id}/items/#{product1.id}", headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items'].length).to eq(1)
      expect(json['items'][0]['product_id']).to eq(product2.id)
    end

    it 'decrements item quantity when quantity param provided' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 5, price_at_addition: product1.price)

      delete "/api/baskets/#{session_id}/items/#{product1.id}", params: { quantity: 2 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items'][0]['quantity']).to eq(3)
    end

    it 'removes item when decrement quantity exceeds current quantity' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 3, price_at_addition: product1.price)

      delete "/api/baskets/#{session_id}/items/#{product1.id}", params: { quantity: 5 }, headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items']).to eq([])
    end

    it 'returns error when item not in basket' do
      Basket.create!(session_id: session_id)

      delete "/api/baskets/#{session_id}/items/#{product1.id}", headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json['error']).to eq('Item not in basket')
    end
  end

  describe 'DELETE /api/baskets/:session_id' do
    it 'clears all items from basket' do
      basket = Basket.create!(session_id: session_id)
      BasketItem.create!(basket: basket, product: product1, quantity: 3, price_at_addition: product1.price)

      delete "/api/baskets/#{session_id}", headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items']).to eq([])
      expect(json['total']).to eq(0)
    end
  end
end
