import { db } from "../db/index.js";
import seatRepo from "../repositories/seat.repo.js";
import seat_jobRepo from "../repositories/seat_job.repo.js";
import { ApiError } from "../utils/ApiError.js";
const seat_generation_jobs = async (req,res) => {
      const {groups} = req.body ;
      const {venueId} = req.params;
      const  {id} =  req.user;
       
      if (!(venueId && Array.isArray(groups) && groups.length > 0 )) {
         throw new ApiError(406,"Invalid Inputs")
      }

      const total_seats = groups.reduce((p,c)=>c.count+p,0)
      
    // if seats already exits for this venue 
     if (!(await seatRepo.countSeats(venueId))) {
         throw new ApiError(406,"Seats already exits for this venue")
     }

     const jsongroups = JSON.stringify(groups)     
       const data = await seat_jobRepo.create(
        venueId,
        id,
        total_seats,
        jsongroups
     )
     return data

}

export default {seat_generation_jobs}