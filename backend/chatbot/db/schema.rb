# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_12_08_223725) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "basket_items", force: :cascade do |t|
    t.bigint "basket_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity", null: false
    t.decimal "price_at_addition", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["basket_id", "product_id"], name: "index_basket_items_on_basket_id_and_product_id", unique: true
    t.check_constraint "quantity > 0", name: "basket_items_quantity_positive"
  end

  create_table "baskets", force: :cascade do |t|
    t.string "session_id", null: false
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_baskets_on_session_id", unique: true
  end

  create_table "conversations", force: :cascade do |t|
    t.string "session_id", null: false
    t.jsonb "messages", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_conversations_on_session_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.string "product_name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
    t.check_constraint "quantity > 0", name: "order_items_quantity_positive"
  end

  create_table "orders", force: :cascade do |t|
    t.string "order_number", null: false
    t.string "session_id", null: false
    t.bigint "user_id"
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.string "status", default: "payment_pending", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "expires_at"
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["session_id"], name: "index_orders_on_session_id"
  end

  create_table "payments", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.string "payment_id", null: false
    t.string "status", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "payment_method"
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_payments_on_order_id"
    t.index ["payment_id"], name: "index_payments_on_payment_id", unique: true
  end

  create_table "products", force: :cascade do |t|
    t.string "name", null: false
    t.text "description", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.integer "inventory_quantity", default: 0, null: false
    t.jsonb "product_attributes", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "reserved_quantity", default: 0, null: false
    t.virtual "ts_vector", type: :tsvector, as: "(setweight(to_tsvector('english'::regconfig, (COALESCE(name, ''::character varying))::text), 'A'::\"char\") || setweight(to_tsvector('english'::regconfig, COALESCE(description, ''::text)), 'B'::\"char\"))", stored: true
    t.index ["inventory_quantity"], name: "index_products_on_inventory_quantity", where: "(inventory_quantity > 0)"
    t.index ["product_attributes"], name: "index_products_on_attributes", using: :gin
    t.index ["ts_vector"], name: "index_products_on_ts_vector", using: :gin
    t.check_constraint "inventory_quantity >= 0", name: "products_inventory_non_negative"
    t.check_constraint "price > 0::numeric", name: "products_price_positive"
  end

  add_foreign_key "basket_items", "baskets", on_delete: :cascade
  add_foreign_key "basket_items", "products", on_delete: :restrict
  add_foreign_key "order_items", "orders", on_delete: :cascade
  add_foreign_key "order_items", "products", on_delete: :restrict
  add_foreign_key "payments", "orders"
end
