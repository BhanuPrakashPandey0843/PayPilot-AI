module Api
  class ConversationsController < ApplicationController
    include ActionController::Live

    # GET /api/conversations/:conversation_id
    # Retrieves a specific conversation by ID
    def show
      @conversation = Conversation.find_by(id: params[:conversation_id])

      if @conversation.nil?
        render json: { error: 'Conversation not found' }, status: :not_found
        return
      end
      render :show, status: :ok
    end

    # POST /api/conversations
    # Creates a new conversation for a session
    def create
      session_id = params[:session_id]

      if session_id.blank?
        render json: { error: 'session_id is required' }, status: :unprocessable_content
        return
      end

      @conversation = Conversation.create_for_session(session_id)

      render :create, status: :created
    rescue StandardError => e
      render json: { error: e.message }, status: :internal_server_error
    end

    # POST /api/conversations/:conversation_id/messages
    # Streams agent response using Server-Sent Events (SSE)
    def send_message
      @conversation = Conversation.find_by(id: params[:conversation_id])

      if @conversation.nil?
        render json: { error: 'Conversation not found' }, status: :not_found
        return
      end

      message = params[:message]
      session_id = params[:session_id]

      if message.blank?
        render json: { error: 'message is required' }, status: :unprocessable_content
        return
      end

      if session_id.blank?
        render json: { error: 'session_id is required' }, status: :unprocessable_content
        return
      end
      
      # Build context from conversation history
      context = {
        session_id: session_id,
        conversation_id: @conversation.id,
        messages: @conversation.messages
      }

      # Set up SSE streaming
      response.headers['Content-Type'] = 'text/event-stream'
      sse = SSE.new(response.stream)
      
      # Stream agent response
      RouterAgent.instance.route_stream(message, session_id, context: context) do |chunk|
        case chunk[:type]
          
        when "content"
          # Stream content chunks
          sse.write({
            type: 'message',
            content: chunk[:content]
          }, event: 'content')
          
        when "tool_call"
          # Stream tool call information
          sse.write({
            tool_name: chunk[:tool_name],
            ui_descriptor: chunk[:ui_descriptor],
          }, event: 'tool_call')
          
        when "done"
          # Save assistant response to conversation
          @conversation.messages = context[:messages]
          @conversation.save!
          
          # Send UI context if present
          if chunk[:ui_context]
            sse.write({
              ui_context: chunk[:ui_context]
            }, event: 'render_ui')
          end
          
          sse.write({
            type: 'done'
          }, event: 'done')
          
        when "error"
          sse.write({
            type: 'error',
            error: chunk[:error],
            details: chunk[:details]
          }, event: 'error')
        end
      end
      
    rescue StandardError => e
      Rails.logger.error "Conversation error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.first(10).join("\n")
      
      # Send error as SSE event
      sse.write({ type: 'error', error: e.message }, event: 'error')
    ensure
      response.stream.close rescue nil
    end

    # DELETE /api/conversations/:conversation_id
    # Deletes a specific conversation
    def destroy
      @conversation = Conversation.find_by(id: params[:conversation_id])

      if @conversation.nil?
        render json: { error: 'Conversation not found' }, status: :not_found
        return
      end

      @conversation.destroy!

      render json: { message: 'Conversation deleted' }, status: :ok
    rescue StandardError => e
      render json: { error: e.message }, status: :internal_server_error
    end
    
  end
end
