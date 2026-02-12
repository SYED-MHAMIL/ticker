// import seatService from "../services/seat.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import  seatService from "../services/seat_job.service.js";


const createSeats = AsyncHandler(async (req, res) => {
    const data =   await seatService.seat_generation_jobs(req,res)
    return res.status(200).json(
        new ApiResponse(202,data,"Seats create Successfully")
    )
});

export default { createSeats };