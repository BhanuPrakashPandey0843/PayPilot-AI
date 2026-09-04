class CreateBaskets < ActiveRecord::Migration[8.0]
  def change
    create_table :baskets do |t|
      t.string :session_id, null: false
      t.bigint :user_id

      t.timestamps
    end

    add_index :baskets, :session_id, unique: true
  end
end
