import {db} from "../db/index.js";
// import * as jobRepo from "../repositories/seat_job.repo.js";
import seatRepo from "../repositories/seat.repo.js";
import seat_jobRepo from "../repositories/seat_job.repo.js";

const BATCH_SIZE = 1000;

const generateSeatsForJob = async (job) => {
  const client = await db.connect();
  let created = 0;

  try {
    await client.query("BEGIN");

    // Example groups (you can store groups JSON in job if needed)
    const groups = [
      { count: job.total_seats, labelPrefix: "A", type: "regular" }
    ];

    let batch = [];

    for (const group of groups) {
      for (let i = 1; i <= group.count; i++) {
        batch.push({
          venueId: job.venue_id,
          seatNumber: `${group.labelPrefix}${i}`,
          type: group.type
        });

        if (batch.length === BATCH_SIZE) {
          await seatRepo.insertBatch(client, batch);
          created += batch.length;
          batch = [];
          await jobRepo.updateProgress(job.id, created);
        }
      }
    }

    if (batch.length > 0) {
      await seatRepo.insertBatch(client, batch);
      created += batch.length;
      await jobRepo.updateProgress(job.id, created);
    }

    await client.query("COMMIT");
    await jobRepo.markCompleted(job.id);

  } catch (err) {
    await client.query("ROLLBACK");
    await jobRepo.markFailed(job.id, err.message);
    throw err;
  } finally {
    client.release();
  }
};

const workerLoop = async () => {
  while (true) {
    const job = await seat_jobRepo.fetchNextPending()

    if (!job) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    try {
      await generateSeatsForJob(job);
    } catch (err) {
      console.error("Job failed:", err);
    }
  }
};

workerLoop();
