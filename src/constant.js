import dotenv from "dotenv"
dotenv.config({
    path: "./.env"
 })    

const DB_NAME = process.env.DB_NAME || "ticketprime";
const HOST_NAME = process.env.DB_HOST || "postgres";
const USER = process.env.DB_USER || "postgres";

export { DB_NAME, HOST_NAME, USER };
