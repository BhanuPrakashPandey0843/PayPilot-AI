class CartAgent
  include Singleton

  attr_reader :agent

  VALID_UI_ACTIONS = %w[
    show_basket
    show_order_payment
    show_order_confirmation
    show_order_details
  ].freeze

  def initialize
    @agent = build_agent
    @basket_service = BasketService.new
    @order_service = OrderService.new
    register_tools
  end

  # Run cart agent with streaming
  #
  # @param message [String] User's message
  # @param session_id [String] Current sessionId of the user
  # @param context [Hash] Additional context
  # @yield [Hash] Streams response chunks
  def run_stream(message, session_id, context: {}, &block)
    context_with_session = context.merge(session_id: session_id)

    @agent.run_stream(message, context: context_with_session, &block)
  end

  private

  def build_agent
    system_prompt = <<~PROMPT
      You are a shopping cart assistant. Your role is to help customers manage their shopping basket and place orders
      against the store's real backend (PayPilot). Only use the tools provided to help them — never invent basket
      contents, totals, or order status.

      You can:
      - Add products to the basket
      - Remove products from the basket
      - Update quantities
      - View basket contents
      - Calculate totals
      - Clear the basket
      - Start checkout (creates a real, pending order + payment)
      - View order status
      - Render UI

      IMPORTANT:
      - Always use the provided tools to interact with the basket.
      - Be helpful and confirm critical actions like starting checkout, clearing basket clearly.
      - Before starting checkout, confirm the total amount and quantity with the user.
      - Prices/totals from tools are in minor currency units (e.g. paise for INR) — always convert to the major unit (divide by 100) before quoting to the user.
      - "create_order" only creates a PENDING order and a real Razorpay payment session — it does not charge the
        customer. Payment is completed by the customer through the payment UI the frontend renders from its result;
        you never collect card/payment details yourself.

      UI RENDERING INSTRUCTIONS:
      - Call the render_ui tool as your FINAL action before responding to the user
      - The render_ui tool determines what visual component the user sees
      - Set 'action' to the appropriate UI view:
        * 'show_basket' - MANDATORY after adding/removing any item or for viewing basket to update UI. NEVER SKIP.
        * 'show_order_payment' - MANDATORY after creating an order to show payment page. NEVER SKIP.
        * 'show_order_confirmation' - for showing order confirmation after payment
        * 'show_order_details' - for displaying details of an existing order
      - Set 'data_source' to the exact name of the tool that generated the data to display:
        * Use 'view_basket' when showing basket contents
        * Use 'create_order' when showing payment page
        * Use 'view_order' when showing order details or confirmation page
      - Example workflows:
        * Add item: add_item_to_basket → render_ui(action: "show_basket", data_source: "add_item_to_basket") → respond
        * Place order: create_order → render_ui(action: "show_order_payment", data_source: "create_order") → respond
        * View order: view_order → render_ui(action: "show_order_details", data_source: "view_order") → respond

    PROMPT

    Agent.new(system_prompt: system_prompt, tools: cart_tools, name: "cart_management_assistant")
  end

  def cart_tools
    [
      {
        type: "function",
        function: {
          name: "view_basket",
          description: "View the current contents of the shopping basket",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "add_item_to_basket",
          description: "Add a product to the shopping basket",
          parameters: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "The UUID of the product to add" },
              quantity: { type: "integer", description: "Quantity to add (default: 1)", default: 1 }
            },
            required: ["product_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "remove_item_from_basket",
          description: "Remove a product from the shopping basket",
          parameters: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "The UUID of the product to remove" },
              quantity: { type: "integer", description: "Quantity to remove (omit to remove all)" }
            },
            required: ["product_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_basket_item",
          description: "Update the quantity of a product in the basket",
          parameters: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "The UUID of the product to update" },
              quantity: { type: "integer", description: "New absolute quantity" }
            },
            required: ["product_id", "quantity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "clear_basket",
          description: "Remove all items from the basket",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_basket_summary",
          description: "Get a summary of the basket (item count, total price)",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "create_order",
          description: "Start checkout from the current basket: creates a pending order and a real Razorpay payment session. The customer must complete payment in the UI this returns — it does not charge them itself.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "view_order",
          description: "View details of an existing order by its order ID",
          parameters: {
            type: "object",
            properties: {
              order_id: { type: "string", description: "The order ID (UUID) to retrieve" }
            },
            required: ["order_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "render_ui",
          description: "Render a UI component to display data to the user. This determines what visual interface the user sees. CRITICAL: Always call this after create_order to show the payment page.",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["show_basket", "show_order_payment", "show_order_confirmation", "show_order_details"]
              },
              data_source: {
                type: "string",
                enum: ["view_basket", "add_item_to_basket", "remove_item_from_basket", "update_basket_item", "clear_basket", "create_order", "view_order"]
              }
            },
            required: ["action", "data_source"]
          }
        }
      }
    ]
  end

  def register_tools
    @agent.register_tool("view_basket", "Viewing your basket...") { |args, context| handle_view_basket(context) }
    @agent.register_tool("add_item_to_basket", "Adding item to basket...") { |args, context| handle_add_item_to_basket(args, context) }
    @agent.register_tool("remove_item_from_basket", "Removing item from basket...") { |args, context| handle_remove_item_from_basket(args, context) }
    @agent.register_tool("update_basket_item", "Updating basket item...") { |args, context| handle_update_basket_item(args, context) }
    @agent.register_tool("clear_basket", "Clearing your basket...") { |args, context| handle_clear_basket(context) }
    @agent.register_tool("get_basket_summary", "Getting basket summary...") { |args, context| handle_get_basket_summary(context) }
    @agent.register_tool("create_order", "Creating your order...") { |args, context| handle_create_order(context) }
    @agent.register_tool("view_order", "Looking up your order...") { |args| handle_view_order(args) }
    @agent.register_tool("render_ui") { |args, context| handle_render_ui(args, context) }
  end

  def handle_view_basket(context)
    @basket_service.view_basket(session_id!(context))
  rescue StandardError => e
    { success: false, error: e.message }
  end

  def handle_add_item_to_basket(args, context)
    @basket_service.add_item(session_id!(context), args["product_id"], args["quantity"] || 1)
  rescue InsufficientInventoryError => e
    { success: false, error: e.message, available: e.available }
  rescue PaypilotApiClient::ApiError, ArgumentError => e
    { success: false, error: e.message }
  end

  def handle_remove_item_from_basket(args, context)
    @basket_service.remove_item(session_id!(context), args["product_id"], args["quantity"])
  rescue PaypilotApiClient::ApiError, ArgumentError => e
    { success: false, error: e.message }
  end

  def handle_update_basket_item(args, context)
    @basket_service.update_item_quantity(session_id!(context), args["product_id"], args["quantity"])
  rescue InsufficientInventoryError => e
    { success: false, error: e.message, available: e.available }
  rescue PaypilotApiClient::ApiError, ArgumentError => e
    { success: false, error: e.message }
  end

  def handle_clear_basket(context)
    @basket_service.clear_basket(session_id!(context))
  end

  def handle_get_basket_summary(context)
    @basket_service.summary(session_id!(context))
  rescue StandardError => e
    { success: false, error: e.message }
  end

  def handle_create_order(context)
    session_id = session_id!(context)
    basket = @basket_service.view_basket(session_id)

    if basket[:items].empty?
      return { success: false, error: "Cannot create order from empty basket" }
    end

    @order_service.create_checkout(session_id: session_id)
  rescue PaypilotApiClient::ApiError => e
    { success: false, error: e.message, code: e.code }
  rescue ArgumentError => e
    { success: false, error: e.message }
  end

  def handle_view_order(args)
    order_id = args["order_id"]
    return { success: false, error: "order_id is required" } if order_id.blank?

    order = @order_service.get_order(order_id)
    return { success: false, error: "Order not found", order_id: order_id } if order.nil?

    order
  end

  def handle_render_ui(args, context)
    action = args["action"]
    data_source = args["data_source"]
    unless VALID_UI_ACTIONS.include?(action)
      return { success: false, error: "Invalid UI action" }
    end

    { ui_action: action, data_source: data_source, success: true }
  end

  def session_id!(context)
    session_id = context.is_a?(Hash) ? context[:session_id] : nil
    raise ArgumentError, "Session ID is required" if session_id.blank?
    session_id
  end
end
