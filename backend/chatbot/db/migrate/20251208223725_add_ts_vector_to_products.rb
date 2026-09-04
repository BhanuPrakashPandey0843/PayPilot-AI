class AddTsVectorToProducts < ActiveRecord::Migration[8.0]
  def up
    remove_index :products, :name
    
    execute <<-SQL
      ALTER TABLE products
      ADD COLUMN ts_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description,'')), 'B')
      ) STORED;
    SQL

    add_index :products, :ts_vector, using: :gin
  end
end
