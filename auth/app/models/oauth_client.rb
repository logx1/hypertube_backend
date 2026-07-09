class OAuthClient < ApplicationRecord
  has_secure_password :secret, validations: false

  validates :client_id, uniqueness: true
end
