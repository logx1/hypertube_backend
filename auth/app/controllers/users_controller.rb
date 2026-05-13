class UsersController < ApplicationController
  skip_before_action :authenticate, only: [ :create, :callback_github, :callback_google, :intra_callback, :set_cookies ]


################################################################################################################################################################
  

  def index
    render json: { message: "Auth endpoint working" }
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
    redirect_to "http://127.0.0.1:8001/set_cookies?token=#{token}", allow_other_host: true
  end


################################################################################################################################################################
  

  def set_cookies
    token = params[:token]
    cookies["token"] = {
      value: token,
      httponly: true,
      domain: "localhost",
      same_site: :lax,
      secure: false
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
    redirect_to "http://127.0.0.1:8001/set_cookies?token=#{token}", allow_other_host: true
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

    redirect_to "http://127.0.0.1:8001/set_cookies?token=#{token}", allow_other_host: true
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
  

  def me
    render json: { json: @current_user.as_json(only: [:id, :email, :password_digest, :language]),  message: "ok" }
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
    request = params.require(:auth).permit(:username, :password, :password_confirmation, :last_name, :first_name, :email)
  end

end