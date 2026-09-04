json.conversation_id @conversation.id
json.session_id @conversation.session_id
json.messages @conversation.messages.select { |msg| msg['role'] == 'user' || msg['role'] == 'assistant' }
json.message_count @conversation.message_count
json.created_at @conversation.created_at
json.updated_at @conversation.updated_at
