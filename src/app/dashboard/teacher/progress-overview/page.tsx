'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { curriculum } from '@/lib/curriculum-data';
import type { User, StudentRoundProgress, OfflineTestScore, StudentUnitGrade } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, BarChart3, Users, ClipboardList, Sigma, Annoyed } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AnnounceTestForm from '@/components/teacher/AnnounceTestForm';


interface StudentOnlineOverviewItem {
  student: User;
  progress: StudentRoundProgress[];
  overallProgressPercentage: number;
  averageOnlineScore: number;
  completedCoreRounds: number;
}

export default function TeacherConsolidatedProgressOverviewPage() {
  const { user } = useAuth();
  const [classOnlineOverview, setClassOnlineOverview] = useState<StudentOnlineOverviewItem[]>([]);
  const [offlineScores, setOfflineScores] = useState<OfflineTestScore[]>([]);
  const [unitGrades, setUnitGrades] = useState<StudentUnitGrade[]>([]);
  
  const [isLoadingOnline, setIsLoadingOnline] = useState(true);
  const [isLoadingOffline, setIsLoadingOffline] = useState(true);
  const [isLoadingUnitGrades, setIsLoadingUnitGrades] = useState(true);
  
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const totalRoundsInCurriculum = curriculum.reduce((acc, unit) => acc + unit.rounds.length, 0);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      const newErrorMessages: string[] = [];
      
      const fetchOnlineOverview = async () => {
        setIsLoadingOnline(true);
        try {
          const res = await fetch('/api/teacher/students-overview');
          if (!res.ok) {
            const errText = await res.text().catch(() => "Не удалось получить текст ошибки");
            throw new Error(`Онлайн-обзор (учитель): ${res.status} - ${errText.substring(0, 200)}`);
          }
          const overviewData: { student: User; progress: StudentRoundProgress[] }[] = await res.json();
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
          setClassOnlineOverview(processedOverview);
        } catch (err) {
          console.error("Failed to load class online overview for teacher:", err);
          newErrorMessages.push((err as Error).message);
        } finally {
          setIsLoadingOnline(false);
        }
      };

      const fetchOfflineScores = async () => {
        setIsLoadingOffline(true);
        try {
          const res = await fetch(`/api/offline-scores/all`);
          if (!res.ok) {
            const errText = await res.text().catch(() => "Не удалось получить текст ошибки");
            throw new Error(`Оффлайн-оценки (учитель): ${res.status} - ${errText.substring(0,200)}`);
          }
          const data: OfflineTestScore[] = await res.json();
          setOfflineScores(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
          console.error("Failed to load class offline scores for teacher:", err);
          newErrorMessages.push((err as Error).message);
        } finally {
          setIsLoadingOffline(false);
        }
      };

      const fetchUnitGrades = async () => {
        setIsLoadingUnitGrades(true);
        try {
          // Teachers should probably see all unit grades, not just those they entered, for a class overview
          const res = await fetch(`/api/student/class-unit-grades`); 
          if (!res.ok) {
            const errText = await res.text().catch(() => "Не удалось получить текст ошибки");
            throw new Error(`Оценки за юниты (обзор для учителя): ${res.status} - ${errText.substring(0,200)}`);
          }
          const data: StudentUnitGrade[] = await res.json();
          setUnitGrades(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
          console.error("Failed to load class unit grades for teacher overview:", err);
          newErrorMessages.push((err as Error).message);
        } finally {
          setIsLoadingUnitGrades(false);
        }
      };
      
      Promise.allSettled([fetchOnlineOverview(), fetchOfflineScores(), fetchUnitGrades()]).then(() => {
          setErrorMessages(newErrorMessages);
      });

    } else if (!user && !isLoadingOnline && !isLoadingOffline && !isLoadingUnitGrades) { 
      setIsLoadingOnline(false);
      setIsLoadingOffline(false);
      setIsLoadingUnitGrades(false);
      if (!user) { // Only set auth error if no user after loading states are false
          setErrorMessages(prev => [...prev, "Пожалуйста, войдите в систему для просмотра этой страницы."]);
      } else if (user && user.role !== 'teacher') {
          setErrorMessages(prev => [...prev, "Эта страница доступна только учителям."]);
      }
    }
  }, [user, totalRoundsInCurriculum]);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };
  
  const isLoading = isLoadingOnline || isLoadingOffline || isLoadingUnitGrades;
  const hasCriticalError = errorMessages.length > 0 && !classOnlineOverview.length && !offlineScores.length && !unitGrades.length;


  if (isLoading && errorMessages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3"> <Skeleton className="h-10 w-10 rounded-full" /> <Skeleton className="h-10 w-1/3" /> </div>
        {[1,2,3].map(i => (
            <Card key={i} className="mt-6"> <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader> <CardContent className="space-y-4"> <Skeleton className="h-24 w-full" /> </CardContent> </Card>
        ))}
      </div>
    );
  }
  
   if (!user || user.role !== 'teacher') {
     return ( <Alert variant="destructive"> <BookOpen className="h-4 w-4" /> <AlertTitle>Доступ запрещен</AlertTitle> <AlertDescription> Эта страница доступна только для учителей. </AlertDescription> </Alert> );
  }

  if (hasCriticalError) { 
    return ( <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Ошибка Загрузки</AlertTitle> <AlertDescription>{errorMessages.map((e, i) => <p key={i}>{e}</p>)}</AlertDescription> </Alert> );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3"> <BarChart3 className="h-10 w-10 text-primary" /> <h1 className="text-4xl font-bold font-headline">Общий Обзор Успеваемости Класса</h1> </div>
       {errorMessages.length > 0 && !hasCriticalError && ( <Alert variant="destructive" className="my-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Ошибка при загрузке части данных</AlertTitle> <AlertDescription>{errorMessages.map((e, i) => <p key={i}>{e}</p>)}</AlertDescription> </Alert> )}

      <AnnounceTestForm />

      {/* Online Progress Section */}
      <Card className="shadow-lg">
        <CardHeader> <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6"/>Рейтинг успеваемости (онлайн)</CardTitle> <CardDescription>Обзор онлайн-прогресса всех учеников (не включая юниты "Работа над ошибками"). Отсортировано по общему прогрессу.</CardDescription> </CardHeader>
        <CardContent className="p-0">
          {isLoadingOnline && classOnlineOverview.length === 0 ? <Skeleton className="h-40 w-full" /> : classOnlineOverview.length === 0 && !isLoadingOnline ? ( <Alert className="m-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Нет учеников</AlertTitle> <AlertDescription> В системе пока нет зарегистрированных учеников для отображения онлайн-прогресса. </AlertDescription> </Alert>
          ) : (
            <div className="divide-y divide-border">
              {classOnlineOverview.map((item) => (
                <div key={item.student.id} className="flex items-center space-x-4 p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(item.student.name)}`} alt={item.student.name} data-ai-hint="profile person" />
                    <AvatarFallback>{getInitials(item.student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0"> {/* Added min-w-0 */}
                    <p className="text-lg font-semibold text-primary truncate">{item.student.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">Общий прогресс:</span>
                      <Progress value={item.overallProgressPercentage} className="w-24 sm:w-32 md:w-40 h-2" aria-label={`Общий прогресс ${item.student.name}: ${item.overallProgressPercentage}%`} />
                      <span>{item.overallProgressPercentage}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      Средний балл: {item.averageOnlineScore > 0 ? `${item.averageOnlineScore}%` : 'N/A'}
                    </p>
                  </div>
                   <div className="text-right shrink-0"> {/* Added shrink-0 */}
                      <p className="text-sm text-muted-foreground whitespace-nowrap">Пройдено раундов</p>
                      <p className="text-lg font-semibold">{item.completedCoreRounds} / {totalRoundsInCurriculum}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Scores Section */}
      <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center"><ClipboardList className="mr-2 h-6 w-6"/>Все оффлайн оценки класса</CardTitle><CardDescription>Оценки всех учеников за оффлайн тесты.</CardDescription></CardHeader>
          <CardContent>
            {isLoadingOffline && offlineScores.length === 0 ? <Skeleton className="h-40 w-full" /> : offlineScores.length === 0 && !isLoadingOffline ? (
              <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет оффлайн оценок</AlertTitle><AlertDescription>В классе еще не было выставлено ни одной оффлайн оценки.</AlertDescription></Alert>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table className="w-full">
                  <TableHeader><TableRow><TableHead>Дата</TableHead><TableHead>Ученик</TableHead><TableHead className="text-center">Оценка</TableHead><TableHead>Комментарий</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {offlineScores.map(score => (
                      <TableRow key={score.id}>
                        <TableCell className="font-medium whitespace-nowrap">{format(new Date(score.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}</TableCell>
                        <TableCell>{score.studentName || classOnlineOverview.find(s => s.student.id === score.studentId)?.student.name || score.studentId}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-lg font-bold ${score.score === 5 ? 'bg-green-500 hover:bg-green-600' : ''} ${score.score === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''} ${score.score === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''} ${score.score === 2 ? 'bg-red-500 hover:bg-red-600' : ''}`}>{score.score}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words">{score.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>

      {/* Unit Grades Section */}
       <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center"><Sigma className="mr-2 h-6 w-6"/>Все оценки за юниты класса</CardTitle><CardDescription>Оценки всех учеников за пройденные юниты.</CardDescription></CardHeader>
          <CardContent>
            {isLoadingUnitGrades && unitGrades.length === 0 ? <Skeleton className="h-40 w-full" /> : unitGrades.length === 0 && !isLoadingUnitGrades ? (
              <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет оценок за юниты</AlertTitle><AlertDescription>В классе еще не было выставлено ни одной оценки за юниты.</AlertDescription></Alert>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table className="w-full">
                  <TableHeader><TableRow><TableHead>Дата</TableHead><TableHead>Ученик</TableHead><TableHead>Юнит</TableHead><TableHead className="text-center">Оценка</TableHead><TableHead>Комментарий</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {unitGrades.map(grade => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium whitespace-nowrap">{format(new Date(grade.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}</TableCell>
                        <TableCell>{grade.studentName || classOnlineOverview.find(s => s.student.id === grade.studentId)?.student.name || grade.studentId}</TableCell>
                        <TableCell>{grade.unitName || curriculum.find(u => u.id === grade.unitId)?.name || grade.unitId}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-lg font-bold ${grade.grade === 5 ? 'bg-green-500 hover:bg-green-600' : ''} ${grade.grade === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''} ${grade.grade === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''} ${grade.grade === 2 ? 'bg-red-500 hover:bg-red-600' : ''}`}>{grade.grade}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words">{grade.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
