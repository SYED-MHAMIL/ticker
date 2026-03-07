import { ApiError } from "../utils/ApiError.js";
import seatService from "./seat.service.js";
import rabbitMQ from "../config/rabbit.js";
async function startWorker() {
     const {connect,channel} =await rabbitMQ()

     console.log("Starting....");
      const queue = "seat_generation";
      await channel?.assertQueue(queue,{durable :true})
      channel?.prefetch(1);// take jusft one job
      channel?.consume(queue,async (msg) => {
      if (!msg) return;

        const job = JSON.parse(msg.content.toString());
        console.log(msg.content.toString());
         try {
            await seatService.genetation_seats(job)
            channel?.ack(msg)          
         } catch (error) {
             channel?.nack(msg,false,true)
             throw new ApiError(406,error)
         }
         
     }, {    
     noAck: false
     });

    
}

startWorker()