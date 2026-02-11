import seatRepo from "../repositories/seat.repo.js";
import * as jobRepo from "../repositories/seat_job.repo.js";


import { ApiError } from "../utils/ApiError.js";

export const requestSeatGeneration = async (req, res) => {
  const { venueId } = req.params;
  const { groups } = req.body;
  const userId = req.user.id;

  if (!venueId || !Array.isArray(groups) || groups.length === 0) {
    throw new ApiError(400, "Invalid input");
  }

  const totalSeats = groups.reduce((sum, g) => sum + g.count, 0);

  if (totalSeats > 200000) {
    throw new ApiError(400, "Seat limit exceeded");
  }

  const existingSeats = await seatRepo.countByVenue(venueId);
  if (existingSeats > 0) {
    throw new ApiError(409, "Seats already exist for this venue");
  }

  const job = await jobRepo.create({
    venueId,
    requestedBy: userId,
    totalSeats
  });

  return res.status(202).json({
    jobId: job.id,
    status: job.status
  });
};


export default {requestSeatGeneration}