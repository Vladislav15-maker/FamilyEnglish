'use client';
import { useEffect, useState } from 'react';
import UnitCard from '@/components/curriculum/UnitCard';
import { curriculum, REMEDIATION_UNITS } from '@/lib/curriculum-data';
import type { Unit, StudentRoundProgress, OfflineTestScore } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
// DO NOT import getAllStudentProgress directly from '@/lib/store' here
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText, AlertCircle, GraduationCap } from "lucide-react";

export default function UnitsPage() {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentRoundProgress[]>([]);
  const [offlineScores, setOfflineScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'student') {
      setIsLoading(true);
      setError(null);
      Promise.all([
        fetch(`/api/progress/student/${user.id}`), // Fetch online progress
        fetch(`/api/offline-scores/student/${user.id}`) // Fetch offline scores
      ])
      .then(async ([progressRes, scoresRes]) => {
          if (!progressRes.ok) {
             const errData = await progressRes.json().catch(() => ({}));
             throw new Error(`Не удалось загрузить прогресс ученика: ${errData.error || progressRes.status}`);
          }
          if (!scoresRes.ok) {
             const errData = await scoresRes.json().catch(() => ({}));
             throw new Error(`Не удалось загрузить оффлайн оценки: ${errData.error || scoresRes.status}`);
          }
          const progressData = await progressRes.json();
          const scoresData = await scoresRes.json();
          setStudentProgress(progressData);
          setOfflineScores(scoresData);
      })
      .catch(err => {
          console.error("Failed to load student data for units page:", err);
          setError((err as Error).message);
      })
      .finally(() => {
          setIsLoading(false);
      });
    } else {
      setIsLoading(false); 
    }
  }, [user]);

  // Determine which remediation units to show
  const failedTestIds = new Set(
    offlineScores
      .filter(score => score.passed === false && score.testId)
      .map(score => score.testId!)
  );

  const relevantRemediationUnits = Array.from(failedTestIds)
    .map(testId => REMEDIATION_UNITS[testId])
    .filter(Boolean); // Filter out any undefined units

  const displayCurriculum = [...relevantRemediationUnits, ...curriculum];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка Загрузки</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!user || user.role !== 'student') {
     return (
        <Alert variant="destructive">
          <BookOpenText className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учеников.
          </AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline text-primary">Учебные юниты</h1>
      {displayCurriculum.length === 0 ? (
         <Alert>
            <BookOpenText className="h-4 w-4" />
            <AlertTitle>Юниты не найдены</AlertTitle>
            <AlertDescription>
                В данный момент нет доступных юнитов для изучения.
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayCurriculum.map((unit: Unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              progress={studentProgress.filter(p => p.unitId === unit.id)}
              isRemediation={unit.id.startsWith('rem-unit-')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg shadow space-y-4 bg-card">
      <div className="flex items-center space-x-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 pt-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  )
}
