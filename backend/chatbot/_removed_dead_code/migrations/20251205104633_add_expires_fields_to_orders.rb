class AddExpiresFieldsToOrders < ActiveRecord::Migration[7.0]
  def change
    add_column :orders, :expires_at, :datetime
    end
end
