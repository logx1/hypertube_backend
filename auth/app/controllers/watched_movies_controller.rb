class WatchedMoviesController < ApplicationController
  def add_movie_watched
    watched_movie = @current_user.watched_movies.new(get_watched_data)
    if watched_movie.save
      render json: watched_movie, status: :created
    else
      render json: { errors: watched_movie.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_movie_watched
    if WatchedMovie.exists?(title: get_watched_data[:title], year: get_watched_data[:year])
      render json: { error: "Movie Watched" }, status: :ok
    else
      render json: { error: "Not Watched" }, status: :not_found 
    end
  end

  private
    def get_watched_data
      request = params.require(:watched_movie).permit(:title, :year)
    end
end
