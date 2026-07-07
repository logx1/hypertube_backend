-- Create a new user for the movies backend
CREATE USER movies_user WITH PASSWORD 'movies_password_here';

-- Create a separate database for the movies backend
CREATE DATABASE movies_production;

-- Grant all privileges on the database itself
GRANT ALL PRIVILEGES ON DATABASE movies_production TO movies_user;

-- Connect to the newly created database to apply schema changes
\c movies_production

-- Grant permission to create things inside the 'public' schema
GRANT USAGE, CREATE ON SCHEMA public TO movies_user;

-- Optional but recommended: Make movies_user the owner of the public schema
ALTER SCHEMA public OWNER TO movies_user;
