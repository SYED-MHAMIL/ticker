CREATE EXTENSION IF NOT EXISTS "uuid-ossp"

CREATE TABLE event_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL
  seat_id UUID NOT NULL
   

CONSTRAINT fk_events_seat_to_event
  FOREIGN KEY (event_id)
  REFERENCES events(id)
  ON DELETE CASCADE

 CONSTRAINT fk_events_seat_to_seat
  FOREIGN KEY (seat_id)
  REFERENCES seats(id)
  ON DELETE CASCADE

);