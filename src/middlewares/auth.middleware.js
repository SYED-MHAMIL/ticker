import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import userRepo from "../repositories/user.repo.js"

const  verifyUser = async (req,res,next) => {
     const token =req.headers?.authorization?.replace("Bearer ","") ||   req.cookies?.accessToken
     if (!token) {
        throw new ApiError(406, "Unauthorized request")
     }

     if (token !== req.cookies?.accessToken) {
        throw new ApiError(406, "Unauthorized token")
     }
     
    const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_KEY)
    if (!decoded) {
        throw new ApiError(406, "Invalid Tokens")
     }
    
     
    const user = await userRepo.findUserbyID(decoded.id)
    if (!user) {
        throw new ApiError(406, "Unauthorized user")
     }
     
     req.user = user 
     console.log({"user" : req.user});
     
     next()

}


export {verifyUser}