import { db } from "../db/index.js";

const insertBatch = async (client, rows) => {
  const values = [];
  const params = [];
  let idx = 1;

  for (const row of rows) {
    values.push(`($${idx++}, $${idx++}, $${idx++})`);
    params.push(row.venueId, row.seatNumber, row.type);
  }

  await client.query(
    `
    INSERT INTO seats (venue_id, seat_number, seat_type)
    VALUES ${values.join(",")}
    `,
    params
  );
};

const countByVenue = async (venueId) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) FROM seats WHERE venue_id = $1`,
    [venueId]
  );
  return Number(rows[0].count);
};

export default {
  insertBatch,
  countByVenue
};

