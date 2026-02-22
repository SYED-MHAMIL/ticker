import { db } from "../db/index.js";

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


export default {reserved_seat_booking}