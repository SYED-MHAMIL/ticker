import venueRepo from "../repositories/venue.repo.js";
import { ApiError } from "../utils/ApiError.js";
import userRepo from "../repositories/user.repo.js";

const  createVenue =async (req,res) => {
    const {name, description, location} =req.body;
    const {id} = req.user
    if (!id) {
    throw new ApiError(400, "Login User are required");
  }
      
    const isAllMissing = [name, description, location].some(
    (field) => !field || field.trim() === ""
  );

  if (isAllMissing) {
    throw new ApiError(400, "All fields are required");
  } 
  const existedUser = await userRepo.findUserbyID(id);
   
  if (!existedUser) {
    throw new ApiError(409, "Unaughorized User");
  }

    const venue = await venueRepo.createVenue(id,name,description,location) 
    if (!venue) {
    throw new ApiError(400, "User is not saved in DB");
  }
  
  return venue;
}


export default {createVenue}