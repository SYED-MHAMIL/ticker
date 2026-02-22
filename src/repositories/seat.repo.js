import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const createSeats = async (values, params) => {
  //     seat_number TEXT NOT NULL,
  //   seat_type
  try {
    const { rows } = await db.query(
      `INSERT INTO seats (venue_id,seat_number,seat_type) 
           VALUES ${values.join(", ")}
           `,
      params,
    );

    return rows[0];
  } catch (error) {
    throw new ApiError(406, error?.message);
  }
};

const fetchAllSeats = async (id) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM seats WHERE id=$1 
         `,
      [id],
    );

    return rows[0];
  } catch (error) {
    throw new ApiError(406, error?.message);
  }
};

export default { createSeats,fetchAllSeats };
