import userService from "../services/user.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// regsiter  controller

const registerUser= AsyncHandler(async (req,res)=>{     
     
     const  user  =await userService.registerUser(req,res)
      return  res.status(200).send(
        new ApiResponse(200,user,"User register successfullya")
     )
   
})

const login= AsyncHandler(async (req,res)=>{     
     

     const  {userdata,access_token,refresh_token}  =await userService.loginUser(req,res)
      
     const options= {
     // Cookie valid for 24 hours (1 day)
     httpOnly: true,  // Not accessible via JavaScript
     secure: true,    // Only sent over HTTPS
     
     }
     return  res
     .status(200)
     .cookie('accessToken', access_token, options)
     .cookie('refreshToken', refresh_token, options)
     .json(
     
        new ApiResponse(200,{userdata,refresh_token},"User Loged in  successfullya")
     )
   
})


const logOut  = AsyncHandler(
     async (req,res) => {
     await  userService.logOut(req,res)       
  
       
     const options= {
     // Cookie valid for 24 hours (1 day)
     httpOnly: true,  // Not accessible via JavaScript
     secure: true,    // Only sent over HTTPS
     
     }
     res.status(403)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
      .json(
       new ApiResponse(200,null,"User logged Out successfully")
     )

  }

)




const refreshAccessToken  = AsyncHandler(
     async (req,res) => {
     const {accessToken, refreshToken} = await  userService.refreshAccessToken(req,res)

       
     const options= {
     // Cookie valid for 24 hours (1 day)
     httpOnly: true,  // Not accessible via JavaScript
     secure: true,    // Only sent over HTTPS
     
     }
     res.status(403)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
       new ApiResponse(200,null,"Refresh Token successfully")
     )

  }

  

)

const ChangeCurrentPassword = AsyncHandler(
     async (req,res) => {
     await  userService.ChangeCurrentPassword(req,res)
     res.status(200).json(
           new ApiResponse(200,null, "Password changed Successfully !")
     )

     } 

)


const getUSer = AsyncHandler(
     async (req,res) => {
     await  userService.getUser(req,res)
     res.status(200).json(
           new ApiResponse(200,null, "User fetched Successfully !")
     )

     } 

)

const deleteUser =  AsyncHandler(
     async (req,res) => {
     await  userService.deleteUser(req,res)
     res.status(200).json(
           new ApiResponse(200,null, "User deleted Successfully !")
     )

     } 
)

const updateAcountsDetails =   AsyncHandler(
     async (req,res) => {
     const user  = await  userService.updateAcountsDetails(req,res)
     res.status(200).json(
           new ApiResponse(200,user, "User updated Successfully !")
     )

     } 
)

const  getUserChannelProfile = AsyncHandler(
     async (req,res) => {
     const user  = await userService.getUserChannelProfile(req,res)
     res.status(200).json(
           new ApiResponse(200,user, "user channel got Successfully!")
     )
     } 

    

)


const  getUserWatchHistory = AsyncHandler(
     async (req,res) => {
     const user  = await userService.getUserWatchHistory(req,res)
     res.status(200).json(
           new ApiResponse(200,user, "User got History Successfully!")
     )
     } 

    

)


export default {registerUser,login,logOut,refreshAccessToken,ChangeCurrentPassword,getUSer,deleteUser,updateAcountsDetails,getUserChannelProfile,getUserWatchHistory}
