import { ApiError } from "../utils/ApiError.js";
import Stripe from "stripe";
import { db } from "../db/index.js";
import bookingRepo from "../repositories/booking.repo.js";
import event_seatRepo from "../repositories/event_seat.repo.js";
import paymentRepo from "../repositories/payment.repo.js";

const withTransaction = async (handler) => {
  try {
    const client = await db.connect();
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

const stripe = new Stripe(process.env.STRIPE_KEY);

const createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body;
  const { booking_id } = req.params;
  const user_id = req.user.id;

  const get_booking_seat = await bookingRepo.getBookingforUpdate(booking_id);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      booking_id: booking_id,
      user_id: user_id,
      event_seat: get_booking_seat,
    },
  });
  const create_payment_intent = await paymentIntent();
  withTransaction(async (client) => {
    if (get_booking_seat.seat_status !== "reserved") {
      await event_seatRepo.updateEventSeat_Status(
        get_booking_seat.event_seat_id,
        client,
      );

      await paymentRepo.setup_payment(
        create_payment_intent.metadata?.booking_id,
        create_payment_intent.amount,
        create_payment_intent.currency,
        "pending",
        "stripe",
        client,
      );
    }
  });

  return {
    payment_intend_id: create_payment_intent.id,
    client_secret: create_payment_intent.create_payment_intent,
    status: create_payment_intent.status,
  };
};
