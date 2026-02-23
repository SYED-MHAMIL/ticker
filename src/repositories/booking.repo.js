import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const reserved_seat_booking = async (event_seat_id, user_id) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const seatResult = await client.query(
      `
        SELECT id, seat_status
        FROM event_seats
        WHERE id = $1
        FOR UPDATE
      `,
      [event_seat_id],
    );

    const seat = seatResult.rows[0];

    if (!seat) {
      throw new ApiError(404, "Event seat not found");
    }

    if (seat.seat_status !== "available") {
      throw new ApiError(409, "Seat is not available");
    }

    const bookingResult = await client.query(
      `
        INSERT INTO bookings(event_seat_id, user_id)
        VALUES ($1, $2)
        RETURNING *
      `,
      [event_seat_id, user_id],
    );

    await client.query(
      `
        UPDATE event_seats
        SET seat_status = 'reserved'
        WHERE id = $1
      `,
      [event_seat_id],
    );

    await client.query("COMMIT");
    return bookingResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(406, "Failed to reserve seat", error.stack);
  } finally {
    client.release();
  }
};

export default { reserved_seat_booking };
