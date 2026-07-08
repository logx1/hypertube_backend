class CreateWatchedMovies < ActiveRecord::Migration[8.1]
  def change
    create_table :watched_movies do |t|
      t.string :title
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
