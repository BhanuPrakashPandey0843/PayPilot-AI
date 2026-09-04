class ChitchatAgent
  include Singleton
  
  attr_reader :agent
  
  def initialize
    @agent = build_agent
    register_tools
  end
  

  # Run chitchat agent with streaming
  #
  # @param message [String] User's message
  # @param context [Hash] Conversation context
  # @yield [Hash] Streams response chunks
  def run_stream(message, context: {}, &block)
    @agent.run_stream(message, context: context, &block)
  end
  
  private
  
  def build_agent
    system_prompt = <<~PROMPT
      You are a friendly customer service assistant for an e-commerce store. Your role is to engage
      in general conversation, answer questions, and provide helpful information.
      
      You can help with:
      - General greetings and pleasantries
      - Store policies (shipping, returns, payment methods)
      - Account and order inquiries
      - General product questions
      - Recommendations and suggestions
      - Troubleshooting and support
      
      Your personality:
      - Friendly and approachable
      - Professional but conversational
      - Patient and understanding
      - Proactive in offering help
      - Knowledgeable about the store
      
      Important guidelines:
      - For specific product searches, suggest the customer ask about products
      - For cart management, suggest they ask about their basket
      - For order status, use the get_order_status tool
      - For policy questions, use the get_store_policy tool
      - Keep responses concise but helpful
      - Use a warm, conversational tone
      
      If you don't know something specific, be honest and offer to help find the information
      or direct them to the right resource.
    PROMPT
    
    Agent.new(system_prompt: system_prompt, tools: chitchat_tools, name: "chitchat_assistant")
  end
  
  def chitchat_tools
    [
      {
        type: "function",
        function: {
          name: "get_store_policy",
          description: "Get information about store policies (shipping, returns, payment, etc.)",
          parameters: {
            type: "object",
            properties: {
              policy_type: {
                type: "string",
                description: "Type of policy (shipping, returns, payment, privacy, terms)",
                enum: ["shipping", "returns", "payment", "privacy", "terms"]
              }
            },
            required: ["policy_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_store_hours",
          description: "Get store operating hours and contact information",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_payment_methods",
          description: "Get list of accepted payment methods",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_contact_info",
          description: "Get customer service contact information",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ]
  end
  
  def register_tools
    @agent.register_tool("get_store_policy", "Looking up store policy...") { |args| handle_get_store_policy(args) }
    @agent.register_tool("get_store_hours", "Getting store hours...") { |args| handle_get_store_hours }
    @agent.register_tool("get_payment_methods", "Getting payment methods...") { |args| handle_get_payment_methods }
    @agent.register_tool("get_contact_info", "Getting contact information...") { |args| handle_get_contact_info }
  end

  def handle_get_store_policy(args)
    policy_type = args["policy_type"]
    
    if store_policies.key?(policy_type.to_sym)
      store_policies[policy_type.to_sym]
    else
      {
        error: "Unknown policy type",
        available_types: store_policies.keys.map(&:to_s)
      }
    end
  end

  def handle_get_store_hours
    {
      hours: {
        monday: "9:00 AM - 9:00 PM EST",
        tuesday: "9:00 AM - 9:00 PM EST",
        wednesday: "9:00 AM - 9:00 PM EST",
        thursday: "9:00 AM - 9:00 PM EST",
        friday: "9:00 AM - 10:00 PM EST",
        saturday: "10:00 AM - 10:00 PM EST",
        sunday: "10:00 AM - 8:00 PM EST"
      },
      customer_service: {
        phone: "1-800-SHOP-NOW",
        email: "support@example.com",
        chat: "Available 24/7"
      },
      timezone: "Eastern Standard Time (EST)"
    }
  end

  def handle_get_payment_methods
    {
      credit_cards: ["Visa", "Mastercard", "American Express", "Discover"],
      digital_wallets: ["PayPal", "Apple Pay", "Google Pay", "Shop Pay"],
      other: ["Debit Cards"],
      security: {
        encryption: "256-bit SSL",
        pci_compliant: true,
        fraud_protection: true
      },
      note: "All transactions are secure and encrypted"
    }
  end

  def handle_get_contact_info
    {
      customer_service: {
        phone: "1-800-SHOP-NOW",
        email: "support@example.com",
        hours: "Monday-Friday 9AM-9PM EST, Saturday-Sunday 10AM-8PM EST"
      },
      live_chat: {
        available: true,
        hours: "24/7"
      },
      social_media: {
        facebook: "@shopexample",
        twitter: "@shopexample",
        instagram: "@shopexample"
      },
      mailing_address: {
        street: "123 Commerce Street",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA"
      },
      response_time: "We typically respond within 24 hours"
    }
  end

  def store_policies
    {
      shipping: {
        title: "Shipping Policy",
        content: <<~POLICY
          We offer several shipping options:
          
          - Standard Shipping (5-7 business days): $5.99
          - Express Shipping (2-3 business days): $12.99
          - Overnight Shipping (1 business day): $24.99
          - Free Standard Shipping on orders over $50
          
          We ship internationally to select countries.
          Orders are processed within 1-2 business days.
        POLICY
      },
      returns: {
        title: "Return Policy",
        content: <<~POLICY
          We accept returns within 30 days of purchase.
          
          - Items must be unused and in original packaging
          - Return shipping is free for defective items
          - Refunds processed within 5-7 business days
          - Original shipping costs are non-refundable
          - Sale items are final sale
          
          To initiate a return, contact customer service with your order number.
        POLICY
      },
      payment: {
        title: "Payment Methods",
        content: <<~POLICY
          We accept the following payment methods:
          
          - Credit Cards (Visa, Mastercard, American Express, Discover)
          - Debit Cards
          - PayPal
          - Apple Pay
          - Google Pay
          - Shop Pay
          
          All transactions are secure and encrypted.
        POLICY
      },
      privacy: {
        title: "Privacy Policy",
        content: <<~POLICY
          We respect your privacy and protect your personal information.
          
          - We never sell your data to third parties
          - Information is used only for order processing and customer service
          - You can request data deletion at any time
          - We use cookies to improve your shopping experience
          
          For full details, see our complete Privacy Policy on our website.
        POLICY
      },
      terms: {
        title: "Terms of Service",
        content: <<~POLICY
          By using our store, you agree to:
          
          - Provide accurate information
          - Use the site lawfully
          - Respect intellectual property rights
          - Accept our return and refund policies
          
          We reserve the right to refuse service or cancel orders.
          For complete terms, visit our Terms of Service page.
        POLICY
      }
    }
  end


end
