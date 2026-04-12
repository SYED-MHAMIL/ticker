import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import userRepo from "../repositories/user.repo.js"
import { getPermissionForUserRole } from "../utils/getPermissionForUserRole.js"

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
     console.log('decoded',decoded);
     
     
    const user = await userRepo.findUserbyID(decoded.id)
    if (!user) {
        throw new ApiError(406, "Unauthorized user")
     }
   //   console.log({user});
     const role_permissions =  await getPermissionForUserRole(user?.role_id)
     console.log({role_permissions});
     
     req.user = {...user,role_permissions} 
     
     next()

}


export {verifyUser}