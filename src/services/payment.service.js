import { ApiError } from "../utils/ApiError.js";
import Stripe from "stripe";
import { db } from "../db/index.js";
import bookingRepo from "../repositories/booking.repo.js";
import event_seatRepo from "../repositories/event_seat.repo.js";
import paymentRepo from "../repositories/payment.repo.js";
import { withTransaction } from "../utils/transaction.js";

const isBookingExpired = (booking) => { 
  return new Date(booking.expires_at) < new Date();
};
// booking  markedasexpired and seat at now avialable for everyone
const bookingMarkAsExpired = async (booking,client) => {
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
      SET seat_status= 'available'
      WHERE id=$1 and seat_status='reserved'
      `,
      [booking.event_seat_id],
    );
  } catch (error) {
    console.log({"Error from booking expored" :error});
    
    throw new ApiError(406, error);
  }
};




// if payment succes,faieled, canceled by user

const updateBookingOnPaymentStatus =async (client,isSuccess,payment,booking) => {
    const booking_id=  booking.id;
    const event_seat_id=  booking.event_seat_id;
    const  payment_intent_id =  payment.id
     
  if (isBookingExpired(booking) && booking.status === "pending") {
    if(isSuccess){
      await bookingMarkAsExpired(booking, client);
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
    SET status='success' AND created_at = NOW()
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
  const { amount, currency,booking_id } = req.body;
  console.log({booking_id});
  
  // const { booking_id } = req.params;
  const user_id = req?.user?.id || '6b69403d-0d8b-4274-b59b-c279002bc01d'

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

  const booking =await withTransaction(async (client) => {
    const booking = await bookingRepo.getBookingforUpdate(client,booking_id);
    if (isBookingExpired(booking)) {
       console.log("time expireddddd");
const expiresAt = new Date(booking.expires_at); // UTC
const now = new Date();


console.log("Booking expired?", now > expiresAt);
console.log("Current time:", now.toISOString());
console.log("Expiry time :", expiresAt.toISOString());
       
       await bookingMarkAsExpired(booking, client);
      throw new ApiError(406, "Booking has been expired");
      
    }


    if (booking.seat_status == "booked") {
      throw new ApiError(406, "Seat has been sold");
    }
    if (booking.seat_status !== "reserved") {
      throw new ApiError(406, "Seat is not available for payment");
    }
    return booking
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
        "stripe"
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

const cancelPendingBookingPayment= async (req, res) => {

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

const cancel_paymentIntent  =  await stripe.paymentIntents.cancel(payment_intent_id);

  return  withTransaction(async (client) => {
    const booking_id = pi.metadata.booking_id
    
    const booking =await bookingRepo.getBookingforUpdate(booking_id)  
    if(booking){
      throw new ApiError(406,"booking does not exits")
    }
    const event_seat_id = pi.metadata.event_seat_id
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

// 
  const webhookHandler = async (req,res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const userId ='6b69403d-0d8b-4274-b59b-c279002bc01d' 
      let event;
    if (endpointSecret) {
      // Get the signature sent by Stripe
        const signature = req.headers["stripe-signature"];
        try {
           const payload = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
        event = stripe.webhooks.constructEvent(
          payload,
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
      console.log("Webhook call");
      
      return {received: true};
  }
  }

export default { createPaymentIntent,webhookHandler,confirmPaymentIntent,cancelPendingBookingPayment };
