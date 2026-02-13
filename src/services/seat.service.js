import seatRepo from "../repositories/seat.repo.js";
import seat_jobRepo from "../repositories/seat_job.repo.js";
import { ApiError } from "../utils/ApiError.js";

const genetation_seats = async () => {
  const jobs = await seat_jobRepo.fetchNextPending();
  if (!jobs) {
    return jobs;
  }

  try {
    let values = [];
    let params = [];
    const BATCH_NO = 1000;
    const groups = jobs.groups;

    //  [{'count': 2},{'count': 1200}]

    for (let i = 0; i < groups.length; i++) {
      let idx = 1;
      for (let j = 0; j < groups[i].count; j++) {
        values.push(`($${idx++},$${idx++},$${idx++})`);
        //params : venue_id,seat_number,seat_type
        params.push(
          jobs.venue_id,
          groups[i].labelPrefix + (j + 1),
          groups[i].type,
        );
        if (BATCH_NO === values.length) {
          await seatRepo.insert_batches(values, params);
          values = [];
          idx = 1;
          params = [];
        }
      }
    }

    //  remaining batches
    if (values.length > 0) {
      await seatRepo.insert_batches(values, params);
      values = [];
      params = [];
    }
  } catch (error) {
    throw new ApiError(406, "Generation seats Error", error);
  }
  return jobs;
};

async function workerExecute(param) {
    while (true) {
  const job = await genetation_seats();
  try {
    if (!job) {
      await new Promise((res) => setTimeout(res, 500));
      continue;
    }
    await seat_jobRepo.markCompleted(job.id);
  } catch (error) {
    if (job?.id) {
      await seat_jobRepo.markFailed(job.id);
    }
  }
}
}

await workerExecute()

export default { genetation_seats };
