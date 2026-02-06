import userController from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { upload } from  "../middlewares/multer.middleware.js"

import { Router } from "express";

const  userRoute =  Router()
userRoute.post("/register",
    upload.fields([{name: "Avatar", maxCount :1 },{name: "CoverImage", maxCount :1 }]),
    userController.registerUser)

userRoute.post("/login",userController.login)
userRoute.post("/logout",verifyUser,userController.logOut)
// userRoute.post("/refreshtoken",userController.refreshAccessToken)
// userRoute.get("/get-user/:id",verifyUser,userController.getUSer)
// userRoute.delete("/delete-user",verifyUser,userController.deleteUser)
// userRoute.post("/change-password",verifyUser,userController.ChangeCurrentPassword)
// userRoute.post("/update-account-details",verifyUser,userController.updateAcountsDetails)
// userRoute.post("/channel/:username",verifyUser,userController.getUserChannelProfile)
// userRoute.get("/userWatchHistory",verifyUser,userController.getUserWatchHistory)


export   {userRoute}