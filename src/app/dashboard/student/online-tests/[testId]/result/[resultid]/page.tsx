'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { OnlineTest, OnlineTestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, XCircle, FileText, BookOpen, AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type ResultData = {
  result: OnlineTestResult;
  testDetails: OnlineTest;
};

export default function StudentTestResultPage() {
  const params = useParams();
  const { user } = useAuth();
  const resultId = typeof params.resultId === 'string' ? params.resultId : '';

  const [data, setData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && resultId) {
      setIsLoading(true);
      fetch(`/api/student/online-tests/results/${resultId}`)
        .then(res => {
          if (res.status === 403) throw new Error('У вас нет доступа к этому результату.');
          if (!res.ok) throw new Error('Не удалось загрузить результат теста.');
          return res.json();
        })
        .then(resultData => {
          setData(resultData);
        })
        .catch(err => setError((err as Error).message))
        .finally(() => setIsLoading(false));
    } else if(!user) {
        setIsLoading(false);
    }
  }, [user, resultId]);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }
  if (!user) {
    return <Alert variant="default"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите в систему.</AlertDescription></Alert>;
  }
  
  if (!data || !data.result || !data.testDetails) {
    return <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Результат не найден</AlertTitle><AlertDescription>Не удалось найти данные для этого результата теста.</AlertDescription></Alert>;
  }


  const { result, testDetails } = data;

  if (result.isPassed === null) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4 text-center">
            <Clock className="h-16 w-16 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold font-headline">Тест на проверке</h1>
            <p className="text-lg text-muted-foreground max-w-md">
                Ваш тест "{testDetails.name}" был успешно отправлен. Учитель скоро проверит его, и вы сможете увидеть здесь свои результаты.
            </p>
            <Button asChild>
                <Link href="/dashboard/student/online-tests">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться к списку тестов
                </Link>
            </Button>
        </div>
      )
  }

  const answers = Array.isArray(result.answers) ? result.answers : [];
  const correctCount = answers.filter(a => a.correct).length;
  const incorrectCount = answers.length - correctCount;
  const progressValue = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold font-headline">Результаты Теста</h1>
                <p className="text-muted-foreground">{testDetails.name}</p>
              </div>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard/student/online-tests">
                    <ArrowLeft className="mr-2 h-4 w-4" />К списку тестов
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader><CardTitle>Сводка по результатам</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 items-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-7xl font-bold text-primary">{result.score}%</p>
                    <p className="text-muted-foreground">Ваш результат</p>
                    {result.grade && (
                         <p className="text-2xl font-bold">Оценка учителя: <span className={`
                            ${result.grade === 5 ? 'text-green-500' : ''}
                            ${result.grade === 4 ? 'text-blue-500' : ''}
                            ${result.grade === 3 ? 'text-yellow-500' : ''}
                            ${result.grade === 2 ? 'text-red-500' : ''}`
                         }>{result.grade}</span></p>
                    )}
                    {result.teacherNotes && <p className="text-sm text-center italic p-2 bg-muted rounded-md">"{result.teacherNotes}"</p>}
                </div>
                
                <div className="space-y-4 text-center p-4 border rounded-lg">
                    <div className="flex justify-around">
                        <div>
                            <p className="text-2xl font-bold text-green-500">{correctCount}</p>
                            <p className="text-sm text-muted-foreground">Правильно</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
                            <p className="text-sm text-muted-foreground">Неправильно</p>
                        </div>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Подробные ответы</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Слово (Рус)</TableHead>
                            <TableHead>Ваш ответ</TableHead>
                            <TableHead>Правильный ответ</TableHead>
                            <TableHead className="text-center">Результат</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {answers.map((answer, index) => {
                            const word = testDetails.words.find(w => w.id === answer.wordId);
                            return (
                                <TableRow key={index} className={answer.correct ? '' : 'bg-destructive/10'}>
                                    <TableCell>{word?.russian}</TableCell>
                                    <TableCell className="font-mono">{answer.userAnswer || '(пусто)'}</TableCell>
                                    <TableCell className="font-mono text-green-600 dark:text-green-400">{word?.english}</TableCell>
                                    <TableCell className="text-center">
                                        {answer.correct 
                                            ? <CheckCircle className="h-5 w-5 text-green-500 inline-block" /> 
                                            : <XCircle className="h-5 w-5 text-red-500 inline-block" />
                                        }
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
