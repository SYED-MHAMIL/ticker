import { db } from "../db.js";

const createVenue = async (
  owner_id,
  name,
  description,
  location,
  created_at,
) => {
  const query = `
     INSERT  INTO venues (owner_id,name,description,location,created_at)
     VALUES ($1,$2,$3,$4)
     RETURNING
    `;
  const values = [owner_id, name, description, location, created_at];
  const { rows } = db.query(query,values);
  return rows[0]
};





export default {createVenue}