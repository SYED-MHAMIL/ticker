import userRepo from "../repositories/user.repo.js";
import { redisClient } from "./redisClient.js";

const getPermissionForUserRole = async(role_id) => {
    //   appliad redis for save to recall query
    let redis =await redisClient.get(`params:${role_id}`)
    redis =  JSON.parse(redis)
     
      if (redis) {
        console.log({'redis cahce run' :redis});
        
          return redis// with data
      }
    
    const result =  await userRepo.getPermission(role_id)
    const json = JSON.stringify(result)
    redis = await redisClient.set(`params:${role_id}`,json,{
        EX : 3600
    })  
    console.log({'from B request' : redis} ,{result});
    
    return  result
};

export {getPermissionForUserRole}