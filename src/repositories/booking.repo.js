import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const reserved_seat_booking = async (event_seat_id,
    user_id) => {
     const  query= `
           INSERT into bookings(event_seat_id,user_id)
           VALUES($1,$2)                            
         `
    const params = [event_seat_id,user_id]
    const {rows} = await db.query(query,params)
   return rows[0] 

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
           SELECT (event_seat_id,status AS booking_status,event_id,seat_id,seat_status) from bookings
           JOIN event_seats ON bookings.event_seat_id = event_seats.id
           WHERE id=$1
           FOR UPDATE OF bookings, event_seats                             
         `
    const params = [booking_id]
    const {rows} = await db.query(query,params)
   return rows[0] 

  } catch (error) {
         throw new ApiError(406,error)    
  }
}


export default {reserved_seat_booking,get_booked_seat,getBookingforUpdate}