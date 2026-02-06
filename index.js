import dotenv from  "dotenv"
import { app } from "./src/app.js";
import { ConnectDB } from "./src/db/index.js";


dotenv.config({
    path: "./.env"
 })    

// lisetn serveer and connect DB 

ConnectDB().then(
    ()=>{
        app.listen(process.env.PORT || 8000,()=>{
            console.log(`PORT is running on ${process.env.PORT}`);
        })
    }
).catch(err =>  console.log("POSGRESQL db connection failed !!! ", err))
