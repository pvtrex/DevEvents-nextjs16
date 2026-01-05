'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/actions/booking.actions';
import { usePostHog } from 'posthog-js/react';

interface BookEventProps {
    eventId: string;
}

const BookEvent = ({ eventId }: BookEventProps) => {
    const posthog = usePostHog();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error state
        setError(null);

        // Validate email before submission
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        setLoading(true);

        try {
            const result = await createBooking({
                eventId,
                email: email.trim(),
            });

            if (result.success) {
                // Capture successful booking event
                posthog.capture('booking_successful', {
                    eventId,
                    email: email.trim(),
                    bookingId: result.data?.bookingId,
                    timestamp: new Date().toISOString(),
                });

                setSubmitted(true);
                setEmail(''); // Clear email field
            } else {
                // Capture failed booking event
                posthog.capture('booking_failed', {
                    eventId,
                    email: email.trim(),
                    error: result.message,
                    errorType: 'validation_error',
                    timestamp: new Date().toISOString(),
                });

                setError(result.message || 'Failed to create booking');
            }
        } catch (err) {
            console.error('[BookEvent] Error:', err);

            // Capture unexpected error event
            posthog.capture('booking_failed', {
                eventId,
                email: email.trim(),
                error: err instanceof Error ? err.message : 'Unknown error',
                errorType: 'unexpected_error',
                timestamp: new Date().toISOString(),
            });

            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Success state
    if (submitted) {
        return (
            <div id="book-event" className="success-message">
                <p className="text-sm">✅ Thank you for signing up!</p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="button-secondary text-sm mt-2"
                >
                    Book another spot
                </button>
            </div>
        );
    }

    // Form state
    return (
        <div id="book-event">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="font-medium">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            // Clear error when user starts typing
                            if (error) setError(null);
                        }}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                        className={`input ${error ? 'border-red-500' : ''}`}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <button
                    type="submit"
                    className="button-submit"
                    disabled={loading || !email.trim()}
                >
                    {loading ? 'Booking...' : 'Book Your Spot'}
                </button>
            </form>
        </div>
    );
};

export default BookEvent;