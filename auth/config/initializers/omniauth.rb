require Rails.root.join("lib/omniauth/strategies/marvin")

Rails.application.config.middleware.use OmniAuth::Builder do
    OmniAuth.config.allowed_request_methods = [:get, :post]
    
    provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET'],
    {
        include_granted_scopes: true,
        scope: 'email, profile'
    }
    provider :github, ENV['GITHUB_CLIENT_ID'], ENV['GITHUB_CLIENT_SECRET'],
        scope: "user:email"
    provider :marvin, ENV["FORTYTWO_CLIENT_ID"], ENV["FORTYTWO_CLIENT_SECRET"]
end