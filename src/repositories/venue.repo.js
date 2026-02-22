import { db } from "../db/index.js";

const createVenue = async (owner_id,name,description,location) => {
     try {
         const {rows}  =await  db.query(
           `INSERT INTO venues (owner_id,name,description,location) 
           VALUES ($1,$2,$3,$4)
           RETURNING *
           `,
            [owner_id,name,description,location]
         )
         
         return rows[0]
     } catch (error) {
        throw new ApiError(406,error?.message)
     }
}

export default {createVenue}