import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

// crete
// fetch next
//  mark completed
// marked filedcd
// update progress
const create = async (venue_id, requested_by, total_seats,groups) => {
  try {
    const query = `
           INSERT INTO  seat_generation_jobs (venue_id,requested_by,status,total_seats,groups)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING *
           `;

    const { rows } = await db.query(query, [
      venue_id,
      requested_by,
      "pending",
      total_seats,
      groups
    ]);
    return rows[0];
  } catch (error) {
    throw new ApiError(406, "create seatjpb errro",error);
  }
};

const fetchNextPending = async () => {
  try {
    const query = `
            UPDATE seat_generation_jobs
            SET status='processing', started_at = now() 
            WHERE id=(
                 SELECT  id FROM seat_generation_jobs 
                      WHERE status = 'pending'
                      ORDER BY created_at
                      FOR  UPDATE SKIP LOCKED  
                      LIMIT 1
                 )
            RETURNING * 
       `;
       
       const  {rows} =  await db.query(query)
       console.log(rows);
        return rows[0]
  
  } catch (error) {
     throw new ApiError(406, "fetch next pending job",error)
  }};


const markCompleted = async (jobID) => {
    try {
        const query = `
          UPDATE seat_generation_jobs
          SET status='completed', completed_at = now() 
          WHERE id= $1             
          RETURNING * 
     `;

      const  {rows} =  await db.query(query,[jobID])
      console.log(" mark completed row", rows);
      console.log(" mark completed jobid", jobID);
      
      return rows[0]
    } catch (error) {
         throw new ApiError(404,"mark completed error",error)
    }
};


const  markFailed = async (jobID) => {
    try {
        const query = `
          UPDATE seat_generation_jobs
          SET status='failed', started_at = now(), error_message = 'marked as failed'
          WHERE id= $1            
          RETURNING * 
     `;

      const  {rows} =  await db.query(query,[jobID])
      return rows[0]
    } catch (error) {
         throw new ApiError(404,"mark completed error")
    }
};


const updateProgress = async (client,jobID,seat_created_now) => {
    try {
        const query = `
          UPDATE seat_generation_jobs
          SET created_seats  = $1   
          WHERE id= $2             
          RETURNING * 
     `;

      const  {rows} =  await client.query(query,[seat_created_now,jobID])
      return rows[0]
    } catch (error) {
         throw new ApiError(404,"mark completed error")
    }
};



export default {
  create,
  updateProgress,
  fetchNextPending,
  markCompleted,
  markFailed,
};
