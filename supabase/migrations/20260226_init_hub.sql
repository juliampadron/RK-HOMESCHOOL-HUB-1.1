-- RBAC setup
CREATE ROLE guest;
CREATE ROLE registered;
CREATE ROLE verified_family;
CREATE ROLE admin;

-- Tables
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE hub_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT current_timestamp
);