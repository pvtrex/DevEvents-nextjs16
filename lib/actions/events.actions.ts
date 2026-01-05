'use server';

import Event, { IEvent } from '@/database/event.model';
import connectDB from '@/lib/mongodb';

/**
 * Fetches similar events based on shared tags with the given event slug
 * @param slug - The slug of the event to find similar events for
 * @param limit - Maximum number of similar events to return (default: 5)
 * @returns Array of similar events or empty array if none found
 */
export const getSimilarEventsBySlug = async (
    slug: string,
    limit: number = 5
): Promise<IEvent[]> => {
    try {
        // Validate input
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
            console.error('[getSimilarEventsBySlug] Invalid slug provided');
            return [];
        }

        // Connect to database
        await connectDB();

        // Find the source event
        const event = await Event.findOne({ slug }).lean();

        // If event doesn't exist, return empty array
        if (!event) {
            console.warn(`[getSimilarEventsBySlug] Event with slug '${slug}' not found`);
            return [];
        }

        // If event has no tags, return empty array
        if (!event.tags || event.tags.length === 0) {
            console.warn(`[getSimilarEventsBySlug] Event '${slug}' has no tags`);
            return [];
        }

        // Find similar events based on shared tags
        const similarEvents = await Event.find({
            _id: { $ne: event._id }, // Exclude the current event
            tags: { $in: event.tags }, // Match any of the event's tags
        })
            .limit(limit)
            .sort({ createdAt: -1 }) // Most recent first
            .lean<IEvent[]>();

        return similarEvents;
    } catch (error) {
        // Log error for debugging (use proper logging service in production)
        console.error('[getSimilarEventsBySlug] Error:', error);

        // Return empty array on error to prevent UI breakage
        return [];
    }
};