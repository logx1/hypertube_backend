class JsonWebToken
    JWT_SECRET = Rails.application.secret_key_base
    def self.encode(userData, exp = 24.hours.from_now)
        userData[:exp] = exp.to_i
        JWT.encode(userData, JWT_SECRET, 'HS256')
    end
    def self.decode(token)
        userData = JWT.decode(token, JWT_SECRET, true, { algorithm: 'HS256' })
        userData[0]
    rescue JWT::DecodeError
        nil
    end
end
