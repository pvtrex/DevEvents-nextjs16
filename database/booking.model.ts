import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import Event from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema definition
const bookingSchema = new Schema<IBooking>(
    {
      eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event ID is required'],
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        validate: {
          validator: (v: string) => {
            // Standard email regex validation
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Please provide a valid email address',
        },
      },
    },
    {
      timestamps: true,
    }
);

// Pre-save hook to validate that the referenced event exists
bookingSchema.pre('save', async function () {
  // Only validate eventId if it's new or modified
  if (this.isNew || this.isModified('eventId')) {
    const eventExists = await Event.findById(this.eventId);

    if (!eventExists) {
      throw new Error(`Event with ID ${this.eventId} does not exist`);
    }
  }
});

// Create index on eventId for faster lookup queries
bookingSchema.index({ eventId: 1 });

// Compound index for unique booking per email per event (optional but recommended)
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Export model (prevent OverwriteModelError in Next.js hot reload)
const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;