require 'rails_helper'

RSpec.describe Product, type: :model do
  it 'is valid with valid attributes' do
    product = Product.new(
      name: 'Test Product',
      description: 'A test product',
      price: 10.0,
      inventory_quantity: 5
    )
    expect(product).to be_valid
  end

  it 'is invalid without a name' do
    product = Product.new(
      name: nil,
      description: 'A test product',
      price: 10.0,
      inventory_quantity: 5
    )
    expect(product).not_to be_valid
    expect(product.errors[:name]).to include("can't be blank")
  end

  it 'is invalid with negative price' do
    product = Product.new(
      name: 'Test Product',
      description: 'A test product',
      price: -10.0,
      inventory_quantity: 5
    )
    expect(product).not_to be_valid
    expect(product.errors[:price]).to include("must be greater than 0")
  end
end
