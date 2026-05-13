FROM ruby:3.2.11

RUN apt update && \
    apt install build-essential rustc libssl-dev libyaml-dev zlib1g-dev libgmp-dev -y && \
    gem install rackup puma sinatra rails bcrypt

WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN rails new store

RUN bundle install

EXPOSE 8001

COPY . .

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]

# CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "8001"]

CMD ["bash", "-c", "rm -f tmp/pids/server.pid && bundle exec rails server -b 0.0.0.0 -p 8001"]