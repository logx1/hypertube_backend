class User < ApplicationRecord
    has_many :watched_movies, dependent: :destroy
    has_many :oauth_providers, dependent: :destroy
    has_secure_password
    validates :username, presence: true, on: :create,  uniqueness: true, length: { minimum: 3, maximum: 30 }
    validates :first_name, presence: true, on: :create,  length: { minimum: 3, maximum: 30 }
    validates :last_name, presence: true, on: :create,  length: { minimum: 3, maximum: 30 }
    validates :email, presence: true, on: :create,  uniqueness: true, length: { minimum: 10, maximum: 30 }, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :password, presence: true, on: :create,  confirmation: true, length: { minimum: 8 }
    validates :imageUrl, presence: false, on: :create
    validates :language, presence: true, on: :create
end
