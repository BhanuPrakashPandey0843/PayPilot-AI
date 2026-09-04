class Conversation < ApplicationRecord
  # Validations
  validates :session_id, presence: true
  validate :messages_must_be_array

  def messages_must_be_array
    unless messages.is_a?(Array)
      errors.add(:messages, "must be an array")
    end
  end

  # Scopes
  scope :for_session, ->(session_id) { where(session_id: session_id) }

  # Instance methods
  
  # Adds a message to the conversation history.
  #
  # @param role [String] Message role (e.g., 'user', 'assistant', 'system')
  # @param content [String] Message content
  # @param intent [String, nil] Optional intent classification
  # @param metadata [Hash] Optional additional metadata
  # @return [Boolean] true if saved successfully
  def add_message(role, content, intent = nil, metadata = {})
    message = {
      role: role,
      content: content,
      timestamp: Time.current.iso8601
    }
    message[:intent] = intent if intent.present?
    message.merge!(metadata) if metadata.present?

    self.messages = messages + [message]
    save!
  end

  def get_messages(limit = 20)
    messages.last(limit)
  end

  def clear_messages
    update!(messages: [])
  end

  def message_count
    messages.size
  end

  # Class methods
  def self.create_for_session(session_id)
    create!(session_id: session_id, messages: [])
  end
end
