import amqp from "amqplib"
import dotenv from "dotenv"
dotenv.config({path : './.env'})

const  rabbitMQ =  async () => {
    const connect= await  amqp.connect(process.env.RABBIT_URL)
    const channel  = await connect.createChannel()  
    return {connect,channel}    
}

export default rabbitMQ