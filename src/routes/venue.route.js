import { Router } from "express";
import venueController from "../controllers/venue.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { authorize_permission } from "../middlewares/authorize_permission.js";

const venueRouter = Router()

venueRouter.post('/create',verifyUser,authorize_permission(['create_venue']),venueController.createVenue)

export {venueRouter}
