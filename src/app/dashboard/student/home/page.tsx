'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { StudentRoundProgress, Unit } from '@/lib/types';
import { curriculum } from '@/lib/curriculum-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Book, Repeat, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function StudentHomePage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [progress, setProgress] = useState<StudentRoundProgress[]>([]);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authIsLoading) {
      setPageIsLoading(true);
      fetch(`/api/progress/student/${user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить прогресс');
          return res.json();
        })
        .then((data: StudentRoundProgress[]) => {
          setProgress(data);
        })
        .catch(err => {
          console.error(err);
          setError((err as Error).message);
        })
        .finally(() => setPageIsLoading(false));
    }
  }, [user, authIsLoading]);

  if (authIsLoading || pageIsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  const findNextUnit = (): Unit | null => {
    for (const unit of curriculum) {
      const unitProgress = progress.filter(p => p.unitId === unit.id);
      const completedRounds = unitProgress.filter(p => p.completed).length;
      if (unit.rounds.length > 0 && completedRounds < unit.rounds.length) {
        return unit;
      }
    }
    const lastCompletedUnitId = progress.length > 0 ? progress[progress.length-1].unitId : null;
    return curriculum.find(u => u.id === lastCompletedUnitId) ?? curriculum[0] ?? null;
  };

  const nextUnit = findNextUnit();
  const unitProgress = nextUnit ? progress.filter(p => p.unitId === nextUnit.id) : [];
  const completedRoundsInUnit = unitProgress.filter(p => p.completed).length;
  const totalRoundsInUnit = nextUnit ? nextUnit.rounds.length : 0;
  const unitProgressPercentage = totalRoundsInUnit > 0 ? (completedRoundsInUnit / totalRoundsInUnit) * 100 : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline">Welcome back, {user?.name}!</h1>

      <Link href="/dashboard/student/homework">
        <Card className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 text-primary-foreground p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl font-bold">My homework</CardTitle>
            <CardDescription className="text-blue-200">{nextUnit?.name || 'Нет доступных юнитов'}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Progress</span>
              <span className="text-sm font-bold">{Math.round(unitProgressPercentage)}%</span>
            </div>
            <Progress value={unitProgressPercentage} className="h-2 mt-2 bg-blue-400/30 [&>div]:bg-white" />
          </CardContent>
        </Card>
      </Link>

      <Card className="bg-card p-6 rounded-2xl">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold">Learned words</CardTitle>
          <CardDescription>Review words from units you have completed</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <Button asChild>
            <Link href="/dashboard/student/learned-words">
              <Repeat className="mr-2 h-4 w-4" />
              Start reviewing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
