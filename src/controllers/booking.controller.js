
 import bookingService from "../services/booking.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


const reserved_seat_booking = AsyncHandler(async (req, res) => {
    const data =   await bookingService.reserved_seat_booking(req,res)
    return res.status(200).json(
        new ApiResponse(202,data,"event create Successfully")
    )
});

export default { reserved_seat_booking };