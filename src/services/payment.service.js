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
const bookingMarkAsExpired = async (booking, client) => {
  try {
    const query = `
              UPDATE bookings 
              SET status = 'expired'
              WHERE id = $1 
            `;
    await client.query(query, [booking.id]);
    await client.query(
      `
            UPDATE event_seats
            SET status= 'available'
            WHERE id=$1 and status='reserved'
            `,
      [booking.event_seat_id],
    );
  } catch (error) {
    throw new ApiError(406, "booking marked error");
  }
};




// if payment succes,faieled, canceled by user

const updateBookingOnPaymentStatus =async (client,isSuccess,payment,booking) => {
    const booking_id=  booking.id;
    const event_seat_id=  booking.event_seat_id;
    const  payment_intent_id =  payment.id
     
  if (isBookingExpired(booking) && booking.status === "pending") {
    if(isSuccess){
      await bookingMarkAsExpired(client, booking);
      await stripe.refunds.create({
        payment_intent : payment_intent_id
      })

      const payment_query = `
          UPDATE payments
          SET status='refunded'
          WHERE payment_intent_id=$1
          `
   
     await client.query(payment_query,[payment_intent_id])

       return;
    }

     await bookingMarkAsExpired(client, booking)
     return;
  }


    if (isSuccess) {
       const seat_query = `
      UPDATE event_seats
      SET seat_status='booked'
      WHERE id=$1 AND seat_status='reserved'
   `      
        await client.query(seat_query,[event_seat_id])  

    if (booking.booking_status !== "confirmed") {
         const booking_query = `
      UPDATE bookings
      SET status='confirmed'
      WHERE id=$1
   `   
        await client.query(booking_query,[booking_id])

    
    }

    const payment_query = `
    UPDATE payments
    SET status='success'
    WHERE payment_intent_id=$1
    `
    await client.query(payment_query,[payment_intent_id])
         
          return {
            booking_id: booking.id,
            payment_status : "Success" , 
            booking_status: "confirmed",
            seat_status: "booked",
            payment,
          };
    }else{
      // if payment failed so  seat are avilable for everyone
      const seat_query = `
      UPDATE event_seats
      SET seat_status='available'
      WHERE id=$1
   `      
   const booking_query = `
      UPDATE bookings
      SET status='cancelled'
      WHERE id=$1
   `
    const payment_query = `
      UPDATE payments
      SET status='failed'
      WHERE payment_intent_id=$1
   `
   
     await client.query(seat_query,[event_seat_id])  
     await client.query(booking_query,[booking_id])
     await client.query(payment_query,[payment_intent_id])
         
    return {
      booking_id: booking.id,
     booking_status: "cancelled",
     seat_status: "available",
      payment,
    };


    }   
};  


const fainalizePaymentIntent =async (payment,eventType,userId=null) => {
  const bookingId = paymentIntent?.metadata?.booking_id;
  if (!bookingId) {
    return { ignored: true, reason: "payment_intent_without_booking_metadata" };
  }

  const isSuccess = eventType === "payment_intent.succeeded";
  return withTransaction(async (client) => {
    const booking = await bookingRepo.getBookingforUpdate(client, bookingId, userId);

    if (!booking) {
      if (userId) {
        throw new ApiError(404, "Booking not found for user");
      }
      return { ignored: true, reason: "booking_not_found" };
    }
// client,isSuccess,payment,booking
    return updateBookingOnPaymentStatus({
      client,
      isSuccess,
      payment,
      booking
    });
  });


}; 


const stripe = new Stripe(process.env.STRIPE_KEY);

const createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body;
  const { booking_id } = req.params;
  const user_id = req.user.id;

  if (!amount && amount <= 0) {
    throw new ApiError(
      406,
      `${!isNaN(amount) ? "Amount field are required" : "Amount should be digit"}`,
    );
  }

  if (!currency || typeof currency !== "string") {
    throw new ApiError(406, "Valid currency is required");
  }
  if (!user_id) {
    throw new ApiError(406, "Authorized user  is required");
  }

  if (!booking_id) {
    throw new ApiError(406, "booking_id user is required");
  }

  withTransaction(async (client) => {
    const booking = await bookingRepo.getBookingforUpdate(booking_id);
    if (isBookingExpired(booking)) {
      await bookingMarkAsExpired(booking, client);
      throw new ApiError(406, "Booking has been expired");
    }

    if (booking.seat_status == "booked") {
      throw new ApiError(406, "Seat has been sold");
    }
    if (booking.seat_status !== "reserved") {
      throw new ApiError(406, "Seat is not available for payment");
    }
  });
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

      if (!payment) {
        throw new ApiError(406, "payment is required");
      }

      const payInDB = await paymentRepo.setup_payment(
        payment.id, 
        payment.metadata?.booking_id,
        payment.amount,
        payment.currency,
        "pending",
        "stripe",
        client,
      );

      if (!payInDB) {
        throw new ApiError(406, "payment did not save");
      }

  return {
    payment_intend_id: payment.id,
    payment,
    client_secret: payment.client_secret,
    status: payment.status,
  };
};

const confirmPaymentIntent = async (req, res) => {

  const  {payment_intent_id}  = req.params;
  const userId = req.user.id;

 
  if (!payment_intent_id) {
    throw new ApiError(400, "payment_intent_id is required");
  }

  if (!userId) {
    throw new ApiError(401,"Authorized user is required");
  }
  const payment = await stripe.paymentIntents.retrieve(payment_intent_id);
  const booking_id = payment.metadata.booking_id
  
  if (!booking_id) {
    throw new ApiError(406, "booking_id user is required");
  }

  await withTransaction(async (client) => {
    const booking = await bookingRepo.getBookingforUpdate(booking_id);
    if (isBookingExpired(booking)) {
      await bookingMarkAsExpired(booking, client);
      throw new ApiError(406, "Booking has been expired");
    }

    if (booking.seat_status == "booked") {
      throw new ApiError(406, "Seat has been sold");
    }
    if (booking.seat_status !== "reserved") {
      throw new ApiError(406, "Seat is not available for payment");
    }
  });

  return {
    payment_intent_id: payment.id,
    payment,
    client_secret: payment.client_secret,
    status: payment.status,
  };
};

const cancelPaymentIntent= async (req, res) => {

  const  {payment_intent_id}  = req.params;
   const userId = req.user.id;
  if (!payment_intent_id) {
    throw new ApiError(406,"payment_intent_id not defined")
  }
  
    if (!userId) {
    throw new ApiError(406,"userId not defined")
  }
  const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

if (pi.status === "succeeded") {
   throw new ApiError(400, "Cannot cancel succeeded payment");
} 

  return  withTransaction(async (client) => {
  
    const cancel_paymentIntent  =  await stripe.paymentIntents.cancel(payment_intent_id);
    const booking_id = cancel_paymentIntent.metadata.booking_id
    const booking =await bookingRepo.getBookingforUpdate(booking_id)
    const event_seat_id = cancel_paymentIntent.metadata.event_seat_id
    const seat_query = `
      UPDATE event_seats
      SET seat_status='available'
      WHERE id=$1 AND seat_status='reserved'
   `      
   const booking_query = `
      UPDATE bookings
      SET status='cancelled'
      WHERE id=$1 AND status != 'confirmed'
   `
    const payment_query = `
      UPDATE payments
      SET status='failed'
      WHERE payment_intent_id=$1
   `
   
     await client.query(seat_query,[event_seat_id])  
     
      await client.query(booking_query,[booking_id])
     
     
     await client.query(payment_query,[payment_intent_id])
    
    
    
     return {
      booking_id,
     booking_status: "cancelled",
     seat_status: "available",
      cancel_paymentIntent,
    };
    
  })

};


  const webhookHandler = async (req,res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const userId = req.user.id
      let event;
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );

      } catch (err) {
        throw new ApiError(404,err.message)
      }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Then define and call a method to handle the successful payment intent.
        console.log("payment successfull",paymentIntent)
        fainalizePaymentIntent(payment,event.type,userId);
        break;
      case 'payment_intent.payment_failed':
        const payment= event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        fainalizePaymentIntent(payment,event.type,userId);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({received: true});
  }
  }

export default { createPaymentIntent,webhookHandler,confirmPaymentIntent,cancelPaymentIntent };
