class CreatePayments < ActiveRecord::Migration[7.0]
  def change
    create_table :payments do |t|
      t.references :order, null: false, foreign_key: true
      t.string :payment_id, null: false
      t.string :status, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :payment_method
      t.datetime :processed_at

      t.timestamps
    end

    add_index :payments, :payment_id, unique: true
  end
end
