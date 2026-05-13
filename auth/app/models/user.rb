class User < ApplicationRecord
    has_many :oauth_providers, dependent: :destroy
    has_secure_password
    validates :username, presence: true, uniqueness: true, length: { minimum: 3, maximum: 30 }
    validates :first_name, presence: true, length: { minimum: 3, maximum: 30 }
    validates :last_name, presence: true, length: { minimum: 3, maximum: 30 }
    validates :email, presence: true, uniqueness: true, length: { minimum: 10, maximum: 30 }, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :password, presence: true, confirmation: true, length: { minimum: 8 }
    validates :imageUrl, presence: false
    validates :language, presence: true
end
    