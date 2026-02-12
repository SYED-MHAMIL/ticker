import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const  countSeats =async (venue_id) => {
        try {
            const query = `
                SELECT COUNT(*) FROM seat_generation_jobs WHERE id = $1
            `
            const {rows} =  db.query(query,[venue_id])
            return rows[0]
        } catch (error) {
            throw new  ApiError(406,"GET COUNT ERRROR")
        }
}


export default {countSeats}



