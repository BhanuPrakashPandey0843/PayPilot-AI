class CreateBasketItems < ActiveRecord::Migration[8.0]
  def change
    create_table :basket_items do |t|
      t.references :basket, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.references :product, null: false, foreign_key: { on_delete: :restrict }, index: false
      t.integer :quantity, null: false
      t.decimal :price_at_addition, precision: 10, scale: 2, null: false

      t.timestamps
    end

    add_index :basket_items, [:basket_id, :product_id], unique: true
    add_check_constraint :basket_items, "quantity > 0", name: "basket_items_quantity_positive"
  end
end
