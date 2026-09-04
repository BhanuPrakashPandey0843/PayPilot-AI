Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "static#root"
  
  # API routes
  namespace :api do
    resources :products, only: [:index, :show] do
      collection do
        get :search
      end
    end

    # Baskets routes - session-based basket management
    get 'baskets/:session_id', to: 'baskets#show'
    post 'baskets/:session_id/items', to: 'baskets#add_item'
    patch 'baskets/:session_id/items/:product_id', to: 'baskets#update_item'
    delete 'baskets/:session_id/items/:product_id', to: 'baskets#destroy_item'
    delete 'baskets/:session_id', to: 'baskets#destroy'

    # Orders routes — now backed by PayPilot's real orders (UUID ids)
    resources :orders, only: [:create, :show], param: :order_id

    # Real Razorpay payment verification (replaces the old mock
    # api/webhooks/payments route — see app/controllers/api/payments_controller.rb
    # and app/controllers/api/webhooks/payments_controller.rb for why).
    post 'payments/verify', to: 'payments#verify'

    # Conversations routes

    resources :conversations, only: [:create, :show, :destroy], param: :conversation_id do
      member do
        post :messages, to: 'conversations#send_message'
      end
    end
    
  end
end
