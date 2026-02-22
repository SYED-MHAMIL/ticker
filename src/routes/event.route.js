import { Router } from "express";
import seatController from "../controllers/seat.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import eventController from "../controllers/event.controller.js";

const  eventRouter = Router()
 
eventRouter.post('/create/:venue_id',verifyUser, eventController.createSeats)

export {eventRouter}
