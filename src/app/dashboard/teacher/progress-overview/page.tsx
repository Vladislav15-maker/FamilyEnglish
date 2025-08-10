'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { curriculum } from '@/lib/curriculum-data';
import type { User, StudentRoundProgress } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, BarChart3, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface StudentOverviewItem {
  student: User;
  progress: StudentRoundProgress[];
  overallProgressPercentage: number;
  averageOnlineScore: number;
  completedCoreRounds: number;
}

export default function TeacherProgressOverviewPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<StudentOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalRoundsInCurriculum = curriculum.reduce((acc, unit) => acc + unit.rounds.length, 0);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      setError(null);
      fetch('/api/teacher/students-overview')
        .then(res => {
          if (!res.ok) {
            throw new Error('Не удалось загрузить обзор успеваемости учеников');
          }
          return res.json();
        })
        .then((overviewData: { student: User; progress: StudentRoundProgress[] }[]) => {
          const processedOverview = overviewData.map(item => {
            const coreProgress = item.progress.filter(p => !p.unitId.startsWith('rem-unit-'));
            const completedCoreProgress = coreProgress.filter(p => p.completed);
            
            const completedCoreRounds = completedCoreProgress.length;
            const overallProgressPercentage = totalRoundsInCurriculum > 0 
              ? Math.round((completedCoreRounds / totalRoundsInCurriculum) * 100)
              : 0;

            const sumScores = completedCoreProgress.reduce((acc, p) => acc + p.score, 0);
            const averageOnlineScore = completedCoreRounds > 0 ? Math.round(sumScores / completedCoreRounds) : 0;
            
            return { ...item, overallProgressPercentage, averageOnlineScore, completedCoreRounds };
          }).sort((a, b) => b.overallProgressPercentage - a.overallProgressPercentage || b.averageOnlineScore - a.averageOnlineScore);
          setOverview(processedOverview);
        })
        .catch(err => {
          console.error("Failed to load class overview:", err);
          setError((err as Error).message);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user, totalRoundsInCurriculum]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-1/3" /></div>
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка Загрузки</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>);
  }

  if (!user || user.role !== 'teacher') {
    return (<Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только для учителей.</AlertDescription></Alert>);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Обзор Успеваемости Класса</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6"/>Рейтинг успеваемости</CardTitle>
          <CardDescription>Обзор онлайн-прогресса всех учеников, отсортированный по общему прогрессу.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {overview.length === 0 ? (
            <Alert className="m-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Нет учеников</AlertTitle><AlertDescription>В системе пока нет учеников для отображения прогресса.</AlertDescription></Alert>
          ) : (
            <div className="divide-y divide-border">
              {overview.map((item) => (
                <div key={item.student.id} className="flex items-center space-x-4 p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-12 w-12"><AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(item.student.name)}`} alt={item.student.name} data-ai-hint="profile person" /><AvatarFallback>{getInitials(item.student.name)}</AvatarFallback></Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-lg font-semibold text-primary truncate">{item.student.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">Общий прогресс:</span>
                      <Progress value={item.overallProgressPercentage} className="w-24 sm:w-32 md:w-40 h-2" />
                      <span>{item.overallProgressPercentage}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">Средний балл: {item.averageOnlineScore > 0 ? `${item.averageOnlineScore}%` : 'N/A'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">Пройдено раундов</p>
                    <p className="text-lg font-semibold">{item.completedCoreRounds} / {totalRoundsInCurriculum}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
