import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { withTransaction } from "../utils/transaction.js";

const reserved_seat_booking = async (event_seat_id,
    user_id) => {
   return  withTransaction(async (client) => {
    const  event_seat_query = `
     SELECT * FROM event_seats
     WHERE id=$1
     FOR UPDATE
     `
     const es = await client.query(event_seat_query,[event_seat_id])
     if(es?.rows[0].seat_status === "reserved"){
         throw new ApiError(406,"this seat has been reverved by someone")
     }
     
  //  for reserved the seat
      const  es_query = `
     UPDATE event_seats
     SET seat_status = 'reserved'
     WHERE id=$1
     `
      await client.query(es_query,[event_seat_id])


     const  query= `            
           INSERT into bookings(event_seat_id,user_id)
           VALUES($1,$2)
           RETURNING *                                               
         `
    const params = [event_seat_id,user_id]
    const {rows} = await client.query(query,params)
   return rows[0] 
    
     })
}

const get_booked_seat =  async (booking_id) => {
  try {
      const  query= `
           SELECT * from bookings
           WHERE id=$1                              
         `
    const params = [booking_id]
    const {rows} = await db.query(query,params)
   return rows[0] 

  } catch (error) {
         throw new ApiError(406,error)    
  }
}

const getBookingforUpdate=  async (booking_id) => {
  try {
    // for booking  
    // event_seat_id UUID NOT NULL,
    // user_id UUID NOT NULL,
    // status bookings_status DEFAULT 'pending',
    // expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes'),
    // created_at

    // for  seat /
    //  event_id,
    // seat_id
    // ,seat_status

    const  query= `
           SELECT
           b.id, 
           b.event_seat_id,
           b.status AS booking_status,
           es.event_id,
           es.seat_id,
           es.seat_status,
           b.expires_at
           FROM bookings b
           JOIN event_seats es
              ON b.event_seat_id = es.id
           WHERE b.id=$1
           FOR UPDATE OF bookings, event_seats                             
         `
// for update means you looked this row in transaction


    const params = [booking_id]
    const {rows} = await db.query(query,params)
   return rows[0] 

  } catch (error) {
         throw new ApiError(406,error)    
  }
}


export default {reserved_seat_booking,get_booked_seat,getBookingforUpdate}