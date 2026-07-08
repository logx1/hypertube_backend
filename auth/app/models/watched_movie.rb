class WatchedMovie < ApplicationRecord
  belongs_to :user

  validates :title, uniqueness: { scope: [:user_id, :year], message: "already watched this movie for this year" }
  validates :year, numericality: { only_integer: true, greater_than: 1600 }, allow_nil: true
end
