class ApplicationController < ActionController::API
  before_action :authenticate
  include ActionController::Cookies

  def authenticate
    authorization_header = request.headers['Authorization']
    token = authorization_header&.split(' ')&.last

    unless token
      return render json: { error: 'Unauthorized' }, status: :unauthorized
    end

    check = JsonWebToken.decode(token)

    unless check
      return render json: { error: 'Invalid or expired token' }, status: :unauthorized
    end

    @current_user = User.find_by(id: check['user_id']) if check['user_id']
    @current_client = OauthClient.find_by(client_id: check['client_id']) if check['client_id']

    unless @current_user || @current_client
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

end