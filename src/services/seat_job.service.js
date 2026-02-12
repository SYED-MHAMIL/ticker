import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import seatService from "./seat.service.js";
const seat_generation_jobs = async (req,res) => {
      const {groups} = req.body ;
      const {venueId} = req.params;
      const  {id} =  req.user;
       
      if (!(venueId && !Array.isArray(groups) && groups.length > 0 )) {
         throw new ApiError(406,"Invalid Inputs")
      }

      const total_seats = groups.reduce((p,c)=>c.count+p,0)
      
    // if seats already exits for this venue 
     if (!(await seatService.countSeats(venueId))) {
         throw new ApiError(406,"Seats already exits for this venue")
     }

}

export default {seat_generation_jobs}