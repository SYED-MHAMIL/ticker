import bookingRepo from "../repositories/booking.repo.js";
import {ApiError} from "../utils/ApiError.js"

const reserved_seat_booking=async (req,res) => {
    const {id} =req.user;
    const {event_seat_id} = req.params; 
    if (!event_seat_id) {
      throw new ApiError(400, "Event seat is required");
    }

    if (!id) {
      throw new ApiError(400, "Authorized user is required");
    }
     
    const data =  await bookingRepo.reserved_seat_booking(event_seat_id,id)
      if (!data) {
      throw new ApiError(400, "seat booking error");
    }
    return data

}


export default {reserved_seat_booking}