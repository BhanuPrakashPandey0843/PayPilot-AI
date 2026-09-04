json.order do
  json.partial! 'api/orders/order', order: @order
end
json.message 'Order created successfully'
