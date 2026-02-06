import pg from "pg"
import { DB_NAME, HOST_NAME, USER } from "../constant.js";
import dotenv from "dotenv"
dotenv.config()

const {Pool} = pg
const credentials = {
  user: USER,
  host: HOST_NAME,
  database: DB_NAME,
  password: process.env?.PASSWORD,
  port: process.env?.DB_PORT, // Default PostgreSQL port
};   

console.log("passsweord"   ,credentials);

const db = new Pool(credentials)
const query  =  async (text,params) => {
    try {
        return  await db.query(text,params)
    } catch (error) {
        //  thorw eroro
    }
}
const ConnectDB = async () => {
     try {
        const res  = await db.query('SELECT NOW()')
        console.log('Connected DB PosgresSQL,time is:',res.rows[0].now);
         
    } catch (error) {
         console.log("ERROR in DB" , error);
         
          process.exit(1)        
     }
}



export {db,ConnectDB,query}