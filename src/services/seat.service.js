import seatRepo from "../repositories/seat.repo.js";

import { ApiError } from "../utils/ApiError.js";

const  createSeats =async (req,res) => {
    const {groups} =req.body;
 
    const {venueId} = req.params
    if (!venueId) {
    throw new ApiError(400, "Venue are not setted");
  }
   
   if (!venueId || !Array.isArray(groups)) {
    throw new ApiError(400, "Invalid input");
  }
    
  for (const group of groups) {
      const { count, labelPrefix, type } = group;
    
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (let i = 1; i <= count; i++) {
        const seatNumber = `${labelPrefix}${i}`;

        values.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`
        );

        params.push(venueId, seatNumber, type);
        paramIndex += 3;
      }

      await seatRepo.createSeats(values,params)
    }


        return { message: "Seats created successfully" };


}


export default {createSeats}