class RouterAgent
  include Singleton
  
  def initialize
    @classifier = build_classifier
  end
  
  def cart_agent
    CartAgent.instance
  end
  
  def product_search_agent
    ProductSearchAgent.instance
  end
  
  def chitchat_agent
    ChitchatAgent.instance
  end
  
  # Route a message with streaming
  #
  # @param message [String] User's message
  # @param session_id [String] User's session ID
  # @param context [Hash] Conversation context
  # @yield [Hash] Streams response chunks with agent type
  def route_stream(message, session_id, context: {}, &block)
    agent_type = classify_message(message, context)
    
    yield({
      type: "agent_selected",
      agent_type: agent_type,
      done: false
    })
    
    route_to_agent_stream(agent_type, message, session_id, context, &block)
  end
  
  private
  
  def route_to_agent_stream(agent_type, message, session_id, context, &block)    
    case agent_type
    when :cart
      cart_agent.run_stream(message, session_id, context: context, &block)
    when :product_search
      product_search_agent.run_stream(message, context: context, &block)
    when :chitchat
      chitchat_agent.run_stream(message, context: context, &block)
    else
      chitchat_agent.run_stream(message, context: context, &block)
    end
  end
  
  def build_classifier
    system_prompt = <<~PROMPT
      You are a message classifier for an e-commerce shopping assistant.
      Your job is to analyze the user's message and conversation context to determine which specialized agent should handle it.
      
      Available agents:
      1. product_search - Handles product discovery (search, filter, view details, recommendations)
      2. cart_management - Handles cart operations (add, remove, view basket, update quantities, checkout, order)
      3. general_conversation - Handles greetings, policies, support questions, general chat
      
      CONTEXT-AWARE ROUTING (CRITICAL):
      - Pay close attention to conversation history.
      - Analyze and reason which agent will be best to handle the user query based on the conversation history and current message.
      - Break down complex queries to simpler steps and check at which step the user is and then route to the appropiate agent.
      - If the user needs to FIND or SEARCH for products they don't have yet, ALWAYS route to product_search FIRST.
      - The user MUST see product options before they can add anything to cart.
      
      Route to PRODUCT_SEARCH when:
      - User mentions finding, searching, browsing, or discovering products
      - Keywords: "find", "search", "show me", "looking for", "I want", "I need", "get me", "do you have"
      - Price/attribute filters: "under $X", "red", "size M", "cheap", etc.
      - Complex queries with search intent
      - Examples:
        * "Show me red shoes"
        * "Find laptops under $1000"
        * "I'm looking for a blue dress"
      
      Route to CART_MANAGEMENT when:
      - User wants to manage cart/basket or checkout
      - ONLY if they're referencing products they've already seen OR managing existing cart
      - Keywords: "add to cart" (when product is already known), "remove", "basket", "checkout", "place order"
      - Context-aware examples (AFTER seeing products):
        * "Add the first one"
        * "Add this to cart"
        * "I'll take it"
        * "Show my basket"
        * "Checkout"
        * "Remove item 5"
      
      Route to GENERAL_CONVERSATION when:
      - If the message is about policies, returns, support, or general questions
      - Examples: "Hello!", "What's your return policy?", "How do I track my order?", "Can you help me?"
      
      DECISION LOGIC:
      1. Does the message contain search/find related intent → product_search
      2. Is the user asking to see products they haven't seen yet? → product_search
      3. Is the user referencing products from previous conversation? → Check context
      4. Is it about cart/checkout with products already known? → cart_management
      5. Is it a greeting or policy question? → general_conversation
      
      Respond with **ONLY** the agent name: product_search, cart_management, or general_conversation
    PROMPT
    
    Agent.new(system_prompt: system_prompt, tools: [], model: 'gpt-4.1-nano')
  end
  
  def classify_message(message, context)
    # We can use some regex matching or small ML based classifier model first
    llm_classify(message, context)
  rescue StandardError => e
    Rails.logger.error "RouterAgent classification error: #{e.message}"
    :chitchat
  end
  
  def llm_classify(message, context)
    context_str = build_context_string(context)
    
    prompt = <<~PROMPT
        CONVERSATION CONTEXT:
        #{context_str}
        
        CURRENT USER MESSAGE: "#{message}"
        
        Analyze the conversation context and the current message carefully.
        If the user is referencing something from the previous conversation (like "add this", "the first one"), consider the context.
        
        Which agent should handle this message?
        Respond with ONLY ONE of: cart_management, product_search, or general_conversation
      PROMPT
    
    result = @classifier.run(prompt)
    parse_classification_result(result[:content])
  end
  
  def build_context_string(context)
    return "" unless context[:messages]&.any?
    
    recent = context[:messages].last(10)
    "Recent conversation:\n" + recent.map { |m| 
      name_part = m['name'].present? ? " (#{m['name']})" : ""
      "#{m['role']}#{name_part}: #{m['content']}"
    }.join("\n")
  end

  # Parse the classification result from LLM response
  #
  # @param content [String] LLM response content
  # @return [Symbol] Agent type (:cart, :product_search, or :chitchat)
  def parse_classification_result(content)
    return :chitchat if content.blank?
    
    # Normalize the content: downcase and strip whitespace
    normalized = content.strip.downcase
    
    # Extract the agent name from the response
    case normalized
    when /cart_management|cart/
      :cart
    when /product_search|product/
      :product_search
    when /general_conversation|general|chitchat/
      :chitchat
    else
      # Default to chitchat if unclear
      Rails.logger.warn "RouterAgent: Unclear classification result: '#{content}', defaulting to chitchat"
      :chitchat
    end
  end
  
end
