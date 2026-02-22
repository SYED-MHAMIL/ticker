import { Router } from "express";
import { userRoute } from "./user.route.js";
import { venueRouter } from "./venue.route.js";
import { eventRouter } from "./event.route.js";
import { seatsRouter } from "./seats.route.js";
import { bookRouter } from "./book.route.js";

const  router= Router()

router.use("/auth", userRoute)
router.use("/venue",venueRouter)
router.use("/seats",seatsRouter)
router.use("/event",eventRouter)
router.use("/booking",bookRouter)

// router.use("/subscription",subscriptionRouter)

export {router}