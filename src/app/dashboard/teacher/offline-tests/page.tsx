'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OFFLINE_TESTS } from '@/lib/curriculum-data';
import type { User, OfflineTestScore } from '@/lib/types';
import OfflineTestForm from '@/components/teacher/OfflineTestForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, AlertCircle, BookOpen, Edit, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

export default function TeacherOfflineTestsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [scores, setScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/students');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch students. Status: ${res.status}`);
      }
      const studentsData: User[] = await res.json();
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load students from API:", err);
      setError("Не удалось загрузить список учеников. " + (err as Error).message);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/offline-scores/all');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch offline scores. Status: ${res.status}`);
      }
      let scoresData: OfflineTestScore[] = await res.json();
      scoresData = scoresData.map(score => ({
        ...score,
        testName: OFFLINE_TESTS.find(t => t.id === score.testId)?.name || score.testId || 'Неизвестный тест'
      }));
      setScores(scoresData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Failed to load offline scores from API:", err);
      setError((prevError) => prevError ? `${prevError}\nНе удалось загрузить историю оценок. ${(err as Error).message}` : `Не удалось загрузить историю оценок. ${(err as Error).message}`);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      setError(null);
      Promise.all([fetchStudents(), fetchScores()])
        .catch(err => {
          // Errors are handled within fetchStudents/fetchScores and set to error state
        })
        .finally(() => setIsLoading(false));
    } else if (user && user.role !== 'teacher') {
      setIsLoading(false);
      setError("Доступ запрещен.");
    } else {
      setIsLoading(false); // No user yet
    }
  }, [user, fetchStudents, fetchScores]);


  if (isLoading && !scores.length && students.length === 0) { 
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div><Skeleton className="h-96 w-full" /></div>
            <div>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-2">
                        {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'teacher') {
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
  
  if (error && (!students.length || !scores.length)) { // Show general error if loading critical data failed
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>
            {error.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </AlertDescription>
        </Alert>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <CheckSquare className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Управление Оффлайн Тестами</h1>
      </div>
      {error && (students.length > 0 || scores.length > 0) &&  ( // Show partial error if some data loaded
         <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка при загрузке части данных</AlertTitle>
            <AlertDescription>
              {error.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              Некоторые данные могут быть неактуальны.
            </AlertDescription>
          </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start"> 
        <div className="md:col-span-1">
          {students.length > 0 ? (
            <OfflineTestForm students={students} onScoreAdded={fetchScores} />
          ) : (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Edit className="mr-2 h-5 w-5"/>Добавить оценку</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Нет учеников</AlertTitle>
                        <AlertDescription>
                        Сначала должны быть добавлены ученики в систему.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-1"> 
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>История Оценок</CardTitle>
              <CardDescription>Список всех выставленных оффлайн оценок.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && scores.length === 0 ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
                </div>
              ) : scores.length === 0 ? (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Нет оценок</AlertTitle>
                    <AlertDescription>
                    Еще не было выставлено ни одной оценки за оффлайн тесты.
                    </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ученик</TableHead>
                      <TableHead>Тест</TableHead>
                      <TableHead className="text-center">Оценка</TableHead>
                      <TableHead className="text-center">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map(score => {
                      const studentInfo = students.find(s => s.id === score.studentId);
                      return (
                        <TableRow key={score.id}>
                          <TableCell className="font-medium">{studentInfo?.name || score.studentId}</TableCell>
                          <TableCell>{score.testName}</TableCell>
                          <TableCell className="text-center">
                             <Badge 
                                className={`text-lg font-bold
                                ${score.score === 5 ? 'bg-green-500 hover:bg-green-600' : ''}
                                ${score.score === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                ${score.score === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                                ${score.score === 2 ? 'bg-red-500 hover:bg-red-600' : ''}
                                `}
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
