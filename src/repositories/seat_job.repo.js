import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const create = async ({venueId, requestedBy, totalSeats}) => {
  console.log("from seat jpob serveices", venueId);
  
  try {
    const query = `INSERT INTO  seat_generation_jobs (venue_id,requested_by,status,total_seats)
        VALUES ($1,$2,$3,$4)
        RETURNING *
        `;
    const {rows} =await db.query(query, [venueId, requestedBy,'pending', totalSeats]);
     return  rows[0]

  } catch (error) {
    throw new ApiError(406, "job create error",error);
  }
};

const fetchNextPending = async () => {
  const query = `
     UPDATE seat_generation_jobs
     SET status = 'processing', started_at = now()
     WHERE id = (
     SELECT id FROM seat_generation_jobs
     WHERE  status = 'pending'
     ORDER BY created_at
     FOR UPDATE  SKIP LOCKED
     LIMIT 1
     )
     RETURNING *  
     `;
  const { rows } = await db.query(query);
  console.log("fect job" ,  rows);
  
  return  rows[0]
};



const markCompleted = async (jobId) => {
  await db.query(
    `
    UPDATE seat_generation_jobs
    SET status = 'completed', completed_at = now()
    WHERE id = $1
    `,
    [jobId]
  );
};

const markFailed = async (jobId, error) => {
  await db.query(
    `
    UPDATE seat_generation_jobs
    SET status = 'failed', error_message = $2
    WHERE id = $1
    `,
    [jobId, error]
  );
};


const updateProgress = async (jobId, createdSeats) => {
  await db.query(
    `
    UPDATE seat_generation_jobs
    SET created_seats = $2
    WHERE id = $1
    `,
    [jobId, createdSeats]
  );
};


export default { create,updateProgress,fetchNextPending,markCompleted,markFailed };