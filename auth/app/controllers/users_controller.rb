class UsersController < ApplicationController
  skip_before_action :authenticate, only: [ :create, :callback_github, :callback_google, :intra_callback, :set_cookies, :forgot_password]

  
################################################################################################################################################################
  
  def index
    render json: { message: "Auth endpoint working" }
  end

################################################################################################################################################################

def display_users
  users = User.select(:id, :username)
  if user
    render json: users , status: :ok
  else
    render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
  end
end

################################################################################################################################################################

def update_request
  @user = User.find(params[:id])

  unless @user.id == @current_user.id
    return render json: { errors: "You Cannot Change Another User Data" }, status: :forbidden
  end

  if update_api.empty?
    return render json: { errors: "Cannot Change That Field or Wrong Request" }, status: :unprocessable_entity
  end

  if @user.update(update_api)
    render json: { Success: "User Data Updated" }, status: :ok
  else
    render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
  end
end

################################################################################################################################################################

def show
  user = User.find(params[:id])
  if user
    if user.id == @current_user.id
      render json: { username: user.username, imageUrl: user.imageUrl, email: user.email }, status: :ok
    else
      render json: { username: user.username, imageUrl: user.imageUrl }, status: :ok
    end
  else
    render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
  end
end

################################################################################################################################################################

  def update_user_info
    token = request.headers['Authorization']&.split(' ')&.last
    user_id = JsonWebToken.decode(token)['user_id']
    @user = User.find(user_id)
      if @user.update(update_params.compact_blank) and !update_params.empty?
        render json: { Success: "User Data Updated" }, status: :ok
      elsif update_params.empty?
        render json: { errors: "Cannot Change That Field or Wrong Request" }, status: :unprocessable_entity
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
      end
  end

################################################################################################################################################################

  def update_user_email

    token = request.headers['Authorization']&.split(' ')&.last
    user_id = JsonWebToken.decode(token)['user_id']
    @user = User.find(user_id)
    authenticate_user = @user&.authenticate(update_email[:password])

    if update_email[:password].eql?(update_email[:password_confirmation]) && authenticate_user && update_email[:email].match("^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]+$")

      if @user.update({ email: update_email[:email] })
        render json: { errors: "Email Updated!" }, status: :ok
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
      end

    else
      render json: { errors: "Not Valid Email or Wrong Password" }, status: :unprocessable_entity
    end

  end

################################################################################################################################################################

def update_user_password
  token = request.headers['Authorization']&.split(' ')&.last
  user_id = JsonWebToken.decode(token)['user_id']
  @user = User.find(user_id)
  authenticate_user = @user&.authenticate(update_password[:password])

  if update_password[:new_password].eql?(update_password[:new_password_confirmation]) && authenticate_user && update_password[:new_password].length > 7
    
    if @user.update!({ password: update_password[:new_password], password_confirmation: update_password[:new_password_confirmation] })

        render json: { errors: "Password Updated!" }, status: :ok
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
      end

  else
    render json: { errors: "Wrong Password or Short NewPassword" }, status: :unprocessable_entity
  end
end

################################################################################################################################################################
  
  def callback_google
    auth = request.env['omniauth.auth']
    oauth = OAuthProvider.find_by(uid: auth.uid, provider: auth.provider)

    if oauth
      user = oauth.user
    else 
      return render json: { error: "Unverified email" }, status: :unauthorized unless auth.info.email_verified
      user = User.find_by(email: auth.info.email)
      if user.nil?
        user = User.new(
          username: generate_username, 
          last_name: auth.info.last_name, 
          first_name: auth.info.first_name, 
          email: auth.info.email, 
          password: SecureRandom.hex(8),
          imageUrl: auth.info.image
        )
      return render json: user.errors, status: :bad_request unless user.save
    end
      auth2 = OAuthProvider.create!(
        user: user,
        provider: auth.provider,
        uid: auth.uid
      )
    end
    token = JsonWebToken.encode(
      user_id: user.id,
      email: user.email,
      username: user.username
    )

    if user.imageUrl.nil?
      user.update(imageUrl: auth.info.image)
    end
    redirect_to "https://localhost/auth/set_cookies?token=#{token}", allow_other_host: true
  end


################################################################################################################################################################
  

  def set_cookies
    token = params[:token]
    cookies["token"] = {
      value: token,
      httponly: false,
      same_site: :none,
      secure: true
    }
    redirect_to "http://localhost:3000", allow_other_host: true
  end


