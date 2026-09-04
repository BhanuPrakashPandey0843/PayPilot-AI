RSpec.configure do |config|
  config.before(:each) do
    # Stub OpenAI client initialization to avoid requiring API key in tests
    allow_any_instance_of(Agent).to receive(:client).and_return(instance_double(OpenAI::Client))
    
    # Set a dummy API key for tests
    ENV['OPENAI_API_KEY'] ||= 'test-api-key'
  end
end
