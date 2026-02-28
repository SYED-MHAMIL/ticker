CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE seat_status_enum AS ENUM(
  'available',
  'booked',
  'reserved'
);


CREATE TABLE IF NOT EXISTS event_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  seat_id UUID NOT NULL,
  seat_status seat_status_enum DEFAULT 'available',
  CONSTRAINT uq_event_seat UNIQUE (event_id, seat_id),
  CONSTRAINT fk_events_seat_to_event
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_events_seat_to_seat
    FOREIGN KEY (seat_id)
    REFERENCES seats(id)
    ON DELETE CASCADE
);


CREATE INDEX idx_event_seat_status  on  event_seats(seat_status)