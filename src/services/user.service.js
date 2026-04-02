import userRepo from "../repositories/user.repo.js";
import bcrypt from "bcrypt"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import  jwt from "jsonwebtoken"

const registerUser =async (req,res) => {
    let {fullname,email,password,username,role} =req.body;
    if (!role) {

    throw new ApiError(400, "All fields are required");
  }
    role = await userRepo.CheckRoleinDB(role)
    const role_id = role.id ; 
    if (!role_id) { 
      throw new ApiError(400, "role_id are required");
    }
     
    const isAllMissing = [username, email, fullname, password].some(
    (field) => !field || field.trim() === ""
  );

  if (isAllMissing) {
    throw new ApiError(400, "All fields are required");
  }
  password =await  bcrypt.hash(password,10) 
  const existedUser = await userRepo.findUserbyEmailandID(email,username);
   console.log(existedUser);
   
  if (existedUser) {
    throw new ApiError(409, "User email or username already exists");
  }

  const avatarPath = req?.files?.Avatar?.[0]?.path;
  const coverImagePath = req?.files?.CoverImage?.[0]?.path;

  if (!avatarPath) {
    throw new ApiError(400, "Avatar field is required");
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarPath);
  if (!uploadedAvatar) {
    throw new ApiError(500, "Avatar upload failed");
  }

  //  cover image

  if (!coverImagePath) {
    throw new ApiError(400, "Avatar field is required");
  }

  const uploadedCoverImage = await uploadOnCloudinary(coverImagePath);
  if (!uploadedCoverImage) {
    throw new ApiError(500, "Avatar upload failed");
  }

  const user = await userRepo.registerUser({fullname,email,password,username,avatar:uploadedAvatar.url,cover_image :uploadedCoverImage.url,role_id})
      if (!user) {
    throw new ApiError(400, "User is not saved in DB");
  }

  return user;
}

const assignRoleToUser = async (user_id,role_id) => {
   if ([user_id,role_id].some(c=> !c || c.trim()  ==  "")) {
          throw new ApiError(203,'user_id and role_id are required')
   }
           
 const user =await userRepo.assignRole(user_id,role_id)
   if (!user) {
          throw new ApiError(203,'user have not been gotten role')
   }
} 

const generateAccessAndRefreshToken =  async (user) => {
     const access_token = jwt.sign(user,process.env.ACCESS_TOKEN_KEY,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
     const refresh_token = jwt.sign(user,process.env.REFRESH_TOKEN_KEY,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
     return {access_token,refresh_token}

    }

const getPermission = async (role_id) => {
      if (!role_id) {
         throw new ApiError(406,' role id is  not defined')
      }
      try {
        const  p = await userRepo.getPermission(role_id)  
        return p
      } catch (error) {
        throw new ApiError(406,'Getting permission error')
      } 
}


const loginUser =async (req,res) => {
    let {email,password,username} =req?.body;

    if (!(email || username)) {
      throw new ApiError(400, "All fields are required");
    }
    const user = await userRepo.findUserbyEmailandID(email,username)

    if (!user) {
          throw new ApiError(400, "User did'nt found");
    }
    
    if (!password) {
          throw new ApiError(400, "password is required");
    }
    
    const isPasswordCorrect =await userRepo.isPasswordCorrect(user?.password,password)
    console.log({"hasHpassword" : user?.id , "password": password ,"cocrect passow":isPasswordCorrect
    });
    
    if (!isPasswordCorrect) {
          throw new ApiError(400, "wronge password !");
    }

    const role_permissions =   await getPermission(user?.role_id)
    
    const  {access_token,refresh_token} = await generateAccessAndRefreshToken({user_id : user?.id, role_permissions : role_permissions})
    const userdata=  await userRepo.loginUser(user?.id,refresh_token)
    console.log({"USER DATA " : userdata ,access_token,refresh_token});
    
    if (!userdata) {
          throw new ApiError(400, "usre does not found!");
    }
   
    
   return {userdata,access_token,refresh_token}
 
}

const logOut = async (req,res) => {
       const {id} = req?.user
      //  console.log({id});
       
       if (!id) {
          throw new ApiError(406,"User does not Login")
       } 
       await userRepo.logOut(id)
       return null
}  


export default {registerUser,loginUser,logOut,assignRoleToUser,getPermission}