import express from "express";
    import cors from "cors";
import { router } from "./routes/index.route.js";
import { ApiError } from "./utils/ApiError.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: "localhost:3000",
  }),
);
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser())
app.use("/api/uploads", express.static("uploads"))
app.use("/api",router)


const errorHandler =(err,req,res,next )=>{
     if (err instanceof ApiError) {
        console.log(err);
        
        return res.status(err.statuscode).json(
          new ApiResponse(err?.statuscode,err.data,err.message)
        )
     }  
     console.log("error handler middlewaer ",err);
     
     return res.status(500).json(
          new ApiResponse(500,null,"Server Internal Error")
        )

}

app.use(errorHandler)


// TODO
//  ALL THERE ROUTES AND MIDLDE HANDLE

export { app };
