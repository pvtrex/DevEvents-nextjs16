'use server';

import connectDB from '@/lib/mongodb';
import Booking, { IBooking } from '@/database/booking.model';
import { Types } from 'mongoose';

// Response type for the booking action
interface BookingResponse {
    success: boolean;
    message: string;
    data?: {
        bookingId: string;
        eventId: string;
        email: string;
    };
    error?: string;
}

/**
 * Creates a new booking for an event
 * @param eventId - MongoDB ObjectId of the event
 * @param email - User's email address
 * @returns BookingResponse with success status and booking data
 */
export const createBooking = async ({
                                        eventId,
                                        email,
                                    }: {
    eventId: string;
    email: string;
}): Promise<BookingResponse> => {
    try {
        // Validate inputs
        if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
            return {
                success: false,
                message: 'Event ID is required',
            };
        }

        if (!email || typeof email !== 'string' || email.trim() === '') {
            return {
                success: false,
                message: 'Email is required',
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: 'Invalid email format',
            };
        }

        // Validate ObjectId format
        if (!Types.ObjectId.isValid(eventId)) {
            return {
                success: false,
                message: 'Invalid event ID format',
            };
        }

        // Connect to database
        await connectDB();

        // Check if booking already exists (duplicate prevention)
        const existingBooking = await Booking.findOne({
            eventId: new Types.ObjectId(eventId),
            email: email.toLowerCase().trim(),
        });

        if (existingBooking) {
            return {
                success: false,
                message: 'You have already booked this event',
            };
        }

        // Create the booking
        const booking = await Booking.create({
            eventId: new Types.ObjectId(eventId),
            email: email.toLowerCase().trim(),
        });

        // Return success response with booking data
        return {
            success: true,
            message: 'Booking created successfully',
            data: {
                bookingId: booking._id.toString(),
                eventId: booking.eventId.toString(),
                email: booking.email,
            },
        };
    } catch (error) {
        console.error('[createBooking] Error:', error);

        // Handle specific Mongoose validation errors
        if (error instanceof Error) {
            // Handle duplicate key error (compound index violation)
            if (error.message.includes('duplicate key')) {
                return {
                    success: false,
                    message: 'You have already booked this event',
                };
            }

            // Handle event not found error (from pre-save hook)
            if (error.message.includes('does not exist')) {
                return {
                    success: false,
                    message: 'Event not found',
                };
            }

            // Handle validation errors
            if (error.message.includes('validation failed')) {
                return {
                    success: false,
                    message: 'Invalid booking data',
                    error: error.message,
                };
            }
        }

        // Generic error response
        return {
            success: false,
            message: 'Failed to create booking. Please try again.',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};