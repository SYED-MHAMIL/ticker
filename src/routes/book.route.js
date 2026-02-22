import { Router } from "express";
import bookingController from "../controllers/booking.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const bookRouter = Router();


bookRouter.post('/create/:event_seat_id',verifyUser,bookingController.reserved_seat_booking)

export  {bookRouter} 