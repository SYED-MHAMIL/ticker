CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);
