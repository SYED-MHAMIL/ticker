import rabbitMQ from "../config/rabbit.js"
async function sendJob(jobData) {
  const {connect,channel} =await rabbitMQ()
  const queue = "seat_generation";
  await channel?.assertQueue(queue,{durable :true})
  channel?.sendToQueue(
   queue,
   Buffer.from(JSON.stringify(jobData)),
   {persistent:true}
  )
    
}

export {sendJob}  