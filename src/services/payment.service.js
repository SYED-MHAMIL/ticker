import { ApiError } from "../utils/ApiError.js";
import Stripe from "stripe";
import { db } from "../db/index.js";
import bookingRepo from "../repositories/booking.repo.js";
import event_seatRepo from "../repositories/event_seat.repo.js";
import paymentRepo from "../repositories/payment.repo.js";

const withTransaction = async (handler) => {
  let client; 
  try {
    client = await db.connect();
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new ApiError(406, error);
  } finally {
    client.release();
  }
};

const isBookingExpired = (booking) => {
  return new Date(booking.expires_at) < new Date();
};
// booking  markedasexpired and seat at now avialable for everyone
const bookingMarkAsExpired =async(booking,client) => {
     try { 
           const query = `
            UPDATE bookings 
            SET status = 'expired'
            WHERE id = $1 
           `
         await client.query(query,[booking.id])
        await client.query(`
          UPDATE event_seats
          SET status= 'available'
          WHERE id=$1 and status='reserved'
          `,[booking.event_seat_id])
       
     } catch (error) {
        throw new ApiError(406,"booking marked error")
     }
};

const stripe = new Stripe(process.env.STRIPE_KEY);

const createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body;
  const { booking_id } = req.params;
  const user_id = req.user.id;

   if(!amount && amount > 0 ){
       throw new ApiError(406,`${!isNaN(amount) ? 'Amount field are required' : 'Amount should be digit' }`)
   }

   if(!currency){
       throw new ApiError(406,"currency field are required")
   }
    
   if(!user_id){
       throw new ApiError(406,"Authorized user  is required")
   }

   if(!booking_id){
       throw new ApiError(406,"booking_id user is required")
   }

   return withTransaction(async (client) => {
     
       const booking = await bookingRepo.getBookingforUpdate(booking_id);
       if(isBookingExpired(booking)){
            await bookingMarkAsExpired(booking,client)
            throw new ApiError(406,"Booking has been expired")
       }

    if(booking.seat_status !== "booked"){
          throw new ApiError(406,"Seat has been sold");

     }
    if (get_booking_seat.seat_status !== "expired") {
      await event_seatRepo.updateEventSeat_Status(
        get_booking_seat.event_seat_id,
        client,
      );
    }

    
      const payment = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          booking_id: booking_id,
          user_id: user_id,
          event_seat: booking.event_seat_id,
        },
      });
      
      if(!payment){
          throw new ApiError(406,"payment is required")
      }


    const payInDB = await paymentRepo.setup_payment(
      payment.metadata?.booking_id,
      payment.amount,
      payment.currency,
      "pending",
      "stripe",
      client,
    );
    
      if(!payInDB){
          throw new ApiError(406,"payment did not save")
      }
      
      return {
        payment_intend_id: payment.id,
        payment,
        client_secret: payment.client_secret,
        status: payment.status,
      };
});
};

export default {createPaymentIntent}