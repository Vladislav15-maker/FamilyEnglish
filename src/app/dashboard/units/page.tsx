'use client';
import { useEffect, useState } from 'react';
import UnitCard from '@/components/curriculum/UnitCard';
import { curriculum, REMEDIATION_UNITS } from '@/lib/curriculum-data';
import type { Unit, StudentRoundProgress, OfflineTestScore, StudentUnitGrade, OnlineTestResult } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText, AlertCircle } from "lucide-react";

export default function UnitsPage() {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentRoundProgress[]>([]);
  const [offlineScores, setOfflineScores] = useState<OfflineTestScore[]>([]);
  const [onlineTestResults, setOnlineTestResults] = useState<OnlineTestResult[]>([]);
  const [unitGrades, setUnitGrades] = useState<StudentUnitGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'student') {
      setIsLoading(true);
      setError(null);
      Promise.all([
        fetch(`/api/progress/student/${user.id}`),
        fetch(`/api/offline-scores/student/${user.id}`),
        fetch(`/api/student/unit-grades`),
        fetch(`/api/student/online-tests`), // This returns all tests with latest results
      ])
      .then(async ([progressRes, offlineScoresRes, gradesRes, onlineResultsRes]) => {
          if (!progressRes.ok) throw new Error(`Не удалось загрузить прогресс ученика: ${await progressRes.text()}`);
          if (!offlineScoresRes.ok) throw new Error(`Не удалось загрузить оффлайн оценки: ${await offlineScoresRes.text()}`);
          if (!gradesRes.ok) throw new Error(`Не удалось загрузить оценки за юниты: ${await gradesRes.text()}`);
          if (!onlineResultsRes.ok) throw new Error(`Не удалось загрузить онлайн тесты: ${await onlineResultsRes.text()}`);
          
          const progressData = await progressRes.json();
          const offlineScoresData = await offlineScoresRes.json();
          const gradesData = await gradesRes.json();
          const onlineTestsWithResults = await onlineResultsRes.json();
          // Filter out only the actual results for failed tests
          const failedOnlineResults = onlineTestsWithResults
            .map((test: any) => test.lastResult)
            .filter((result: OnlineTestResult | null): result is OnlineTestResult => result !== null && result.isPassed === false);

          setStudentProgress(progressData);
          setOfflineScores(offlineScoresData);
          setUnitGrades(gradesData);
          setOnlineTestResults(failedOnlineResults);
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
  const failedOfflineTestIds = new Set(
    offlineScores
      .filter(score => score.passed === false && score.testId)
      .map(score => score.testId!)
  );

  const failedOnlineTestIds = new Set(
    onlineTestResults
      .filter(result => result.isPassed === false && result.onlineTestId)
      .map(result => result.onlineTestId)
  );
  
  const allFailedTestIds = new Set([...failedOfflineTestIds, ...failedOnlineTestIds]);

  const relevantRemediationUnits = Array.from(allFailedTestIds)
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
          {displayCurriculum.map((unit: Unit) => {
            const unitGrade = unitGrades.find(g => g.unitId === unit.id);
            return (
              <UnitCard
                key={unit.id}
                unit={unit}
                progress={studentProgress.filter(p => p.unitId === unit.id)}
                isRemediation={unit.id.startsWith('rem-unit-')}
                unitGrade={unitGrade}
              />
            );
          })}
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
