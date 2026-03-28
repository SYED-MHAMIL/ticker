import { db } from "../db/index.js";
import bcrypt from "bcrypt"
const registerUser = async (body) => {
     try {
         const {rows}  =await  db.query(
           `INSERT INTO users (fullname,email,password,username,avatar,cover_image,role_id) 
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING fullname,username,email,avatar,cover_image
           `,
            [body.fullname,body.email,body.password,body.username,body.avatar,body.cover_image,body.role_id]
         )
         
         return rows[0]
     } catch (error) {
        throw new ApiError(406,error?.message)
     }
}



const CheckRoleinDB = async (role) => {
     try {
         const {rows}  =await  db.query(
           `SELECT * FROM roles
            WHERE name = $1
           `
         ,[role])
         
         return rows[0]
     } catch (error) {
        throw new ApiError(406,error?.message)
     }
}

const findUserbyEmailandID= async (email,username) => {
          const {rows} = await db.query(
                    `SELECT * FROM users WHERE email=$1 OR username=$2
                    `,  
                    [email,username]
                    )
                    console.log("find row" , rows);
                    
                    if (!rows) {
                             return null
                    }
                    return rows[0]
}


const findUserbyID= async (id) => {
          const {rows} = await db.query(
                    `SELECT * FROM users WHERE id=$1 
                    `,  
                    [id]
                    )
                    // if (rows.length == 0) {
                    //          return null
                    // }
                    return rows[0]
}
const isPasswordCorrect = async (hash,password) => {
      const ispassword = await bcrypt.compare(password,hash)
      return ispassword   
}

const loginUser = async (id, refresh_token) => {
  const query = `
    UPDATE users
    SET refresh_token = $1
    WHERE id = $2
    RETURNING *
  `

  const values = [refresh_token, id]

  const { rows } = await db.query(query, values)
  return rows[0]
}

const logOut = async (id) => {
  const query = `
    UPDATE users
    SET refresh_token = $1
    WHERE id = $2
    RETURNING *
  `
  const values = [undefined, id]

  const { rows } = await db.query(query, values)
  return rows[0]
}




export default {registerUser,findUserbyEmailandID,loginUser,isPasswordCorrect,logOut,findUserbyID,CheckRoleinDB}