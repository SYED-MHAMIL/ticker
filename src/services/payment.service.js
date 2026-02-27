import { ApiError } from "../utils/ApiError.js";
import Stripe from "stripe";
import { db } from "../db/index.js";
import bookingRepo from "../repositories/booking.repo.js";



const withTransaction=async (handler) => {
  try {
    const client = await db.connect();
    await client.query('BEGIN')
    await  handler(client)
    await client.query('COMMIT')
  } catch (error) {
      await client.query('ROLLBACK')
      throw new ApiError(406,error)
  }finally{
       client.release()
  }
 
}



const stripe= new Stripe(process.env.STRIPE_KEY)

const createPaymentIntent = async (req,res) => {
  const {amount,currency} = req.body;
  const {booking_id} = req.params;
  const user_id =  req.user.id

  const paymentIntent = await stripe.paymentIntents.create({
  amount:amount,
  currency: currency,
  automatic_payment_methods: {
    enabled: true,
  },
  metadata: {
    booking_id: booking_id,
    user_id :user_id
  },
});

const data = withTransaction(async (client) => {
       const get_booked_seat = bookingRepo.get_booked_seat(booking_id)

})
   
return paymentIntent
 
}