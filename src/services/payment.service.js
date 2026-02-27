import { ApiError } from "../utils/ApiError.js";
import Stripe from "stripe";





const stripe= new Stripe(process.env.STRIPE_KEY)

const createPaymentIntent = async (req,res) => {
  const {amount,currency} = req.body;
  const {booking_id} = req.params

  const paymentIntent = await stripe.paymentIntents.create({
  amount:amount,
  currency: currency,
  automatic_payment_methods: {
    enabled: true,
  },
  metadata: {
    booking_id: booking_id
  },
});
   
return paymentIntent
 
}