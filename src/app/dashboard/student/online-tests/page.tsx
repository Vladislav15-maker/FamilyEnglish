'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { OnlineTest, OnlineTestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TestTube2, AlertCircle, BookOpen, Play, CheckCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type TestWithStatus = OnlineTest & {
  lastResult: OnlineTestResult | null;
};

export default function StudentOnlineTestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'student') {
      setIsLoading(true);
      setError(null);
      fetch(`/api/student/online-tests`)
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить список онлайн тестов.');
          return res.json();
        })
        .then((data: TestWithStatus[]) => {
          setTests(data);
        })
        .catch(err => {
          console.error("Failed to load online tests:", err);
          setError((err as Error).message);
        })
        .finally(() => setIsLoading(false));
    } else if (user) {
        setIsLoading(false);
        setError("Эта страница доступна только для учеников.");
    } else {
        setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3"><Skeleton className="h-10 w-10" /><Skeleton className="h-8 w-1/3" /></div>
        <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map(i => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-1/2 mt-4" /></CardContent></Card>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user || user.role !== 'student') {
    return <Alert variant="default"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите как ученик для просмотра этой страницы.</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <TestTube2 className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Онлайн Тесты</h1>
      </div>

      {tests.length === 0 ? (
        <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет доступных тестов</AlertTitle><AlertDescription>Учитель пока не добавил ни одного онлайн теста.</AlertDescription></Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {tests.map(test => (
            <Card key={test.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{test.name}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {test.lastResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-md">
                      <div>
                        <p className="font-semibold">Последний результат: {test.lastResult.score}%</p>
                        <p className="text-muted-foreground">
                          Сдано {formatDistanceToNow(new Date(test.lastResult.completedAt), { addSuffix: true, locale: ru })}
                        </p>
                      </div>
                      {test.lastResult.isPassed === true && <Badge className="bg-green-500 hover:bg-green-600">Сдано</Badge>}
                      {test.lastResult.isPassed === false && <Badge variant="destructive">Не сдано</Badge>}
                      {test.lastResult.isPassed === null && <Badge variant="secondary">Ожидает проверки</Badge>}
                    </div>
                     <div className="flex gap-2">
                        <Button asChild className="w-full">
                          <Link href={`/dashboard/student/online-tests/${test.id}/result/${test.lastResult.id}`}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Посмотреть результат
                          </Link>
                        </Button>
                    </div>
                  </div>
                ) : (
                  <Button asChild size="lg">
                    <Link href={`/dashboard/student/online-tests/${test.id}/take`}>
                      <Play className="mr-2 h-5 w-5" /> Начать тест
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
