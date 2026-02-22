import { Router } from "express";
import { userRoute } from "./user.route.js";
import { venueRouter } from "./venue.route.js";
// import { verifyUser } from "../middlewares/auth.middleware.js";
import { seatsRouter } from "./seats.route.js";
// import { videoRouter } from "./video.route.js";
// import { subscriptionRouter } from "./subscription.route.js";
// import { videoReactionRouter } from "./videoReaction.route.js";

const  router= Router()

router.use("/auth", userRoute)
router.use("/venue",venueRouter)
router.use("/seats",seatsRouter)

// router.use("/subscription",subscriptionRouter)

export {router}