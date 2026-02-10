import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const createEvent = async (event_name, description, start_time, end_time) => {

  try {
      
  const query = `INSERT into events (event_name,description,start_time,end_time) VALUES ($1,$2,$3,$4)`;
  const params = [event_name, description, start_time, end_time];
  const  {rows} =   await db.query(query, params);
return rows[0]


  } catch (error) {
    throw new ApiError(406, `create event error: ${error}`);
  }
};


export default {createEvent}