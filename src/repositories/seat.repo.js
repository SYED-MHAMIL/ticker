import { db } from "../db/index.js";

const createSeats = async (venue_id,seat_number,seat_type) => {
//     seat_number TEXT NOT NULL,
//   seat_type 
     try {
         const {rows}  =await  db.query(
           `INSERT INTO seats (venue_id,seat_number,seat_type) 
           VALUES ($1,$2,$3)
           RETURNING *
           `,
            [venue_id,seat_number,seat_type]
         )
         
         return rows[0]
     } catch (error) {
        throw new ApiError(406,error?.message)
     }
}

export default  {createSeats}