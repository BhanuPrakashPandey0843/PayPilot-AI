require 'rails_helper'

RSpec.describe 'Api::Conversations', type: :request do
  let(:session_id) { 'test-session-123' }

  describe 'POST /api/conversations' do
    context 'with valid parameters' do
      it 'creates a new conversation' do
        expect {
          post '/api/conversations', params: { session_id: session_id }, as: :json
        }.to change(Conversation, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['conversation_id']).to be_present
        expect(json['session_id']).to eq(session_id)
      end

      it 'creates conversation with empty messages array' do
        post '/api/conversations', params: { session_id: session_id }, as: :json

        conversation = Conversation.last
        expect(conversation.messages).to eq([])
        expect(conversation.session_id).to eq(session_id)
      end
    end

    context 'with missing session_id' do
      it 'returns unprocessable entity error' do
        post '/api/conversations', params: {}

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('session_id is required')
      end
    end

    context 'with blank session_id' do
      it 'returns unprocessable entity error' do
        post '/api/conversations', params: { session_id: '' }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('session_id is required')
      end
    end
  end

  describe 'GET /api/conversations/:conversation_id' do
    let!(:conversation) { Conversation.create_for_session(session_id) }

    context 'with valid conversation_id' do
      it 'returns the conversation' do
        get "/api/conversations/#{conversation.id}", as: :json

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['conversation_id']).to eq(conversation.id)
        expect(json['session_id']).to eq(session_id)
      end
    end

    context 'with invalid conversation_id' do
      it 'returns not found error' do
        get '/api/conversations/99999'

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Conversation not found')
      end
    end
  end

  describe 'POST /api/conversations/:conversation_id/messages' do
    let!(:conversation) { Conversation.create_for_session(session_id) }

    context 'with invalid conversation_id' do
      it 'returns not found error' do
        post '/api/conversations/99999/messages',
             params: { message: 'Hello', session_id: session_id }

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Conversation not found')
      end
    end

    context 'with missing message' do
      it 'returns unprocessable entity error' do
        post "/api/conversations/#{conversation.id}/messages",
             params: { session_id: session_id }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('message is required')
      end
    end

    context 'with blank message' do
      it 'returns unprocessable entity error' do
        post "/api/conversations/#{conversation.id}/messages",
             params: { message: '', session_id: session_id }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('message is required')
      end
    end

    context 'with missing session_id' do
      it 'returns unprocessable entity error' do
        post "/api/conversations/#{conversation.id}/messages",
             params: { message: 'Hello' }

        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('session_id is required')
      end
    end
  end

  describe 'DELETE /api/conversations/:conversation_id' do
    let!(:conversation) { Conversation.create_for_session(session_id) }

    context 'with valid conversation_id' do
      it 'deletes the conversation' do
        expect {
          delete "/api/conversations/#{conversation.id}"
        }.to change(Conversation, :count).by(-1)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['message']).to eq('Conversation deleted')
      end

      it 'removes conversation from database' do
        delete "/api/conversations/#{conversation.id}"

        expect(Conversation.find_by(id: conversation.id)).to be_nil
      end
    end

    context 'with invalid conversation_id' do
      it 'returns not found error' do
        delete '/api/conversations/99999'

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Conversation not found')
      end
    end

    context 'with conversation containing messages' do
      it 'deletes conversation with all messages' do
        conversation.add_message('user', 'Hello')
        conversation.add_message('assistant', 'Hi there')

        expect {
          delete "/api/conversations/#{conversation.id}"
        }.to change(Conversation, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
