Rails.application.routes.draw do
  get '/', to: 'users#index'
  scope '/api' do
    post '/signup', to: 'users#create'
    post '/signin', to: 'auth#signin'
    get '/user', to: 'users#me'
  end
  get "/auth/google_oauth2/callback", to: 'users#callback_google'
  get "/auth/github/callback", to: 'users#callback_github'
  get "/auth/marvin/callback", to: 'users#intra_callback'
  get "/amine", to: 'users#check_env'
  get "/set_cookies", to: "users#set_cookies"
  get "/check_token", to: "auth#check_token"
end
