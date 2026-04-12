import {createClient}  from  'redis'
import dotenv from 'dotenv';
import { ApiError } from './ApiError.js';
dotenv.config({
    path: "./.env"
 })    

const redisClient = createClient({
  url: process?.env?.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis error:', err));

const  redisConnect=async () => {
    try {
        await redisClient.connect();
        console.log('Redis successfully  connect');
        
        
    } catch (error) {
        console.log({'redis connection error':error});
        
        throw new ApiError(403,error)
         
    }
}

export {redisConnect,redisClient}