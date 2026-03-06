import { ApiError } from "../utils/ApiError.js";
import seatService from "./seat.service.js";
import amqp from "amqplib"
async function startWorker() {
    
      const connection = await amqp.connect('amqp://user:password@localhost:5673');
      const channel =await connection.createChannel();
      const queue = "seat_generation";
      await channel.assertQueue(queue,{durable :true})
    //  prefetch method with the value of 1. This tells RabbitMQ not to give more than one message to a worker at a time. Or, in other words, don't dispatch a new message to a worker until it has processed and acknowledged the previous one. Instead, it will dispatch it to the next worker that is not still busy.
      channel.prefetch(1);
      channel.consume(queue,async (msg) => {
         if (!msg) return;

        const job = JSON.parse(msg.content.toString());
        console.log(msg.content.toString());
         try {
            await seatService.genetation_seats(job)
            channel.ack(msg)          
         } catch (error) {
             channel.nack(msg,false,true)
             throw new ApiError(406,error)
         }
         
     }, {    
     noAck: false
     });

    
}

startWorker()