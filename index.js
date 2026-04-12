import dotenv from  "dotenv"
import { app } from "./src/app.js";
import { ConnectDB } from "./src/db/index.js";
import {redisConnect} from "./src/utils/redisClient.js";


dotenv.config({
    path: "./.env"
 });    


// lisetn server and connect DB 
(async () => {
    try {
        await ConnectDB()
        app.listen(process.env.PORT || 8000,()=>{
            console.log(`PORT is running on ${process.env.PORT}`);
        })
        try {
            await redisConnect()
        } catch (error) {
        console.log("Redis connection failed !!! ", err)
            
        }
    } catch (error) {
        console.log("POSGRESQL db connection failed !!! ", err)
        throw new ApiError(404,"POSGRESQL db connection failed !!!");
        
    }
})()
