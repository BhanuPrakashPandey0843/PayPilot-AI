class CreateProducts < ActiveRecord::Migration[8.0]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.text :description, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.integer :inventory_quantity, null: false, default: 0
      t.jsonb :product_attributes, default: {}

      t.timestamps
    end

    add_index :products, :name
    add_index :products, :product_attributes, using: :gin
    add_index :products, :inventory_quantity, where: "inventory_quantity > 0"
    add_check_constraint :products, "price > 0", name: "products_price_positive"
    add_check_constraint :products, "inventory_quantity >= 0", name: "products_inventory_non_negative"
  end
end
