'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { curriculum, OFFLINE_TESTS, REMEDIATION_UNITS } from '@/lib/curriculum-data';
import type { User, StudentRoundProgress, Unit, Round, OfflineTestScore, StudentAttemptHistory } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, UserCircle, BookOpen, AlertCircle, CheckCircle, XCircle, Award, TrendingUp, ListChecks, ClipboardCheck, Sigma, Repeat, History, Loader2, Check, X, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


export default function TeacherStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = typeof params.studentId === 'string' ? params.studentId : '';
  const { user: teacherUser } = useAuth();

  const [student, setStudent] = useState<User | null>(null);
  const [progress, setProgress] = useState<StudentRoundProgress[]>([]);
  const [offlineScores, setOfflineScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for attempt history dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyForRound, setHistoryForRound] = useState<StudentAttemptHistory[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<StudentAttemptHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentRoundForHistory, setCurrentRoundForHistory] = useState<{unitId: string, roundId: string, roundName: string} | null>(null);

  useEffect(() => {
    if (teacherUser && teacherUser.role === 'teacher' && studentId) {
      setIsLoading(true);
      setError(null);

      const fetchStudentData = async () => {
        try {
          const [studentRes, progressRes, offlineScoresRes] = await Promise.all([
            fetch(`/api/teacher/students/${studentId}`),
            fetch(`/api/progress/student/${studentId}`),
            fetch(`/api/offline-scores/student/${studentId}`)
          ]);

          if (!studentRes.ok) throw new Error(`Не удалось загрузить данные ученика. Статус: ${studentRes.status}`);
          const studentData: User = await studentRes.json();
          setStudent(studentData);

          if (!progressRes.ok) throw new Error(`Не удалось загрузить онлайн прогресс ученика. Статус: ${progressRes.status}`);
          const progressData: StudentRoundProgress[] = await progressRes.json();
          setProgress(progressData);

          if (!offlineScoresRes.ok) throw new Error(`Не удалось загрузить оффлайн оценки ученика. Статус: ${offlineScoresRes.status}`);
          let offlineScoresData: OfflineTestScore[] = await offlineScoresRes.json();
          offlineScoresData = offlineScoresData.map(score => ({
            ...score,
            testName: OFFLINE_TESTS.find(t => t.id === score.testId)?.name || score.testId || 'Неизвестный тест'
          }));
          setOfflineScores(offlineScoresData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          
        } catch (err) {
          console.error("Failed to load student details:", err);
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStudentData();

    } else if (!teacherUser || teacherUser.role !== 'teacher') {
      setIsLoading(false);
      setError("Доступ запрещен.");
    } else {
      setIsLoading(false); // No studentId or not a teacher
    }
  }, [teacherUser, studentId]);


  const handleOpenHistoryDialog = async (unitId: string, roundId: string, roundName: string) => {
    setCurrentRoundForHistory({unitId, roundId, roundName});
    setIsHistoryDialogOpen(true);
    setIsLoadingHistory(true);
    setHistoryForRound([]);
    setSelectedAttempt(null);
    try {
      const res = await fetch(`/api/progress/student/${studentId}/round/${roundId}/attempts?unitId=${unitId}`);
      if(!res.ok) {
        throw new Error("Не удалось загрузить историю попыток");
      }
      const data: StudentAttemptHistory[] = await res.json();
      setHistoryForRound(data.sort((a, b) => a.attemptNumber - b.attemptNumber));
      if(data.length > 0) {
        // Select the last attempt by default
        setSelectedAttempt(data[data.length - 1]);
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка при загрузке истории попыток.");
    } finally {
        setIsLoadingHistory(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2 mb-2" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
     return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка Загрузки</AlertTitle>
          <AlertDescription>
            {error} <Link href="/dashboard/teacher/students" className="underline">Вернуться к списку учеников.</Link>
          </AlertDescription>
        </Alert>
      );
  }
  
  if (!teacherUser || teacherUser.role !== 'teacher') {
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

  if (!student) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ученик не найден</AlertTitle>
          <AlertDescription>
            Информация об этом ученике не найдена. <Link href="/dashboard/teacher/students" className="underline">Вернуться к списку учеников.</Link>
          </AlertDescription>
        </Alert>
    );
  }

  // Calculate statistics for the summary card, excluding remediation units
  const coreProgress = progress.filter(p => !p.unitId.startsWith('rem-unit-'));
  const totalOnlineRoundsCompleted = coreProgress.filter(p => p.completed).length;
  const sumOnlineScores = coreProgress
    .filter(p => p.completed)
    .reduce((acc, p) => acc + p.score, 0);
  const averageOnlineRoundScore = totalOnlineRoundsCompleted > 0 
    ? Math.round(sumOnlineScores / totalOnlineRoundsCompleted) 
    : 0;

  const totalOfflineTestsTaken = offlineScores.length;
  const sumOfflineScoresValue = offlineScores.reduce((acc, s) => acc + s.score, 0);
  const averageOfflineTestScore = totalOfflineTestsTaken > 0 
    ? parseFloat((sumOfflineScoresValue / totalOfflineTestsTaken).toFixed(1))
    : 0;

  // Determine which remediation units are relevant
  const failedTestIds = new Set(
    offlineScores
      .filter(score => score.passed === false && score.testId)
      .map(score => score.testId!)
  );

  const relevantRemediationUnits = Array.from(failedTestIds)
    .map(testId => REMEDIATION_UNITS[testId])
    .filter((unit): unit is Unit => !!unit);


  return (
    <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
      <div className="space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/teacher/students">Ученики</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{student.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <UserCircle className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold font-headline">{student.name}</h1>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/teacher/students')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку учеников
          </Button>
        </div>

        {/* Student Summary Statistics Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Sigma className="mr-2 h-6 w-6 text-primary" />
              Сводка по Ученику
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
              <ListChecks className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{totalOnlineRoundsCompleted}</p>
              <p className="text-sm text-muted-foreground text-center">Пройдено онлайн-раундов</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
              <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{averageOnlineRoundScore}%</p>
              <p className="text-sm text-muted-foreground text-center">Средний балл (онлайн)</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
              <ClipboardCheck className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{totalOfflineTestsTaken}</p>
              <p className="text-sm text-muted-foreground text-center">Сдано оффлайн-тестов</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
              <Award className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{averageOfflineTestScore > 0 ? averageOfflineTestScore : 'N/A'}</p>
              <p className="text-sm text-muted-foreground text-center">Средний балл (оффлайн)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Успеваемость по юнитам (Онлайн)</CardTitle>
            <CardDescription>Детальный просмотр прогресса по каждому раунду. Здесь отображается последняя попытка.</CardDescription>
          </CardHeader>
          <CardContent>
            {curriculum.length === 0 ? (
               <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Нет учебных материалов</AlertTitle>
                  <AlertDescription>В системе пока нет юнитов и раундов.</AlertDescription>
              </Alert>
            ) : (
              <Accordion type="single" collapsible className="w-full">
              {curriculum.map((unit: Unit) => (
                <AccordionItem value={unit.id} key={unit.id}>
                  <AccordionTrigger className="text-xl hover:bg-muted/50 px-4 py-3 rounded-md">
                    {unit.name}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 space-y-4 bg-background">
                    {unit.rounds.length === 0 ? (<p className="text-muted-foreground text-sm">В этом юните нет раундов.</p>) : unit.rounds.map((round: Round) => {
                      const roundProgress = progress.find(p => p.unitId === unit.id && p.roundId === round.id);
                      
                      return (
                        <Card key={round.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/30 p-4">
                             <CardTitle className="text-lg flex justify-between items-center flex-wrap gap-2">
                              <span>{round.name}</span>
                              <div className="flex items-center gap-2">
                                  {roundProgress?.attemptCount > 0 && (
                                    <DialogTrigger asChild>
                                      <Button variant="secondary" size="sm" className="flex items-center gap-1" onClick={() => handleOpenHistoryDialog(unit.id, round.id, round.name)}>
                                          <History className="h-4 w-4" />
                                          Попыток: {roundProgress.attemptCount}
                                      </Button>
                                    </DialogTrigger>
                                  )}
                                  {roundProgress?.completed ? (
                                  <Badge variant={roundProgress.score >= 80 ? "default" : (roundProgress.score >=50 ? "secondary" : "destructive")} className="bg-green-500 text-white">
                                      {roundProgress.score}%
                                  </Badge>
                                  ) : (
                                  <Badge variant="outline">Не пройден</Badge>
                                  )}
                              </div>
                             </CardTitle>
                            {roundProgress?.completed && <Progress value={roundProgress.score} className="h-2 mt-2" />}
                          </CardHeader>
                          {(!roundProgress || (Array.isArray(roundProgress?.attempts) && roundProgress?.attempts.length === 0)) && !roundProgress?.completed ? (
                              <CardContent className="p-4 text-sm text-muted-foreground">
                                  Ученик еще не проходил этот раунд или нет данных по ответам.
                              </CardContent>
                           ) : (
                             <CardContent className="p-4 text-sm text-muted-foreground italic">
                                Для просмотра детальных ответов, нажмите на количество попыток.
                             </CardContent>
                           )}
                        </Card>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            )}
          </CardContent>
        </Card>

        {relevantRemediationUnits.length > 0 && (
          <Card className="border-accent ring-2 ring-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center text-accent">
                <GraduationCap className="mr-2 h-6 w-6"/>
                Работа над ошибками
              </CardTitle>
              <CardDescription>Прогресс по назначенным юнитам для исправления ошибок.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                {relevantRemediationUnits.map((unit: Unit) => (
                  <AccordionItem value={unit.id} key={unit.id}>
                    <AccordionTrigger className="text-xl hover:bg-muted/50 px-4 py-3 rounded-md text-accent">
                      {unit.name}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-4 bg-background">
                      {unit.rounds.map((round: Round) => {
                        const roundProgress = progress.find(p => p.unitId === unit.id && p.roundId === round.id);
                        return (
                          <Card key={round.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 p-4">
                               <CardTitle className="text-lg flex justify-between items-center flex-wrap gap-2">
                                <span>{round.name}</span>
                                <div className="flex items-center gap-2">
                                    {roundProgress?.attemptCount > 0 && (
                                      <DialogTrigger asChild>
                                        <Button variant="secondary" size="sm" className="flex items-center gap-1" onClick={() => handleOpenHistoryDialog(unit.id, round.id, round.name)}>
                                            <History className="h-4 w-4" />
                                            Попыток: {roundProgress.attemptCount}
                                        </Button>
                                      </DialogTrigger>
                                    )}
                                    {roundProgress?.completed ? (
                                    <Badge variant="default" className="bg-green-500 text-white">{roundProgress.score}%</Badge>
                                    ) : (
                                    <Badge variant="outline">Не пройден</Badge>
                                    )}
                                </div>
                               </CardTitle>
                              {roundProgress?.completed && <Progress value={roundProgress.score} className="h-2 mt-2" />}
                            </CardHeader>
                            <CardContent className="p-4 text-sm text-muted-foreground italic">
                                Для просмотра детальных ответов, нажмите на количество попыток.
                            </CardContent>
                          </Card>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-6 w-6 text-primary" />
              Оценки за Оффлайн Тесты
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offlineScores.length === 0 ? (
              <p className="text-muted-foreground">У этого ученика нет оценок за оффлайн тесты.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тест</TableHead>
                    <TableHead className="text-center">Оценка</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                    <TableHead>Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineScores.map(score => (
                    <TableRow key={score.id}>
                      <TableCell>
                        <div className="font-semibold">{score.testName}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(score.date), 'dd.MM.yyyy HH:mm', { locale: ru })}</div>
                      </TableCell>
                      <TableCell className="text-center">
                          <Badge 
                              className={cn(`text-lg font-bold`,
                                score.score === 5 && 'bg-green-500 hover:bg-green-600',
                                score.score === 4 && 'bg-blue-500 hover:bg-blue-600',
                                score.score === 3 && 'bg-yellow-500 hover:bg-yellow-600 text-black',
                                score.score === 2 && 'bg-red-500 hover:bg-red-600'
                              )}
                          >
                          {score.score}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {score.passed === true && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            <Check className="mr-1 h-4 w-4" /> Пройден
                          </Badge>
                        )}
                        {score.passed === false && (
                          <Badge variant="destructive">
                            <X className="mr-1 h-4 w-4" /> Не пройден
                          </Badge>
                        )}
                        {score.passed === null && (
                          <Badge variant="secondary">-</Badge>
                        )}
                      </TableCell>
                      <TableCell>{score.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>История попыток: {currentRoundForHistory?.roundName || ''}</DialogTitle>
          <DialogDescription>
            Просмотрите детали каждой попытки ученика {student.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 h-full overflow-hidden">
          {isLoadingHistory ? (
            <div className="col-span-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : historyForRound.length === 0 ? (
            <div className="col-span-full flex items-center justify-center text-muted-foreground">
              Нет данных о попытках для этого раунда.
            </div>
          ) : (
            <>
              <div className="md:col-span-1 border-r pr-4 overflow-y-auto">
                <h4 className="font-semibold mb-2">Попытки</h4>
                <Select
                  onValueChange={(attemptId) => setSelectedAttempt(historyForRound.find(a => a.id === attemptId) || null)}
                  defaultValue={selectedAttempt?.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите попытку..." />
                  </SelectTrigger>
                  <SelectContent>
                    {historyForRound.map(attempt => (
                      <SelectItem key={attempt.id} value={attempt.id}>
                        Попытка {attempt.attemptNumber} ({attempt.score}%) - {format(new Date(attempt.timestamp), 'dd.MM.yy HH:mm')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3 overflow-y-auto pl-2">
                {selectedAttempt ? (
                  <div>
                    <h4 className="font-semibold mb-2">Детали попытки #{selectedAttempt.attemptNumber}</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Слово (Рус)</TableHead>
                          <TableHead>Ответ ученика</TableHead>
                          <TableHead>Правильный ответ</TableHead>
                          <TableHead className="text-right">Результат</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAttempt.attempts.map((attempt, index) => {
                          const wordDetail = curriculum
                            .concat(Object.values(REMEDIATION_UNITS))
                            .find(u => u.id === selectedAttempt.unitId)?.rounds
                            .find(r => r.id === selectedAttempt.roundId)?.words
                            .find(w => w.id === attempt.wordId);
                          return (
                            <TableRow key={`${attempt.wordId}-${index}`}>
                              <TableCell>{wordDetail?.russian}</TableCell>
                              <TableCell className="font-mono">{attempt.userAnswer || "-"}</TableCell>
                              <TableCell className="font-mono">{wordDetail?.english}</TableCell>
                              <TableCell className="text-right">
                                {attempt.correct ? 
                                  <CheckCircle className="h-5 w-5 text-green-500 inline" /> : 
                                  <XCircle className="h-5 w-5 text-red-500 inline" />}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Выберите попытку для просмотра деталей.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
