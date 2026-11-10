'use client';

import { LoadingSkeleton } from '@/components/portal/StateViews';
import { ErrorState } from '@/components/portal/StateViews';
import { BookingsCard } from '@/components/portal/BookingsCard';
import type { Booking } from '@/components/portal/BookingsCard';

interface BookingsSectionProps {
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
}

export function BookingsSection({ bookings, bookingsLoading, bookingsError }: BookingsSectionProps) {
  if (bookingsLoading) return <LoadingSkeleton rows={1} />;
  if (bookingsError) return <ErrorState message={bookingsError} />;
  return <BookingsCard bookings={bookings} />;
}