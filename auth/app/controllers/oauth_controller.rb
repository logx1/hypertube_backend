class OAuthController < ApplicationController
  skip_before_action :authenticate, only: [ :token ]
  def token
    unless params[:grant_type] == 'client_credentials'
      return render json: { error: 'unsupported_grant_type', grant: params[:grant_type] }, status: :bad_request
    end

    client = OAuthClient.find_by(client_id: params[:client_id])

    if client&.authenticate_secret(params[:client_secret])
      render json: {
        access_token: generate_token(client),
        token_type: 'Bearer',
        expires_in: 3600
      }
    else
      render json: { error: 'invalid_client' }, status: :unauthorized
    end
  end

  private

  def generate_token(client)
    payload = {
      client_id: client.client_id,
      exp: 1.hour.from_now.to_i
    }
    JsonWebToken.encode(payload, 24.hours.from_now)
  end
  
end
