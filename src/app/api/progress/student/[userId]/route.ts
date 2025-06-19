'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
// DO NOT import store functions directly for client-side use
import type { User, StudentRoundProgress } from '@/lib/types';
import StudentProgressRow from '@/components/teacher/StudentProgressRow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertCircle, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StudentOverview {
  student: User;
  progress: StudentRoundProgress[];
}

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const [studentsOverview, setStudentsOverview] = useState<StudentOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      setError(null);
      fetch('/api/teacher/students-overview')
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.error || `Failed to fetch students overview. Status: ${res.status}`);
            });
          }
          return res.json();
        })
        .then((data: StudentOverview[]) => {
          setStudentsOverview(data);
        })
        .catch(err => {
          console.error("Failed to load students overview from API:", err);
          setError("Не удалось загрузить данные учеников. " + (err as Error).message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (user && user.role !== 'teacher') {
      setIsLoading(false);
      // Error state for non-teachers handled by top-level guard
    } else {
      setIsLoading(false); // No user yet
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border-b">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user || user.role !== 'teacher') {
     return (
        <Alert variant="destructive">
          <BookOpen className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учителей.
          </AlertDescription>
        </Alert>
      );
  }

  if (error) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Users className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Список Учеников</h1>
      </div>

      {studentsOverview.length === 0 ? (
         <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Нет учеников</AlertTitle>
            <AlertDescription>
             В системе пока нет зарегистрированных учеников.
            </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Прогресс учеников</CardTitle>
            <CardDescription>Обзор успеваемости всех учеников.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {studentsOverview.map(overview => (
              <StudentProgressRow 
                key={overview.student.id} 
                student={overview.student} 
                progress={overview.progress || []} 
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
