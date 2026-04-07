-- Initial database schema for ticketing app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE IF NOT EXISTS seat_type_enum AS ENUM(
  'vip',
  'regular',
  'balcony'
);

CREATE TYPE IF NOT EXISTS seat_status_enum AS ENUM(
  'available',
  'booked',
  'reserved'
);

CREATE TYPE IF NOT EXISTS bookings_status AS ENUM('pending','confirmed','expired','cancelled');

CREATE TYPE IF NOT EXISTS payment_status_enum AS ENUM (
  'pending','success','failed','refunded'
);

CREATE TYPE IF NOT EXISTS currency_type AS ENUM (
  'USD','INR','PKR'
);

CREATE TYPE IF NOT EXISTS provider_status AS ENUM (
  'stripe','razor pay'
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT FALSE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fullname VARCHAR(100),
  avatar TEXT,
  cover_image TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_venue_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL,
  seat_number TEXT NOT NULL,
  seat_type seat_type_enum NOT NULL DEFAULT 'regular',
  CONSTRAINT fk_seats_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seat_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_seats INT NOT NULL,
  groups JSONB NOT NULL,
  created_seats INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT fk_seat_generation_jobs_to_venue_id FOREIGN KEY (venue_id) REFERENCES venues(id),
  CONSTRAINT fk_seat_generation_jobs_to_user_id FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_seat_jobs_status ON seat_generation_jobs(status);

CREATE TABLE IF NOT EXISTS event_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  seat_id UUID NOT NULL,
  seat_status seat_status_enum DEFAULT 'available',
  CONSTRAINT uq_event_seat UNIQUE (event_id, seat_id),
  CONSTRAINT fk_events_seat_to_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_seat_to_seat FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_seat_status ON event_seats(seat_status);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_seat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status bookings_status DEFAULT 'pending',
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  CONSTRAINT fk_booking_to_event_seat_id FOREIGN KEY (event_seat_id) REFERENCES event_seats(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_to_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS user_activation ON bookings(event_seat_id) WHERE status IN ('pending','confirmed');
CREATE INDEX IF NOT EXISTS user_reserved_timeout ON bookings(expires_at);
CREATE INDEX IF NOT EXISTS idx_event_seat_id ON bookings(event_seat_id,status);
CREATE INDEX IF NOT EXISTS idx_user_booking ON bookings(user_id,status);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id VARCHAR(50) NOT NULL UNIQUE,
  booking_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency currency_type DEFAULT 'USD',
  payment_status payment_status_enum DEFAULT 'pending',
  privider provider_status DEFAULT 'stripe',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_payment_to_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
