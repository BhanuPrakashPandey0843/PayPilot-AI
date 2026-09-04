class CreateOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :orders do |t|
      t.string :order_number, null: false
      t.string :session_id, null: false
      t.bigint :user_id
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'payment_pending'

      t.timestamps
    end

    add_index :orders, :order_number, unique: true
    add_index :orders, :session_id
  end
end
