import { ApiError } from "../utils/ApiError.js"


const authorize_permission = (requiredPermissions)=> {
 return (req,res,next)=>{
     const userPermissions = req.user?.role_permissions?.permissions
    const  hasPermission =  requiredPermissions.every(perm=> userPermissions.includes(perm))
     if(!hasPermission){
             throw new ApiError(403, "Forbidden: You don't have permission to create a venue");
     }

     next()
    }   
}

export {authorize_permission}