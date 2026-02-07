import venueService from "../services/venue.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const createVenue = AsyncHandler(async (req,res) => {
        const venue =  await venueService.createVenue(req,res) 
        return res.status(200).json(
            new  ApiResponse(202,venue,"Venue create Successfully")
        )
 
});


export default  {createVenue}