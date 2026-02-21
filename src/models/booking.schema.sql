CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE bookings_status AS ENUM('pending','confirmed','expired','cancelled');


CREATE TABLE bookings(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_seat_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status bookings_status DEFAULT 'pending',
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,

    -- Foriegn key
    CONSTRAINT fk_booking_to_event_seat_id
    FOREIGN KEY (event_seat_id)
    REFERENCES event_seats(id)
    ON DELETE CASCADE,   

    CONSTRAINT fk_booking_to_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE     
);

-- Prevent The double checking
-- 2 user comes your seat then select the type 'reserved' however that seat are  already reserved
-- blocked 

CREATE UNIQUE INDEX user_activation
ON bookings(event_seat_id)
WHERE status IN ('pending','confirmed');

-- user reserved (timeout) 
CREATE INDEX user_reserved_timeout 
ON bookings(expires_at);


-- seat queries 
CREATE INDEX idx_event_seat_id 
ON bookings(event_seat_id,status);

-- user-booked index

CREATE INDEX idx_user_booking
ON bookings(user_id,status);