import { db } from "../db/index.js";

const createVenue = async (
  owner_id,
  name,
  description,
  location
) => {
  const query = `
     INSERT  INTO venues (owner_id,name,description,location)
     VALUES ($1,$2,$3,$4)
     RETURNING *
    `;

  const values = [owner_id, name, description, location];
  const { rows } = await db.query(query,values);
  console.log("create venue",rows);
  
  return rows[0]
};





export default {createVenue}