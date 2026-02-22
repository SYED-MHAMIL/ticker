// import seatService from "../services/seat.service.js";
import eventService from "../services/event.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


const createSeats = AsyncHandler(async (req, res) => {
    const data =   await eventService.createEvent(req,res)
    return res.status(200).json(
        new ApiResponse(202,data,"event create Successfully")
    )
});

export default { createSeats };