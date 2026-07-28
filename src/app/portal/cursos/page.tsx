'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { BookOpen, Clock } from 'lucide-react';

export default function CursosPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<any>(apiUrl('/api/courses?status=published'))
      .then((data) => setCourses(data?.data ?? data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) return <div><PageHeader title="Cursos" subtitle="Explora los cursos disponibles" /><LoadingSkeleton rows={4} /></div>;
  if (error) return <div><PageHeader title="Cursos" /><ErrorState message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Cursos" subtitle="Explora los cursos disponibles" />
      {courses.length === 0 ? (
        <EmptyState title="No hay cursos disponibles por ahora" description="Vuelve más tarde para ver nuevos cursos." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course: any) => (
            <Link key={course.id} href={`/portal/cursos/${course.id}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <div className="flex shrink-0 gap-1">
                      {course.level && <Badge variant="secondary">{course.level}</Badge>}
                      {course.category && <Badge variant="outline">{course.category}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3" />
                      {course.lesson_count ?? course.lessons ?? 0} lecciones
                    </span>
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {course.duration}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
