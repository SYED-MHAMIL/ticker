import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const  createEventSeat =async (values,params) => {
  try {
    
         const query = `
         INSERT into event_seats (event_id,seat_id,seat_status)
         VALUES ${values.join(" ,")}
         `
         const  {rows} = await db.query(query,params)
  } catch (error) {
     throw  new ApiError(406,"create event seats error:",error)
  }
}

export default {createEventSeat}