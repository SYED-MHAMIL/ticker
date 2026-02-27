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


export default {reserved_seat_booking,get_booked_seat}