
import { ApiError } from "../utils/ApiError.js";

const  createEventSeat =async (event_id,venue_id,client) => {
  try {
         const query = `
         INSERT into event_seats (event_id,seat_id,seat_status)
         SELECT $1,id,'available' FROM seats
         WHERE venue_id =$2
         `
         const  {rows} = await client.query(query,[event_id,venue_id])
         return rows[0]
  } catch (error) {
     throw  new ApiError(406,error)
  }
}



const  updateEventSeat_Status =async (event_seat_id,client) => {
  try {
         const query = `
            UPDATE event_seats
            SET  seat_status = 'reserved'
            WHERE id=$1 
         `
         const  {rows} = await client.query(query,[event_seat_id])
         return rows[0]
  } catch (error) {
     throw  new ApiError(406,error)
  }
}


export default {createEventSeat,updateEventSeat_Status}     