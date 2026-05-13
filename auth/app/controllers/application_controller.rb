class ApplicationController < ActionController::API
  before_action :authenticate
  include ActionController::Cookies

  def authenticate
    authorization_header = request.headers['Authorization']
    token =  authorization_header&.split(' ')&.last
    check = JsonWebToken.decode(token)
    @current_user = User.find_by(id: check['user_id']) if check
    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
  end

end