################################################################################################################################################################
  

  def callback_github
    auth = request.env['omniauth.auth']
    oauth = OAuthProvider.find_by(uid: auth.uid, provider: auth.provider)

    if oauth
      user = oauth.user
    else 
      return render json: { error: "Unverified email" }, status: :unauthorized unless auth.extra.all_emails[0].verified
      user = User.find_by(email: auth.info.email)
      if user.nil?
        name = auth.info.name.split()
        user = User.new(
          username: generate_username, 
          last_name: name[1], 
          first_name: name[0], 
          email: auth.info.email, 
          password: SecureRandom.hex(8),
          imageUrl: auth.info.image
        )
        return render json: user.errors, status: :bad_request unless user.save
      end
      auth2 = OAuthProvider.create!(
        user: user,
        provider: auth.provider,
        uid: auth.uid 
      )
    end
    token = JsonWebToken.encode(
      user_id: user.id,
      email: user.email,
      username: user.username
    )

    if user.imageUrl.nil?
      user.update(imageUrl: auth.info.image)
    end
    redirect_to "https://localhost/auth/set_cookies?token=#{token}", allow_other_host: true
  end



################################################################################################################################################################
  


  def intra_callback
    auth = request.env['omniauth.auth']
    oauth = OAuthProvider.find_by(uid: auth.uid, provider: "intra42")

    if oauth
      user = oauth.user
    else 
      user = User.find_by(email: auth.info.email)
      if user.nil?
        user = User.new(
          username: generate_username, 
          last_name: auth.extra.raw_info.last_name, 
          first_name: auth.extra.raw_info.first_name, 
          email: auth.info.email, 
          password: SecureRandom.hex(8),
          imageUrl: auth.extra.raw_info.image.link
        )
        return render json: user.errors, status: :bad_request unless user.save
      end
      auth2 = OAuthProvider.create!(
        user: user,
        provider: 'intra42',
        uid: auth.uid
      )
    end
    token = JsonWebToken.encode(
      user_id: user.id,
      email: user.email,
      username: user.username
    )

    if user.imageUrl.nil?
      user.update(imageUrl: auth.extra.raw_info.image.link)
    end

    redirect_to "https://localhost/auth/set_cookies?token=#{token}", allow_other_host: true
  end



################################################################################################################################################################
  


  def create
    user = User.new(user_params)
    if user.save
      render json: user, status: :created
    else
      render json: user.errors, status: :bad_request
    end
  end


################################################################################################################################################################

  def forgot_password
    email = params[:email]

    if email.blank?
      return render json: { error: "Email not provided" }, status: :unprocessable_entity
    end

    user = User.find_by(email: email)

    if user.present?
      UserMailer.password_reset(user).deliver_now!
    end

    render json: { message: "If your email exists in our system, you will receive a reset link.", email: email }, status: :ok
  end
################################################################################################################################################################

  def update_forgot_password
    token = request.headers['Authorization']&.split(' ')&.last
    user_id = JsonWebToken.decode(token)['user_id']
    @user = User.find(user_id)

    if update_forgot[:new_password].eql?(update_forgot[:new_password_confirmation]) && update_forgot[:new_password].length > 7
        if @user&.authenticate(update_forgot[:new_password])
          render json: { errors: "New Password Should be Different Than Your Current Password!" }, status: :unprocessable_entity
        elsif @user.update!({ password: update_forgot[:new_password], password_confirmation: update_forgot[:new_password_confirmation] })
          render json: { errors: "Password Updated!" }, status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end

    else
      render json: { errors: "Wrong Password or Short NewPassword" }, status: :unprocessable_entity
    end
  end

################################################################################################################################################################
  

  def me
    render json: { json: @current_user.as_json(only: [:id, :username, :last_name, :first_name, :language, :email, :imageUrl]),  message: "ok" }
  end

  
  private

  def generate_username
    loop do
      username = "user_#{SecureRandom.hex(4)}"
      return username unless User.exists?(username: username)
    end
  end


################################################################################################################################################################
  

  def user_params
    request = params.require(:auth).permit(:username, :password, :password_confirmation, :last_name, :imageUrl, :first_name, :email)
  end

################################################################################################################################################################

  def update_params
    request = params.require(:auth).permit(:username, :last_name, :first_name, :imageUrl, :language)
  end

  def update_email
    request = params.require(:auth).permit(:email, :password, :password_confirmation)
  end

  def update_password
    request = params.require(:auth).permit(:new_password, :password, :new_password_confirmation)
  end

  def update_forgot
    request = params.require(:auth).permit(:new_password, :new_password_confirmation)
  end

  def update_api
    request = params.require(:auth).permit(:username, :email, :password, :imageUrl)
  end

end

