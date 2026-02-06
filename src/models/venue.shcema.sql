CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE venues {  
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
    owner_id UUID NOT NULL 
    name TEXT NOT NULL 
    description TEXT NOT NULL 
    location TEXT NOT NULL 
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW() 

    CONSTRAINT fk_venue_owner
       FOREIGN KEY (owner_id)
       REFERENCES users(id)
       ON DELETE CASCADE    

}


