class CreateOrderItems < ActiveRecord::Migration[8.0]
  def change
    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: { on_delete: :cascade }
      t.references :product, null: false, foreign_key: { on_delete: :restrict }
      t.integer :quantity, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :product_name, null: false

      t.timestamps
    end

    add_check_constraint :order_items, "quantity > 0", name: "order_items_quantity_positive"
  end
end
