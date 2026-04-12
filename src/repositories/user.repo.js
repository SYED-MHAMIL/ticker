import { db, query } from "../db/index.js";
import bcrypt from "bcrypt"
import { ApiError } from "../utils/ApiError.js";
const registerUser = async (body) => {
     try {
         const {rows}  =await  db.query(
           `INSERT INTO users (fullname,email,password,username,avatar,cover_image,role_id) 
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id,fullname,username,email,avatar,cover_image,role_id
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
         const {rows}  = await  db.query(
           `SELECT * FROM roles
            WHERE name = $1
           `
         ,[role])
         console.log("check role in db ", rows);
         
         return rows[0]
     } catch (error) {
       console.log("CheckRoleinDB error:", error);
        throw new ApiError(406,error?.message)
     }
}

const getPermission = async (role_id) => {
  // get role permission list
   try {
   const query = `
     SELECT r.name, ARRAY_AGG(p.name) AS permissions
     FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.id = $1
     GROUP BY r.name
    `
     const { rows } = await db.query(query, [role_id])
     return rows[0] || { name: null, permissions: [] }
   
   } catch (error) {
       throw new ApiError(406, 'get user permission access failed')
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

const  assignRole  =async (user_id,role_id) => {
     const query  = `INSERT into user_roles(user_id,role_id)
                     VALUES ($1,$2) 
                     RETURNING *  
                    `
      const {rows} =  await db.query(query,[user_id,role_id])  
      return  rows[0]
}



export default {registerUser,findUserbyEmailandID,loginUser,isPasswordCorrect,logOut,findUserbyID,CheckRoleinDB,assignRole,getPermission}