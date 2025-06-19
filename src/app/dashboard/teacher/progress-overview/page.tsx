'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { curriculum } from '@/lib/curriculum-data';
import type { User, StudentRoundProgress, Unit as CurriculumUnit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, AlertCircle, BookOpen, CheckCircle, Circle, MinusCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StudentOverviewItem {
  student: User;
  progress: StudentRoundProgress[];
}

interface RoundProgressDisplayInfo {
  roundName: string;
  score?: number;
  completed: boolean;
}

interface UnitOverallProgressDisplay {
  unitAverageScore?: number; // Average score of COMPLETED rounds in this unit
  unitCompleted: boolean; // True if ALL rounds in this unit are completed
  roundsDetail: RoundProgressDisplayInfo[];
  hasProgress: boolean; // True if any round in this unit was attempted or completed
}

export default function TeacherProgressOverviewPage() {
  const { user } = useAuth();
  const [studentsData, setStudentsData] = useState<User[]>([]);
  const [allProgressData, setAllProgressData] = useState<Record<string, Record<string, UnitOverallProgressDisplay>>>({}); // studentId -> unitId -> UnitOverallProgressDisplay
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
              throw new Error(errData.error || `Не удалось загрузить данные. Статус: ${res.status}`);
            });
          }
          return res.json();
        })
        .then((overviewData: StudentOverviewItem[]) => {
          setStudentsData(overviewData.map(item => item.student));
          
          const processedProgressMap: Record<string, Record<string, UnitOverallProgressDisplay>> = {};
          
          overviewData.forEach(studentOverview => {
            const studentId = studentOverview.student.id;
            processedProgressMap[studentId] = {};
            const studentProgressItems = studentOverview.progress; // All progress items for this student

            curriculum.forEach(unit => {
              let unitTotalScore = 0;
              let unitCompletedRoundsCount = 0;
              let allRoundsInUnitCompleted = unit.rounds.length > 0; // Assume true if no rounds, or check below
              let hasAnyProgressInUnit = false;

              const roundsDetail: RoundProgressDisplayInfo[] = unit.rounds.map(round => {
                const roundProgress = studentProgressItems.find(p => p.unitId === unit.id && p.roundId === round.id);
                
                if (roundProgress?.completed) {
                  unitTotalScore += roundProgress.score;
                  unitCompletedRoundsCount++;
                  hasAnyProgressInUnit = true;
                } else {
                  allRoundsInUnitCompleted = false; // If any round is not completed
                  if (roundProgress && roundProgress.attempts && roundProgress.attempts.length > 0) {
                    hasAnyProgressInUnit = true; // Mark as in progress if attempted
                  }
                }
                return {
                  roundName: round.name,
                  score: roundProgress?.score,
                  completed: roundProgress?.completed ?? false,
                };
              });
              
              if (unit.rounds.length === 0) {
                allRoundsInUnitCompleted = true; // An empty unit is "completed" in a sense, or just has no progress
                hasAnyProgressInUnit = false;
              }

              processedProgressMap[studentId][unit.id] = {
                unitAverageScore: unitCompletedRoundsCount > 0 ? Math.round(unitTotalScore / unitCompletedRoundsCount) : undefined,
                unitCompleted: allRoundsInUnitCompleted,
                roundsDetail,
                hasProgress: hasAnyProgressInUnit || unitCompletedRoundsCount > 0,
              };
            });
          });
          setAllProgressData(processedProgressMap);
        })
        .catch(err => {
          console.error("Failed to load students overview data:", err);
          setError((err as Error).message);
        })
        .finally(() => setIsLoading(false));
    } else if (!user && !isLoading) {
      setIsLoading(false);
    }
  }, [user, isLoading]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3"> <Skeleton className="h-10 w-10 rounded-full" /> <Skeleton className="h-10 w-1/3" /> </div>
        <Card> <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-2" /> {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-12 w-full mb-1" /> ))} </CardContent> </Card>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
     return ( <Alert variant="destructive"> <BookOpen className="h-4 w-4" /> <AlertTitle>Доступ запрещен</AlertTitle> <AlertDescription> Эта страница доступна только для учителей. </AlertDescription> </Alert> );
  }

  if (error) {
    return ( <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Ошибка Загрузки</AlertTitle> <AlertDescription>{error}</AlertDescription> </Alert> );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3"> <BarChart3 className="h-10 w-10 text-primary" /> <h1 className="text-4xl font-bold font-headline">Общий Прогресс Учеников</h1> </div>
      {studentsData.length === 0 ? ( <Alert> <AlertCircle className="h-4 w-4" /> <AlertTitle>Нет учеников</AlertTitle> <AlertDescription> В системе пока нет зарегистрированных учеников. </AlertDescription> </Alert>
      ) : curriculum.length === 0 ? ( <Alert> <AlertCircle className="h-4 w-4" /> <AlertTitle>Нет учебных материалов</AlertTitle> <AlertDescription> В системе пока нет юнитов для отображения прогресса. </AlertDescription> </Alert>
      ) : (
        <Card className="shadow-lg">
          <CardHeader> <CardTitle>Сводная таблица успеваемости</CardTitle> <CardDescription>Прогресс учеников по всем юнитам. Наведите на ячейку для деталей. Горизонтальная прокрутка доступна.</CardDescription> </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={100}>
              <ScrollArea className="w-full whitespace-nowrap">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 w-[200px] min-w-[200px] border-r">Ученик</TableHead>
                    {curriculum.map(unit => ( <TableHead key={unit.id} className="text-center min-w-[180px] px-2">{unit.name}</TableHead> ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium sticky left-0 bg-card z-10 border-r">{student.name}</TableCell>
                      {curriculum.map(unit => {
                        const progress = allProgressData[student.id]?.[unit.id];
                        let cellContent: React.ReactNode = <Circle className="h-4 w-4 text-muted-foreground mx-auto" />;
                        let tooltipTitle = `${student.name} - ${unit.name}: `;
                        let tooltipRoundDetailsNodes: React.ReactNode[] = [];

                        if (progress) {
                          if (progress.unitCompleted) {
                            cellContent = <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />;
                            tooltipTitle += `Завершен. Средний балл ${progress.unitAverageScore ?? 'N/A'}%.`;
                          } else if (progress.unitAverageScore !== undefined) {
                            const scoreColor = progress.unitAverageScore >= 80 ? 'text-green-600' : progress.unitAverageScore >= 50 ? 'text-yellow-600' : 'text-red-600';
                            cellContent = <span className={`font-bold ${scoreColor}`}>{progress.unitAverageScore}%</span>;
                            tooltipTitle += `В процессе. Средний балл по завершенным раундам ${progress.unitAverageScore}%.`;
                          } else if (progress.hasProgress) {
                             cellContent = <Circle className="h-4 w-4 text-yellow-500 mx-auto" />; // In progress but no completed rounds yet
                             tooltipTitle += `В процессе (нет завершенных раундов).`;
                          }
                           else if (unit.rounds.length === 0) {
                            cellContent = <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />;
                            tooltipTitle = `${unit.name}: Нет раундов.`;
                          } else {
                            cellContent = <Circle className="h-4 w-4 text-muted-foreground mx-auto" />;
                            tooltipTitle += `Не начат.`;
                          }

                          if (unit.rounds.length > 0 && progress.roundsDetail && progress.roundsDetail.length > 0) {
                            tooltipRoundDetailsNodes = progress.roundsDetail.map(rd => {
                              const roundStatusText = rd.completed 
                                ? `${rd.score}% (завершен)` 
                                : (typeof rd.score === 'number' ? `${rd.score}% (в процессе)` : 'не начат');
                              const Icon = rd.completed ? CheckCircle : (typeof rd.score === 'number' ? Circle : XCircle);
                              const iconColor = rd.completed ? 'text-green-500' : (typeof rd.score === 'number' ? 'text-yellow-600' : 'text-red-500');
                              return ( <li key={rd.roundName} className="flex items-center"> <Icon className={`h-3 w-3 mr-1.5 shrink-0 ${iconColor}`} /> {rd.roundName}: {roundStatusText} </li> );
                            });
                          } else if (unit.rounds.length > 0) {
                             tooltipRoundDetailsNodes.push(<li key="no-round-data" className="text-xs italic">Нет данных по раундам.</li>);
                          }
                        } else {
                            if (unit.rounds.length === 0) {
                                 cellContent = <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />;
                                 tooltipTitle = `${unit.name}: Нет раундов.`;
                            } else {
                                 tooltipTitle += `Нет данных.`;
                            }
                        }

                        return (
                          <TableCell key={unit.id} className="text-center min-w-[180px] px-2">
                            <Tooltip> <TooltipTrigger asChild> <div className="cursor-default p-2 min-h-[36px] flex items-center justify-center">{cellContent}</div> </TooltipTrigger> <TooltipContent className="max-w-xs text-sm"> <p className="font-semibold mb-1">{tooltipTitle}</p> {tooltipRoundDetailsNodes.length > 0 && ( <ul className="list-none pl-1 mt-1 space-y-0.5"> {tooltipRoundDetailsNodes} </ul> )} </TooltipContent> </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

