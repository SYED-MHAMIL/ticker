CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE  bookings_status AS ENUM (
    'pending', 'confirmed', 'cancelled', 'expired'
);


CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_seat_id UUID NOT NULL ,
  user_id UUID NOT NULL ,
  status bookings_status DEFAULT 'pending' ,
  expires_at TIMESTAMP DEFAULT NOW() ,
  created_at  TIMESTAMP DEFAULT NOW(),
   
  
  CONSTRAINT fk_booking_to_event_seat_id
    FOREIGN KEY (event_seat_id)
    REFERENCES event_seats(id)
    ON DELETE CASCADE,


  CONSTRAINT fk_booking_to_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);

-- Prevent Double Booking 
ALTER TABLE bookings
ADD CONSTRAINT unique_active_booking
UNIQUE (event_seat_id)
WHERE status IN ('pending','confirmed')

-- index for user booking for how many tickets we have() 
CREATE INDEX idx_user_booked ON  bookings(user_id,status) 

-- index for user reserved expired
CREATE INDEX  idx_user_reserved_expired ON bookings(expires_at)
WHERE status = 'pending'


-- index for seat quesries (check seats is alreaddy reserved)

CREATE INDEX  idx_booking_event_seat ON bookings(event_seat_id,status)