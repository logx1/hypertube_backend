class UserMailer < ApplicationMailer
  default from: ENV["GOOGLE_SMTP_USERNAME"]
  def password_reset(user)
    @user = user

    @token = user.signed_id(expires_in: 15.minutes, purpose: "password_reset")
    
    @reset_url = "http://localhost:3000/reset/#{@token}"
    
    mail(to: @user.email, subject: 'Reset Password on HyperTube')
  end
end
