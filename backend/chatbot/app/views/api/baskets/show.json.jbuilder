json.session_id @basket.session_id
json.items @basket.basket_items.includes(:product) do |item|
  json.product_id item.product.id
  json.product_name item.product.name
  json.quantity item.quantity
  json.price item.price_at_addition
  json.line_total item.line_total
end
json.total @basket.total_price
json.updated_at @basket.updated_at
