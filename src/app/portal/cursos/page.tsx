'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, BarChart3 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CursosPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    fetch(`${API_URL}/api/courses?status=published`, {
      headers: fetchHeaders(),
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar cursos');
        return res.json();
      })
      .then((data) => setCourses(data.success ? data.data : data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cursos</h1>
      {courses.length === 0 ? (
        <p className="text-muted-foreground">No hay cursos disponibles por ahora.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course: any) => (
            <Link key={course.id} href={`/portal/cursos/${course.id}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <div className="flex shrink-0 gap-1">
                      {course.level && (
                        <Badge variant="secondary">{course.level}</Badge>
                      )}
                      {course.category && (
                        <Badge variant="outline">{course.category}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
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
