require 'rails_helper'

RSpec.describe Agent do
  let(:system_prompt) { "You are a helpful assistant." }
  let(:tools) { [] }
  let(:mock_client) { instance_double(OpenAI::Client) }
  let(:agent) do
    agent_instance = described_class.new(system_prompt: system_prompt, tools: tools)
    agent_instance.instance_variable_set(:@client, mock_client)
    agent_instance
  end

  describe '#initialize' do
    it 'initializes with system prompt and tools' do
      expect(agent.system_prompt).to eq(system_prompt)
      expect(agent.tools).to eq(tools)
    end
  end

  describe '#register_tool' do
    it 'registers a tool handler' do
      handler = proc { |args| { result: 'success' } }
      agent.register_tool('test_tool', &handler)

      tool_handlers = agent.instance_variable_get(:@tool_handlers)
      expect(tool_handlers['test_tool']).to eq(handler)
    end
  end

  describe '#execute_tool' do
    it 'executes registered tool with hash arguments' do
      agent.register_tool('test_tool') { |args| { result: args['input'] } }

      tool_call = {
        'function' => {
          'name' => 'test_tool',
          'arguments' => '{"input": "test"}'
        }
      }

      result = agent.send(:execute_tool, tool_call)
      expect(result[:result]).to eq('test')
    end

    it 'returns error for unregistered tool' do
      tool_call = {
        'function' => {
          'name' => 'unknown_tool',
          'arguments' => '{}'
        }
      }

      result = agent.send(:execute_tool, tool_call)
      expect(result[:error]).to include('Tool not found')
    end

    it 'handles invalid JSON arguments' do
      agent.register_tool('test_tool') { |args| { result: 'ok' } }

      tool_call = {
        'function' => {
          'name' => 'test_tool',
          'arguments' => 'invalid json'
        }
      }

      result = agent.send(:execute_tool, tool_call)
      expect(result[:error]).to include('Invalid arguments format')
    end
  end
end
