require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module AIShoppingAssistant
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # This app is embedded as an iframe inside the GoCart storefront's
    # floating chat widget (D:\PayPilot AI\user\components\ChatWidget.jsx),
    # which runs on a different origin/port. Rails sets
    # "X-Frame-Options: SAMEORIGIN" by default, which would make browsers
    # refuse to render that iframe — so it's dropped here. For a real
    # deployment, replace this with a Content-Security-Policy
    # `frame-ancestors` allow-list of the exact storefront origin(s)
    # instead of allowing framing from anywhere (see
    # config/initializers/content_security_policy.rb).
    config.action_dispatch.default_headers.delete("X-Frame-Options")
  end
end
