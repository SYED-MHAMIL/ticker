import { ApiError } from "../utils/ApiError.js";
import event_seatRepo from "../repositories/event_seat.repo.js";
import eventRepo from "../repositories/event.repo.js";
import { db } from "../db/index.js";


// create event with  specific event seats
const createEvent =async (req,res) => {
    // 
  const client  =await db.connect()
    try {
  const { event_name, description, start_time, end_time } = req.body;
    const { venue_id } = req.params;

    // ---- Validation ----
    if (!venue_id) {
      throw new ApiError(400, "Venue id is required");
    }

    if (!event_name || !event_name.trim()) {
      throw new ApiError(400, "Event name is required");
    }

    if (!description || !description.trim()) {
      throw new ApiError(400, "Description is required");
    }

    if (!start_time || !end_time) {
      throw new ApiError(400, "Start and End time are required");
    }

        // ---- Start Transaction ----
         await client.query("BEGIN");
    
        const created_event=await  eventRepo.createEvent(event_name, description, start_time, end_time,venue_id,client)
        console.log('createEvent', created_event);
        
        
        await event_seatRepo.createEventSeat(created_event.id,venue_id,client)
        await client.query('COMMIT')
        // save in db 

        return created_event
        
    } catch (error) {
            await client.query('ROLLBACK')
            console.log({'error': error});
            
         throw new ApiError(406,error)
    }finally{
         client.release()
    }   
}

export default {createEvent}