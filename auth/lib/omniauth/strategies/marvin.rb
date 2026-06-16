require "omniauth-oauth2"

module OmniAuth
  module Strategies
    class Marvin < OmniAuth::Strategies::OAuth2
      option :name, "marvin"

      def build_access_token
        client.auth_code.get_token(
          request.params["code"],
          { redirect_uri: callback_url.split('?')[0] },
          {}
        )
      end
    end
  end
end