json.order_number order.order_number
json.total_amount order.total_amount.to_s
json.status order.status
json.items order.order_items do |item|
  json.product_name item.product_name
  json.quantity item.quantity
  json.price item.price.to_s
  json.line_total item.line_total.to_s
end
json.created_at order.created_at.iso8601
