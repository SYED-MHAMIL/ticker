import { db } from "../db/index.js";
import seatRepo from "../repositories/seat.repo.js";
import seat_jobRepo from "../repositories/seat_job.repo.js";
import { ApiError } from "../utils/ApiError.js";

const genetation_seats = async (client) => {
  
  const jobs = await seat_jobRepo.fetchNextPending(client);
  if (!jobs) {
    return jobs;
  }

  try {
    let values = [];
    let params = [];
    const BATCH_NO = 1000;
    const groups = jobs.groups;

    //  [{'count': 2},{'count': 1200}]

    let idx = 1;
    for (let i = 0; i < groups.length; i++) {
      for (let j = 0; j < groups[i].count; j++) {
        values.push(`($${idx++},$${idx++},$${idx++})`);
        //params : venue_id,seat_number,seat_type
          params.push(
          jobs.venue_id,
          groups[i].labelPrefix + (j + 1),
          groups[i].type,
        );
        if (BATCH_NO === values.length) {
          await seatRepo.insert_batches(values, params,client);
          values = [];
          idx = 1;
          params = [];
        }
      }
    }

    //  remaining batches
    if (values.length > 0) {
      await seatRepo.insert_batches(values, params,client);
      values = [];
      params = [];
    }
  } catch (error) {
    throw new ApiError(406, "Generation seats Error", error);
  }
  return jobs;
};

async function workerExecute() {
    while (true) {
    const client =await db.connect()  
    await client.query('BEGIN')
  const job = await genetation_seats(client);
      try {
    if (!job) {
      await new Promise((res) => setTimeout(res, 500));
      continue
      ;
    }
    await seat_jobRepo.markCompleted(job.id,client);
    await client.query('COMMIT')
  } catch (error) {
    await  client.query('ROLLBACK')
    if (job?.id) {
      await seat_jobRepo.markFailed(job.id);
    }
  }
  finally {
      client.release();
    }
}
}

await workerExecute()

export default { genetation_seats };
