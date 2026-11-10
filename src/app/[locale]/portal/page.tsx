'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { ProfileSection } from '@/components/portal/ProfileSection';
import { BadgesCard } from '@/components/portal/BadgesCard';
import { NewsSection } from '@/components/portal/NewsSection';
import { CoursesSection } from '@/components/portal/CoursesSection';
import { BookingsSection } from '@/components/portal/BookingsSection';

interface Profile {
  level: string;
  totalPoints: number;
  weekPoints: number;
  currentStreak: number;
  badges: { id: string; badge_type: string }[];
}

interface Booking {
  id: string;
  date: string;
  shift: string;
  status: string;
  name?: string;
  qrPayload?: string;
  qrDataUrl?: string;
}

export default function PortalPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const authRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  useEffect(() => {
    apiClient<Profile>(apiUrl('/api/gamification/profile'))
      .then((result) => {
        if (result.success) setProfile(result.data);
        else setProfileError(result.error);
      })
      .catch((e) => setProfileError(e.message))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    apiClient<Booking[]>(apiUrl('/api/activities/my-bookings'))
      .then((result) => {
        if (result.success) setBookings(result.data);
        else setBookingsError(result.error);
      })
      .catch((e) => setBookingsError(e.message))
      .finally(() => setBookingsLoading(false));
  }, []);

  useEffect(() => {
    apiClient<{ data: any[] }>(apiUrl('/api/blog/posts?page=1&pageSize=5'))
      .then((result) => {
        if (result.success) setRecentPosts(result.data.data || []);
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, []);

  useEffect(() => {
    apiClient<any[]>(apiUrl('/api/courses/my-enrollments'))
      .then((result) => {
        if (result.success) setMyCourses(result.data);
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t('titulo')} subtitle={t('subtitulo')} />

      <ProfileSection profile={profile} profileLoading={profileLoading} profileError={profileError} />

      <BadgesCard badges={profile?.badges || []} />

      <NewsSection posts={recentPosts} postsLoading={postsLoading} />

      <CoursesSection courses={myCourses} coursesLoading={coursesLoading} />

      <BookingsSection bookings={bookings} bookingsLoading={bookingsLoading} bookingsError={bookingsError} />
    </div>
  );
}