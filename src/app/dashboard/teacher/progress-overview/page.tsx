'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { curriculum } from '@/lib/curriculum-data';
import type { User, StudentRoundProgress, StudentAttemptHistory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, AlertCircle, BookOpen, CheckCircle, Circle, MinusCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RoundProgressDisplayInfo {
  roundName: string;
  score?: number;
  completed: boolean;
  attempts?: StudentAttemptHistory[];
}

interface UnitOverallProgressDisplay {
  unitAverageScore?: number;
  unitCompleted: boolean;
  roundsDetail: RoundProgressDisplayInfo[];
}

export default function TeacherProgressOverviewPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [allProgressData, setAllProgressData] = useState<Record<string, Record<string, UnitOverallProgressDisplay>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      setError(null);
      Promise.all([
        fetch('/api/teacher/students'),
        fetch('/api/progress/student/'), // Fetch all progress for all students
      ]).then(async ([studentsRes, rawProgressRes]) => {
        if (!studentsRes.ok) throw new Error('Не удалось загрузить учеников');
        if (!rawProgressRes.ok) throw new Error('Не удалось загрузить прогресс');
        
        const studentsData: User[] = await studentsRes.json();
        const rawProgressData: StudentRoundProgress[] = await rawProgressRes.json();

        setStudents(studentsData);
        
        const progressMap: Record<string, Record<string, UnitOverallProgressDisplay>> = {};
        
        studentsData.forEach(student => {
          progressMap[student.id] = {};
          const studentAllProgressItems = rawProgressData.filter(p => p.studentId === student.id);
          
          curriculum.forEach(unit => {
            const roundsDetail: RoundProgressDisplayInfo[] = unit.rounds.map(round => {
              const roundProgress = studentAllProgressItems.find(p => p.unitId === unit.id && p.roundId === round.id);
              return {
                roundName: round.name,
                score: roundProgress?.score,
                completed: roundProgress?.completed ?? false,
                attempts: roundProgress?.attempts,
              };
            });

            let unitAverageScore: number | undefined = undefined;
            let unitCompleted = false;

            if (unit.rounds.length > 0) {
              const completedRoundsInUnit = roundsDetail.filter(r => r.completed);
              if (completedRoundsInUnit.length > 0) {
                 const sumOfScores = completedRoundsInUnit.reduce((sum, r) => sum + (r.score ?? 0), 0);
                 unitAverageScore = Math.round(sumOfScores / completedRoundsInUnit.length);
              }
              unitCompleted = completedRoundsInUnit.length === unit.rounds.length;
            }
            
            progressMap[student.id][unit.id] = {
              unitAverageScore,
              unitCompleted,
              roundsDetail,
            };
          });
        });
        setAllProgressData(progressMap);
      }).catch(err => {
        console.error("Failed to load progress overview data:", err);
        setError((err as Error).message);
      }).finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3"><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-1/3" /></div>
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-full mb-2" /><Skeleton className="h-12 w-full mb-1" /><Skeleton className="h-12 w-full mb-1" /></CardContent></Card>
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

      {students.length === 0 ? (
        <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет учеников</AlertTitle><AlertDescription>В системе пока нет зарегистрированных учеников для отображения прогресса.</AlertDescription></Alert>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Сводная таблица успеваемости</CardTitle>
            <CardDescription>Прогресс учеников по всем юнитам. Наведите на ячейку для просмотра деталей по раундам.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 w-[200px] min-w-[200px] border-r font-semibold">Ученик</TableHead>
                    {curriculum.map(unit => (
                      <TableHead key={unit.id} className="text-center min-w-[150px] px-2">{unit.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium sticky left-0 bg-card z-10 border-r">{student.name}</TableCell>
                      {curriculum.map(unit => {
                        const progress = allProgressData[student.id]?.[unit.id];
                        let cellContent;
                        let tooltipTitle = `${student.name} - ${unit.name}`;
                        let tooltipRoundDetails: React.ReactNode[] = [];

                        if (progress) {
                            if (progress.unitCompleted) {
                                cellContent = <div className="flex items-center justify-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>{progress.unitAverageScore}%</span></div>;
                                tooltipTitle += `: Завершен`;
                            } else if (progress.unitAverageScore !== undefined) {
                                cellContent = <div className="flex items-center justify-center gap-2"><Circle className="h-5 w-5 text-yellow-500" /><span>{progress.unitAverageScore}%</span></div>;
                                tooltipTitle += `: В процессе`;
                            } else if (unit.rounds.length === 0) {
                                cellContent = <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />;
                                tooltipTitle = `${unit.name}: Нет раундов`;
                            } else {
                                cellContent = <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />;
                                tooltipTitle += `: Не начат`;
                            }

                            if (unit.rounds.length > 0 && progress.roundsDetail?.length > 0) {
                                tooltipRoundDetails = progress.roundsDetail.map(rd => {
                                    const statusText = rd.completed ? `${rd.score}%` : 'Не пройден';
                                    return <li key={rd.roundName} className="text-xs">{rd.roundName}: {statusText}</li>;
                                });
                            }
                        } else {
                            cellContent = <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />;
                            tooltipTitle += `: Нет данных`;
                        }
                        
                        return (
                          <TableCell key={unit.id} className="text-center min-w-[150px] px-2">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild><div className="cursor-pointer p-2 min-h-[40px] flex items-center justify-center">{cellContent}</div></TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-bold mb-1">{tooltipTitle}</p>
                                  {tooltipRoundDetails.length > 0 && <ul className="list-disc pl-4 mt-1 space-y-1">{tooltipRoundDetails}</ul>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
