json.products @products do |product|
  json.id product.id
  json.name product.name
  json.description product.description
  json.price product.price
  json.inventory_quantity product.inventory_quantity
  json.product_attributes product.product_attributes
end

json.filters_applied @filters

json.pagination do
  json.current_page @pagy.page
  json.per_page @pagy.offset
  json.total_count @pagy.count
  json.total_pages @pagy.pages
  json.prev_page @pagy.prev
  json.next_page @pagy.next
end
