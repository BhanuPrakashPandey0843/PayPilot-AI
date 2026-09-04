json.product do
  json.id @product.id
  json.name @product.name
  json.description @product.description
  json.price @product.price
  json.inventory_quantity @product.inventory_quantity
  json.product_attributes @product.product_attributes
end
