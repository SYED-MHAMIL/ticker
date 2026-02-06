import { Router } from "express";
import { userRoute } from "./user.route.js";

// import { videoRouter } from "./video.route.js";
// import { subscriptionRouter } from "./subscription.route.js";
// import { videoReactionRouter } from "./videoReaction.route.js";

const  router= Router()

router.use("/auth", userRoute)
// router.use("/video",videoRouter)
// router.use("/video",videoReactionRouter)

// router.use("/subscription",subscriptionRouter)

export {router}


