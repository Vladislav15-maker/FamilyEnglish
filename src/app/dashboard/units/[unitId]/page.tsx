'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RoundCard from '@/components/curriculum/RoundCard';
import { getUnitById } from '@/lib/curriculum-data';
import type { Unit, Round, StudentRoundProgress } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
// DO NOT import getStudentRoundProgress or any store functions directly for client-side use
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function UnitPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === 'string' ? params.unitId : '';
  const { user } = useAuth();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [roundsProgress, setRoundsProgress] = useState<Record<string, StudentRoundProgress | undefined>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unitId && user && user.role === 'student') {
      setIsLoading(true);
      setError(null);
      const currentUnitData = getUnitById(unitId);
      setUnit(currentUnitData);

      if (currentUnitData) {
        // Fetch all progress for the student via API
        fetch(`/api/progress/student/${user.id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch student progress. Status: ${res.status}`);
            }
            return res.json();
          })
          .then((allStudentProgress: StudentRoundProgress[]) => {
            const unitSpecificProgress = allStudentProgress.filter(p => p.unitId === unitId);
            const progressMap: Record<string, StudentRoundProgress | undefined> = {};
            currentUnitData.rounds.forEach(round => {
              progressMap[round.id] = unitSpecificProgress.find(p => p.roundId === round.id);
            });
            setRoundsProgress(progressMap);
          })
          .catch(err => {
            console.error("Failed to load student progress for unit:", err);
            setError("Не удалось загрузить прогресс для этого юнита.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false); // Unit data not found
      }
    } else if (!user || user.role !== 'student') {
        setIsLoading(false); // Not a student or no user
    }
  }, [unitId, user]); // user dependency ensures re-fetch if user logs in/out

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-6 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <RoundCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки прогресса</AlertTitle>
          <AlertDescription>
            {error} <Link href="/dashboard/units" className="underline">Вернуться к списку юнитов.</Link>
          </AlertDescription>
        </Alert>
    );
  }

  if (!unit) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Юнит не найден</AlertTitle>
          <AlertDescription>
            Запрашиваемый юнит не существует. <Link href="/dashboard/units" className="underline">Вернуться к списку юнитов.</Link>
          </AlertDescription>
        </Alert>
    );
  }
  
  if (!user || user.role !== 'student') {
     return (
        <Alert variant="destructive">
          <BookOpen className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учеников.
          </AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/units">Юниты</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{unit.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary flex items-center">
          <BookOpen className="mr-3 h-8 w-8 md:h-10 md:w-10" />
          {unit.name}
        </h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/units')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к юнитам
        </Button>
      </div>

      {unit.rounds.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Раунды не найдены</AlertTitle>
          <AlertDescription>В этом юните пока нет раундов.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unit.rounds.map((round: Round) => (
            <RoundCard
              key={round.id}
              unitId={unit.id}
              round={round}
              progress={roundsProgress[round.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function RoundCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg shadow space-y-4 bg-card">
       <div className="flex items-center space-x-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-3/4" />
      </div>
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2 pt-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
