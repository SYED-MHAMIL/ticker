CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE seat_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_seats INT NOT NULL,
  created_seats INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  CONSTRAINT fk_seat_generation_jobs_to_venue_id
  FOREIGN KEY (venue_id)
  REFERENCES venues(id),
  
  CONSTRAINT fk_seat_generation_jobs_to_user_id
  FOREIGN KEY (requested_by)
  REFERENCES users(id)


  );  

CREATE INDEX idx_seat_jobs_status ON seat_generation_jobs(status);