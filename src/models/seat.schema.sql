CREATE EXTENSION IF NOT EXISTS "uuid-ossp"

CREATE TYPE seat_type_enum AS ENUM(
  'available',
  'booked',
  'reserved'
)

CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL,
  seat_number TEXT NOT NULL,
  seat_type seat_type_enum NOT NULL DEFAULT 'available'

CONSTRAINT fk_seats_venue
  FOREIGN KEY (venue_id)
  REFERENCES venues(id)
  ON DELETE CASCADE
);
