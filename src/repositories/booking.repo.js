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


const update_booking_status = async () => {
  try {

     const  query= `
           UPDATE bookings
           SET status = 'expired'
           WHERE status = 'pending' 
           AND  expires_at < NOW()
         `
    const {rows} = await db.query(query)
   return rows[0]
    
  } catch (error) {
    throw new ApiError(406,error)
  }
} 


export default {reserved_seat_booking,update_booking_status}