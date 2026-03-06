import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
    
const insert_batches = async (values,params,client)=> {    
    console.log({values,params});
    
     try {
        const  query  =  `
          INSERT INTO seats (venue_id,seat_number,seat_type)
          VALUES ${values.join(',')}
        `
        const {rows} = await client.query(query,params)
        console.log("insert batcehs row",rows);
        
        return rows[0]
   
     } catch (error) {
        throw new ApiError(406,error)
     }
    }


const  countSeats =async (venue_id) => {
        try {
            const query = `
                SELECT COUNT(*) FROM seat_generation_jobs WHERE id = $1
            `
            const {rows} =await  db.query(query,[venue_id])
            if (rows.length == 0) {
                return null
            }
            return rows[0]
        } catch (error) {
            throw new  ApiError(406,"GET COUNT ERRROR")
        }
}


export default {countSeats,insert_batches}