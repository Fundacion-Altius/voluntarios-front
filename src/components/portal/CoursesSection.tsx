'use client';

import { LoadingSkeleton } from '@/components/portal/StateViews';
import { CoursesCard } from '@/components/portal/CoursesCard';

interface CoursesSectionProps {
  courses: any[];
  coursesLoading: boolean;
}

export function CoursesSection({ courses, coursesLoading }: CoursesSectionProps) {
  if (coursesLoading) return <LoadingSkeleton rows={1} />;
  if (courses.length === 0) return null;
  return <CoursesCard courses={courses} />;
}