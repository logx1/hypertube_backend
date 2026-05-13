class AuthController < ApplicationController
  skip_before_action :authenticate, only: [ :signin ]

  def signin
    begin 
      user = User.find_by!(username: login_params[:username])
      authenticated_user = user&.authenticate(login_params[:password])
      
      if authenticated_user
        token = JsonWebToken.encode(user_id: user.id, email: user.email, username: user.username)
        cookies["token"] = {
          value: token,
          secure: true,
          httponly: true,
        }
        render json: { Success: "User Authentified!", token: token }
      else
        raise "Invalid username or password!"
      end
    rescue => e
      render json: { error: "Invalid email or password!" }, status: :unauthorized
    end
  end

  def check_token
    render json: { Success: "Token Valid"}
  end  
  

  private

  def login_params
    request = params.require(:auth).permit(:password, :username)
  end

end
