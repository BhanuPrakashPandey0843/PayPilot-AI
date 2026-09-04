require "openai"

class Agent
  # Maximum iterations to prevent infinite loops
  MAX_ITERATIONS = 10
  
  # OpenAI model to use
  MODEL = "gpt-4o-mini"
  
  class ToolExecutionError < StandardError; end
  class MaxIterationsError < StandardError; end
  
  attr_reader :system_prompt, :tools, :client, :name
  
  # Shared OpenAI client instance
  def self.openai_client
    @openai_client ||= OpenAI::Client.new(
      api_key: ENV.fetch("OPENAI_API_KEY", nil),
      timeout: 120
    )
  end
  
  # Initialize the agent with a system prompt and available tools
  #
  # @param system_prompt [String] The system prompt defining agent behavior
  # @param tools [Array<Hash>] Array of tool definitions in OpenAI format
  # @param name [String] Name of the agent (defualt: None)
  # @param model [String] OpenAI model to use (default: gpt-4o-mini)
  def initialize(system_prompt:, tools: [], name: "", model: MODEL)
    @system_prompt = system_prompt
    @tools = tools
    @model = model
    @name = name
    @client = self.class.openai_client
    @tool_handlers = {}
    @tool_ui_descriptor = {}
  end
  
  # Register a tool handler
  #
  # @param tool_name [String] Name of the tool
  # @param descriptor [String, nil] Optional UI descriptor for the tool
  # @param handler [Proc] Proc that handles tool execution
  def register_tool(tool_name, descriptor = nil, &handler)
    @tool_handlers[tool_name] = handler
    @tool_ui_descriptor[tool_name] = descriptor if descriptor
  end
  
  # Run the agent with a user prompt
  #
  # @param prompt [String] User's prompt
  # @param context [Hash] Additional context for the conversation
  # @return [Hash] Final response with content and tool calls
  def run(prompt, context: {})
    messages = build_initial_messages(prompt, context)
    context[:messages] << { "role" => "user", "content" => prompt }  if context[:messages] && !prompt.empty?
    iteration = 0
    
    loop do
      iteration += 1
      raise MaxIterationsError, "Exceeded maximum iterations" if iteration > MAX_ITERATIONS
      
      # Call OpenAI API
      params = {
        model: @model,
        messages: messages
      }
      params[:tools] = @tools unless @tools.empty?
      response = @client.chat.completions.create(**params)
      choice = response.choices.first
      message = choice.message
      
      # Add assistant message to conversation
      messages << message.to_h
      context[:messages] << messages[-1] if context[:messages]
      
      # Check if we need to call tools
      if message.tool_calls.nil? || message.tool_calls.empty?
        return {
          content: message.content,
          finish_reason: choice.finish_reason
        }
      end
      
      # Execute tool calls and add results to messages
      message.tool_calls.each do |tool_call|
        result = execute_tool(tool_call, context)
        messages << {
          "role" => "tool",
          "tool_call_id" => tool_call.id,
          "content" => result.to_json
        }
        context[:messages] << messages[-1] if context[:messages]
      end
    end
  end
  
  # Run the agent with streaming responses
  #
  # @param prompt [String] User's prompt
  # @param context [Hash] Additional context for the conversation
  # @yield [Hash] Streams chunks of the response
  def run_stream(prompt, context: {}, &block)
    begin
      run_stream_internal(prompt, context, &block)
    rescue MaxIterationsError => e
      Rails.logger.error "Max iterations exceeded: #{e.message}"
      yield({
        type: "error",
        error: "I'm having trouble completing this request. Please try rephrasing or breaking it into smaller steps.",
        done: true
      })
    rescue StandardError => e
      Rails.logger.error "Agent stream error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.first(10).join("\n")
      
      yield({
        type: "error",
        error: "I encountered an error while processing your request. Please try again.",
        done: true
      })
    end
  end
  
  private
  
  def run_stream_internal(prompt, context)
    messages = build_initial_messages(prompt, context)
    context[:messages] << { "role" => "user", "content" => prompt } if context[:messages] && !prompt.empty?
    
    iteration = 0
    ui_context = nil
    tool_results = {}
    
    loop do
      iteration += 1
      raise MaxIterationsError, "Exceeded maximum iterations" if iteration > MAX_ITERATIONS
      
      current_message = { "role" => "assistant", "content" => "", "tool_calls" => [] }
      current_message["name"] = @name if @name.present?
      tool_call_buffer = {}
      
      # Stream response
      params = {
        model: @model,
        messages: messages,
        stream: true
      }
      params[:tools] = @tools unless @tools.empty?

      @client.chat.completions.stream_raw(**params).each do |chunk|
        choice = chunk.choices&.first
        next unless choice
        
        delta = choice.delta
        
        # Handle content streaming
        if delta.content
          current_message["content"] += delta.content
          yield({
            type: "content",
            content: delta.content,
            done: false
          })
        end
        
        # Handle tool calls streaming
        if delta.tool_calls
          delta.tool_calls.each do |tc|
            index = tc.index
            tool_call_buffer[index] ||= {
              "id" => "",
              "type" => "function",
              "function" => { "name" => "", "arguments" => "" }
            }
            
            tool_call_buffer[index]["id"] = tc.id if tc.id
            if tc.function
              tool_call_buffer[index]["function"]["name"] += tc.function.name if tc.function.name
              tool_call_buffer[index]["function"]["arguments"] += tc.function.arguments if tc.function.arguments
            end
          end
        end
        
        # Check if streaming is done
        if choice.finish_reason
          current_message["tool_calls"] = tool_call_buffer.values if choice.finish_reason.to_s == "tool_calls" && tool_call_buffer.any?
          current_message.delete("tool_calls") if current_message["tool_calls"].empty?
        end
      end

      # Add assistant message to conversation
      messages << current_message
      context[:messages] << messages[-1] if context[:messages]
      
      # Check if we need to call tools
      tool_calls = current_message["tool_calls"]
      if tool_calls.nil? || tool_calls.empty?
        done_chunk = {
          type: "done",
          content: current_message["content"],
          done: true
        }
        
        # Include UI context if present
        if ui_context
          done_chunk[:ui_context] = ui_context
        end
        
        yield(done_chunk)
        break
      end
      
      # Execute tool calls
      tool_calls.each do |tool_call|
        tool_name = tool_call.dig("function", "name")
        
        yield({
          type: "tool_call",
          tool_name: tool_name,
          ui_descriptor: @tool_ui_descriptor[tool_name],
          arguments: tool_call.dig("function", "arguments"),
          done: false
        })
        
        result = execute_tool(tool_call, context)
        tool_results[tool_name] = result.dup if result.is_a?(Hash)
        # Process UI context from tool result
        ui_context = process_ui_context(result, tool_results, tool_name, ui_context)
        
        yield({
          type: "tool_result",
          tool_name: tool_name,
          result: result,
          done: false
        })
        
        tool_message = {
          "role" => "tool",
          "tool_call_id" => tool_call["id"],
          "content" => result.to_json
        }
        messages << tool_message
        context[:messages] << messages[-1] if context[:messages]
      end
    end
  end
  
  # Build initial messages array
  #
  # @param prompt [String] User's prompt
  # @param context [Hash] Additional context
  # @return [Array<Hash>] Messages array
  def build_initial_messages(prompt, context)
    messages = [
      { "role" => "system", "content" => @system_prompt }
    ]
    
    # Add context messages if provided
    if context[:messages]
      messages.concat(context[:messages])
    end
    
    # Add user prompt
    messages << { "role" => "user", "content" => prompt } if !prompt.empty?
    
    messages
  end
  
  
  # Execute a tool call
  #
  # @param tool_call [Hash|Object] Tool call from OpenAI
  # @param context [Hash] Optional Additional context
  # @return [Hash] Tool execution result
  def execute_tool(tool_call, context=nil)
    if tool_call.is_a?(Hash)
      function_name = tool_call.dig("function", "name")
      arguments_json = tool_call.dig("function", "arguments")
    else
      # OpenAI object
      function_name = tool_call.function.name
      arguments_json = tool_call.function.arguments
    end
    
    begin
      arguments = JSON.parse(arguments_json)
    rescue JSON::ParserError => e
      Rails.logger.error "Failed to parse tool arguments: #{e.message}"
      return { error: "Invalid arguments format" }
    end
    
    handler = @tool_handlers[function_name]
    
    unless handler
      Rails.logger.error "No handler registered for tool: #{function_name}"
      return { error: "Tool not found: #{function_name}" }
    end
    
    begin
      # Check if handler accepts context parameter
      if context && (handler.arity.abs >= 2 || handler.arity < 0)
        handler.call(arguments, context)
      else
        handler.call(arguments)
      end
    rescue StandardError => e
      puts "Tool execution error: #{e.message}"
      Rails.logger.error "Tool execution error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { error: e.message }
    end
  end

  # Process UI context from tool result
  #
  # @param result [Hash] Tool execution result
  # @param tool_results [Hash] All previous tool results
  # @param current_tool_name [String] Name of current tool
  # @param existing_ui_context [Hash, nil] Existing UI context (if any)
  # @return [Hash, nil] Updated UI context or existing one
  def process_ui_context(result, tool_results, current_tool_name, existing_ui_context)
    return existing_ui_context unless result.is_a?(Hash) && result[:ui_action]

    ui_action = result[:ui_action]
    data_source = result[:data_source]
    ui_data = tool_results[data_source] if data_source && tool_results[data_source]

    if ui_data.nil?
      Rails.logger.warn "No UI data available for action '#{ui_action}'"
      existing_ui_context
    end
    
    Rails.logger.info "UI Context created: action=#{ui_action}, tool=#{data_source}"
    
    {
      action: ui_action,
      data: ui_data,
      tool_name: data_source
    }
  end
end
