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
  patch "/user/update", to: "users#update_user_info"
  post "/forgot_password", to: "users#forgot_password"
  patch "/user/email_update", to: "users#update_user_email"
  patch "/user/new_password", to: "users#update_user_password"
  patch "/user/update_password", to: "users#update_forgot_password"
  post "/user/save_watched", to: "watched_movies#add_movie_watched"
  post "/user/check_watched", to: "watched_movies#check_movie_watched"
  get "/users", to: "users#display_users"
  get '/users/:id', to: 'users#show'
  post '/oauth/token', to: 'oauth#token'
end

