import { Router } from "express";
import venueController from "../controllers/venue.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const venueRouter = Router()

venueRouter.post('/create',verifyUser,venueController.createVenue)

export {venueRouter}
