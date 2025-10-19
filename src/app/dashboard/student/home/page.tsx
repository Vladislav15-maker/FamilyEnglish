'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { StudentRoundProgress } from '@/lib/types';
import { curriculum } from '@/lib/curriculum-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, BookOpen, Award, TrendingUp, CheckCircle, Sparkles, TestTube2, Users2, Sigma, Bell, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StudentStats {
  unitsCompleted: number;
  unitsInProgress: number;
  totalUnits: number;
  averageScoreCompletedRounds: number;
  completedRoundsCount: number;
  totalRoundsInCurriculum: number;
}

interface Announcement {
  id: string;
  content: string;
  is_special: boolean;
  created_at: string;
}

export default function StudentHomePage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authIsLoading) {
      setPageIsLoading(true);
      return;
    }

    if (user && user.role === 'student') {
      setPageIsLoading(true);
      setError(null);
      
      const fetchAllData = async () => {
        try {
          const [progressRes, announcementRes] = await Promise.all([
            fetch(`/api/progress/student/${user.id}`),
            fetch('/api/announcements/unit-test') // This URL now fetches the latest generic announcement
          ]);

          if (!progressRes.ok) {
            const errData = await progressRes.json().catch(() => ({}));
            throw new Error(errData.error || `Не удалось загрузить прогресс. Статус: ${progressRes.status}`);
          }
          const progressData: StudentRoundProgress[] = await progressRes.json();

          if (announcementRes.ok) {
            const announcementData = await announcementRes.json();
            setAnnouncement(announcementData);
          } else {
            setAnnouncement(null);
          }

          // --- Calculate stats ---
          const totalUnits = curriculum.length;
          let unitsCompleted = 0;
          let unitsInProgress = 0;
          const coreProgressData = progressData.filter(p => !p.unitId.startsWith('rem-unit-'));
          let sumOfScoresCompletedRounds = 0;
          let completedRoundsCount = 0;
          let totalRoundsInCurriculum = 0;

          curriculum.forEach(unit => {
            totalRoundsInCurriculum += unit.rounds.length;
            const unitProgress = coreProgressData.filter(p => p.unitId === unit.id);
            let completedRoundsInUnit = 0;
            let attemptedRoundsInUnit = 0;

            unit.rounds.forEach(round => {
              const roundProg = unitProgress.find(p => p.roundId === round.id);
              if (roundProg?.completed) {
                completedRoundsInUnit++;
                completedRoundsCount++;
                sumOfScoresCompletedRounds += roundProg.score;
              }
              if (roundProg && (roundProg.attempts?.length > 0 || roundProg.completed)) {
                attemptedRoundsInUnit++;
              }
            });

            if (unit.rounds.length > 0 && completedRoundsInUnit === unit.rounds.length) {
              unitsCompleted++;
            } else if (attemptedRoundsInUnit > 0) {
              unitsInProgress++;
            }
          });

          setStats({
            unitsCompleted,
            unitsInProgress,
            totalUnits,
            averageScoreCompletedRounds: completedRoundsCount > 0 ? Math.round(sumOfScoresCompletedRounds / completedRoundsCount) : 0,
            completedRoundsCount,
            totalRoundsInCurriculum,
          });

        } catch (err) {
          console.error("Failed to load student data for home page:", err);
          setError((err as Error).message);
          setStats(null);
        } finally {
          setPageIsLoading(false);
        }
      };

      fetchAllData();

    } else {
      setPageIsLoading(false);
      setStats(null);
      if (user && user.role !== 'student') {
        setError("Эта страница доступна только для студентов.");
      }
    }
  }, [user, authIsLoading]);

  if (pageIsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!user || user.role !== 'student' || !stats) {
    return (
      <Alert>
        <AlertTitle>Нет данных</AlertTitle>
        <AlertDescription>Информация для главной страницы студента отсутствует.</AlertDescription>
      </Alert>
    );
  }
  
  const overallProgressPercentage = stats.totalRoundsInCurriculum > 0 ? Math.round((stats.completedRoundsCount / stats.totalRoundsInCurriculum) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg shadow-md bg-card border">
        <h1 className="text-4xl font-bold font-headline">Добро пожаловать, {user.name}!</h1>
        <p className="text-lg mt-2 text-muted-foreground">Готовы к новым знаниям? Давайте начнем!</p>
      </div>

      {announcement && (
        <Alert variant={announcement.is_special ? "destructive" : "default"} className="shadow-lg">
          {announcement.is_special ? <Bell className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          <AlertTitle className="font-bold text-lg">{announcement.is_special ? "Важное объявление!" : "Объявление от учителя"}</AlertTitle>
          <AlertDescription className="text-base mt-2">
            {announcement.content}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Юниты Завершено</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unitsCompleted} / {stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              юнитов полностью пройдено
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний Балл</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScoreCompletedRounds > 0 ? `${stats.averageScoreCompletedRounds}%` : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              по завершенным раундам
            </p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий Прогресс</CardTitle>
            <Sparkles className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{overallProgressPercentage}%</div>
            <Progress value={overallProgressPercentage} className="h-2" aria-label={`Общий прогресс по курсу: ${overallProgressPercentage}%`} />
             <p className="text-xs text-muted-foreground mt-1">
              {stats.completedRoundsCount} из {stats.totalRoundsInCurriculum} раундов завершено
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Быстрый доступ</CardTitle>
          <CardDescription>Продолжите обучение или просмотрите свои достижения.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button asChild size="lg" className="w-full justify-start">
            <Link href="/dashboard/units">
              <BookOpen className="mr-2 h-5 w-5" />
              Перейти к Юнитам
              <ArrowRight className="ml-auto h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full justify-start">
            <Link href="/dashboard/student/offline-tests">
              <Award className="mr-2 h-5 w-5" />
              Мои Оффлайн Оценки
              <ArrowRight className="ml-auto h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full justify-start">
            <Link href="/dashboard/student/online-tests">
              <TestTube2 className="mr-2 h-5 w-5" />
              Мои Онлайн Тесты
              <ArrowRight className="ml-auto h-5 w-5" />
            </Link>
          </Button>
           <Button asChild variant="outline" size="lg" className="w-full justify-start">
            <Link href="/dashboard/student/unit-grades">
              <Sigma className="mr-2 h-5 w-5" />
              Мои Оценки за Юниты
              <ArrowRight className="ml-auto h-5 w-5" />
            </Link>
          </Button>
           <Button asChild variant="outline" size="lg" className="w-full justify-start">
            <Link href="/dashboard/student/class-overview">
              <Users2 className="mr-2 h-5 w-5" />
              Обзор Класса
              <ArrowRight className="ml-auto h-5 w-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
