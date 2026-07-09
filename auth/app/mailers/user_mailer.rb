class UserMailer < ApplicationMailer
  default from: ENV["GOOGLE_SMTP_USERNAME"]
  def password_reset(user)
    @user = user

    token = JsonWebToken.encode(
      {
        user_id: @user.id,
        email: @user.email,
        username: @user.username
      },
      5.minutes.from_now
    )
    
    @reset_url = "http://localhost:3000/reset/#{token}"
    
    mail(to: @user.email, subject: 'Reset Password on HyperTube')
  end
end