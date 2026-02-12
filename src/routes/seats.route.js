import { Router } from "express";
import seatController from "../controllers/seat.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const  seatsRouter = Router()
 
seatsRouter.post('/create/:venueId',verifyUser, seatController.createSeats)

export {seatsRouter}
