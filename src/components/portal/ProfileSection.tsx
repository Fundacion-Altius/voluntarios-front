'use client';

import { LoadingSkeleton } from '@/components/portal/StateViews';
import { ErrorState } from '@/components/portal/StateViews';
import { ProfileCard } from '@/components/portal/ProfileCard';
import type { Profile } from '@/components/portal/ProfileCard';

interface ProfileSectionProps {
  profile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;
}

export function ProfileSection({ profile, profileLoading, profileError }: ProfileSectionProps) {
  if (profileLoading) return <LoadingSkeleton rows={1} />;
  if (profileError) return <ErrorState message={profileError} />;
  if (!profile) return null;
  return <ProfileCard profile={profile} />;
}