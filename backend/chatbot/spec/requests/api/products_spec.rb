require 'rails_helper'

RSpec.describe 'Api::Products', type: :request do
  describe 'GET /api/products' do
    let!(:products) do
      [
        Product.create!(
          name: 'Red T-Shirt',
          description: 'A comfortable red t-shirt',
          price: 29.99,
          inventory_quantity: 10,
          product_attributes: { color: 'red', size: 'medium', category: 'clothing' }
        ),
        Product.create!(
          name: 'Blue Jeans',
          description: 'Classic blue denim jeans',
          price: 59.99,
          inventory_quantity: 5,
          product_attributes: { color: 'blue', size: 'large', category: 'clothing' }
        )
      ]
    end
    
    it 'returns all available products with pagination' do
      get '/api/products', headers: { 'Accept' => 'application/json' }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json['products'].length).to eq(2)
      expect(json['pagination']).to include('current_page' => 1, 'total_count' => 2)
    end
    
    it 'excludes products with zero inventory' do
      Product.create!(
        name: 'Out of Stock Item',
        description: 'This item is out of stock',
        price: 19.99,
        inventory_quantity: 0,
        product_attributes: { color: 'black' }
      )
      
      get '/api/products', headers: { 'Accept' => 'application/json' }
      json = JSON.parse(response.body)
      
      expect(json['products'].length).to eq(2)
      expect(json['products'].map { |p| p['name'] }).not_to include('Out of Stock Item')
    end
  end
  
  describe 'GET /api/products/:id' do
    let!(:product) do
      Product.create!(
        name: 'Test Product',
        description: 'A test product',
        price: 49.99,
        inventory_quantity: 8,
        product_attributes: { color: 'red', size: 'large' }
      )
    end
    
    it 'returns the product' do
      get "/api/products/#{product.id}", headers: { 'Accept' => 'application/json' }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json['product']).to include(
        'name' => 'Test Product',
        'price' => '49.99',
        'inventory_quantity' => 8
      )
    end
    
    it 'returns 404 for non-existent product' do
      get '/api/products/99999', headers: { 'Accept' => 'application/json' }
      
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['error']).to eq('Product not found')
    end
  end
  
  describe 'GET /api/products/search' do
    let!(:products) do
      [
        Product.create!(
          name: 'Red Cotton T-Shirt',
          description: 'Comfortable cotton t-shirt in red',
          price: 25.00,
          inventory_quantity: 10,
          product_attributes: { color: 'red', size: 'medium', category: 'clothing', material: 'cotton' }
        ),
        Product.create!(
          name: 'Blue Silk Shirt',
          description: 'Elegant silk shirt in blue',
          price: 75.00,
          inventory_quantity: 5,
          product_attributes: { color: 'blue', size: 'large', category: 'clothing', material: 'silk' }
        ),
        Product.create!(
          name: 'Red Leather Jacket',
          description: 'Stylish leather jacket in red',
          price: 150.00,
          inventory_quantity: 3,
          product_attributes: { color: 'red', size: 'medium', category: 'outerwear', material: 'leather' }
        )
      ]
    end
    
    it 'searches by text query' do
      get '/api/products/search', params: { query: 'shirt' }, headers: { 'Accept' => 'application/json' }
      
      json = JSON.parse(response.body)
      expect(json['products'].length).to eq(2)
      expect(json['products'].map { |p| p['name'] }).to include('Red Cotton T-Shirt', 'Blue Silk Shirt')
    end
    
    it 'filters by price range' do
      get '/api/products/search', params: { min_price: 30, max_price: 100 }, headers: { 'Accept' => 'application/json' }
      
      json = JSON.parse(response.body)
      expect(json['products'].length).to eq(1)
      expect(json['products'].first['name']).to eq('Blue Silk Shirt')
    end
    
    it 'filters by JSONB attributes' do
      get '/api/products/search', params: { color: 'red', size: 'medium' }, headers: { 'Accept' => 'application/json' }
      
      json = JSON.parse(response.body)
      expect(json['products'].length).to eq(2)
      expect(json['products'].map { |p| p['name'] }).to include('Red Cotton T-Shirt', 'Red Leather Jacket')
    end
    
    it 'applies combined filters' do
      get '/api/products/search', params: { color: 'red', max_price: 100, query: 'shirt' }, headers: { 'Accept' => 'application/json' }
      
      json = JSON.parse(response.body)
      expect(json['products'].length).to eq(1)
      expect(json['products'].first['name']).to eq('Red Cotton T-Shirt')
    end
    
    it 'returns empty array when no results match' do
      get '/api/products/search', params: { color: 'purple' }, headers: { 'Accept' => 'application/json' }
      
      json = JSON.parse(response.body)
      expect(json['products']).to eq([])
      expect(json['pagination']['total_count']).to eq(0)
    end
    
    it 'is case insensitive for attribute filters' do
      get '/api/products/search', params: { color: 'RED' }, headers: { 'Accept' => 'application/json' }
      
      json = JSON.parse(response.body)
      expect(json['products'].length).to eq(2)
      expect(json['products'].map { |p| p['name'] }).to include('Red Cotton T-Shirt', 'Red Leather Jacket')
    end
  end
end
