CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE  payment_status_enum AS ENUM (
    'pending','success', 'failed', 'refunded'
);


CREATE TYPE  currency_type AS ENUM (
    'USD','INR','PKR'
);

CREATE TYPE  provider_status AS ENUM (
    'stripe',  'razor pay'
);


CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id  VARCHAR(50) NOT NULL UNIQUE,
  booking_id UUID NOT NULL,
  amount  INTEGER  NOT NULL,
  currency currency_type DEFAULT 'USD',  
  payment_status payment_status_enum DEFAULT 'pending',
  privider provider_status  DEFAULT 'stripe',
  created_at  TIMESTAMP DEFAULT NOW(),
   

  CONSTRAINT fk_payment_to_booking_id
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE
);


