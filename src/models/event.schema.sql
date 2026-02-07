CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL ,
  event_name TEXT NOT NULL ,
  description TEXT ,
  start_time TIMESTAMP NOT NULL ,
  end_time TIMESTAMP NOT NULL,

  CONSTRAINT fk_events_venue
    FOREIGN KEY (venue_id)
    REFERENCES venues(id)
    ON DELETE CASCADE
);