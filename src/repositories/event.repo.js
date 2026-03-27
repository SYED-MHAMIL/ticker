
import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const createEvent = async (event_name, description, start_time,end_time,venue_id,client) => {

  try {
      
    const query = `INSERT into events (event_name,description,start_time,end_time,venue_id) VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `;
    const params = [event_name, description, start_time, end_time,venue_id];
    const  {rows} = await client.query(query, params);
    console.log("event repo ", rows);
    
   return rows[0]


  } catch (error) {
    throw new ApiError(406,`create event error: ${error}`);
  }
};
export default {createEvent}