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


export   {userRoute}