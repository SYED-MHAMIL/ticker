import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";


const  setup_payment= async (payment_intent_id,booking_id,amount,currency,payment_status,privider) => {

  try {
//   booking_id UUID NOT NULL,
//   amount  INTEGER  NOT NULL,
//   currency currency_type DEFAULT '$',  
//   payment_status bookings_status DEFAULT 'pending',
//   privider provider_status  DEFAULT 'stripe' ,
//   created_at  TIMESTAMP DEFAULT NOW(),
    const query = `INSERT into payments (payment_intent_id,booking_id,amount,currency,payment_status,privider) VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `;
    const params = [payment_intent_id,booking_id,amount,'USD',payment_status,privider];
    const {rows} = await db.query(query, params);
    
   return rows[0]


  } catch (error) {
    throw new ApiError(406,`create booking error: ${error}`);
  }
};
export default {setup_payment}