import { Router } from "express";
import seatController from "../controllers/seat.controller.js";

const  seatsRouter = Router()
 
seatsRouter.post('/create/:venueId', seatController.createSeats)

export {seatsRouter}
