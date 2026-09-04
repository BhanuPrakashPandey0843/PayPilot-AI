class CreateConversations < ActiveRecord::Migration[8.0]
  def change
    create_table :conversations do |t|
      t.string :session_id, null: false
      t.jsonb :messages, null: false, default: []

      t.timestamps
    end

    add_index :conversations, :session_id
  end
end
