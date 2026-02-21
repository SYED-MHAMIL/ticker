import { Router } from "express";
import bookingController from "../controllers/booking.controller";
import { verify } from "jsonwebtoken";

const bookRouter = Router();


bookRouter.post('/seat/:event_seat_id',verify,bookingController.reserved_seat_booking)

export  {bookRouter} 