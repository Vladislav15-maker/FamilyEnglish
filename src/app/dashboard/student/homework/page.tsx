'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoundCard from '@/components/curriculum/RoundCard';
import { curriculum } from '@/lib/curriculum-data';
import type { Unit, Round, StudentRoundProgress } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function HomeworkPage() {
  const router = useRouter();
  const { user, isLoading: authIsLoading } = useAuth();
  const [progress, setProgress] = useState<StudentRoundProgress[]>([]);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !authIsLoading) {
      setIsLoading(true);
      fetch(`/api/progress/student/${user.id}`)
        .then(res => res.json())
        .then((progressData: StudentRoundProgress[]) => {
          setProgress(progressData);
          let nextUnit: Unit | null = null;
          for (const unit of curriculum) {
            const unitProgress = progressData.filter(p => p.unitId === unit.id);
            const completedRounds = unitProgress.filter(p => p.completed).length;
            if (unit.rounds.length > 0 && completedRounds < unit.rounds.length) {
              nextUnit = unit;
              break;
            }
          }
          if (!nextUnit && curriculum.length > 0) {
            const lastCompletedUnitId = progressData.length > 0 ? progressData[progressData.length-1].unitId : null;
            nextUnit = curriculum.find(u => u.id === lastCompletedUnitId) ?? curriculum[0];
          }
          setCurrentUnit(nextUnit);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, authIsLoading]);
  
  const unitProgress = currentUnit ? progress.filter(p => p.unitId === currentUnit.id) : [];
  const roundsProgressMap: Record<string, StudentRoundProgress | undefined> = {};
  unitProgress.forEach(p => {
      roundsProgressMap[p.roundId] = p;
  });

  if (isLoading || authIsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (!currentUnit) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Отличная работа!</AlertTitle>
        <AlertDescription>Вы завершили все доступные юниты. Новые задания скоро появятся.</AlertDescription>
         <Button asChild className="mt-4">
            <Link href="/dashboard/student/home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться на главную
            </Link>
          </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/student/home">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My homework</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary flex items-center">
          <BookOpen className="mr-3 h-8 w-8 md:h-10 md:w-10" />
          {currentUnit.name}
        </h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/student/home')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
      </div>

      {currentUnit.rounds.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Раунды не найдены</AlertTitle>
          <AlertDescription>В этом юните пока нет раундов.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentUnit.rounds.map((round: Round) => (
            <RoundCard
              key={round.id}
              unitId={currentUnit.id}
              round={round}
              progress={roundsProgressMap[round.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
