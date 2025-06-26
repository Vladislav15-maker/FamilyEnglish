'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OFFLINE_TESTS } from '@/lib/curriculum-data';
import type { User, OfflineTestScore } from '@/lib/types';
import OfflineTestForm from '@/components/teacher/OfflineTestForm';
import EditOfflineScoreDialog from '@/components/teacher/EditOfflineScoreDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, AlertCircle, BookOpen, MoreHorizontal, Check, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TeacherOfflineTestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [scores, setScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scoreToEdit, setScoreToEdit] = useState<OfflineTestScore | null>(null);
  const [scoreToDelete, setScoreToDelete] = useState<OfflineTestScore | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsRes, scoresRes] = await Promise.all([
        fetch('/api/teacher/students'),
        fetch('/api/offline-scores/all'),
      ]);

      if (!studentsRes.ok) throw new Error('Не удалось загрузить список учеников');
      if (!scoresRes.ok) throw new Error('Не удалось загрузить историю оценок');

      const studentsData: User[] = await studentsRes.json();
      let scoresData: OfflineTestScore[] = await scoresRes.json();

      setStudents(studentsData);
      scoresData = scoresData.map(score => ({
        ...score,
        testName: OFFLINE_TESTS.find(t => t.id === score.testId)?.name || score.testId || 'Неизвестный тест',
        studentName: studentsData.find(s => s.id === score.studentId)?.name || score.studentId,
      }));
      setScores(scoresData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchAllData();
    } else if (user && user.role !== 'teacher') {
      setIsLoading(false);
      setError("Доступ запрещен.");
    } else {
      setIsLoading(false);
    }
  }, [user, fetchAllData]);

  const handleDeleteScore = async () => {
    if (!scoreToDelete) return;

    try {
      const response = await fetch(`/api/offline-scores/${scoreToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Не удалось удалить оценку');
      }
      toast({ title: 'Успех', description: 'Оценка была успешно удалена.' });
      setScoreToDelete(null);
      await fetchAllData(); // Refresh data
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading && !scores.length && students.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-1/3" /></div>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div><Skeleton className="h-96 w-full" /></div>
          <div><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-2">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</CardContent></Card></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return (<Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только для учителей.</AlertDescription></Alert>);
  }

  if (error && (!students.length || !scores.length)) {
    return (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка загрузки</AlertTitle><AlertDescription>{error.split('\n').map((line, i) => <p key={i}>{line}</p>)}</AlertDescription></Alert>);
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <CheckSquare className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold font-headline">Управление Оффлайн Тестами</h1>
        </div>
        {error && (students.length > 0 || scores.length > 0) && (
          <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка при загрузке части данных</AlertTitle><AlertDescription>{error.split('\n').map((line, i) => <p key={i}>{line}</p>)}Некоторые данные могут быть неактуальны.</AlertDescription></Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="md:col-span-1"><OfflineTestForm students={students} onScoreAdded={fetchAllData} /></div>
          <div className="md:col-span-1">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>История Оценок</CardTitle><CardDescription>Список всех выставленных оффлайн оценок.</CardDescription></CardHeader>
              <CardContent>
                {isLoading && scores.length === 0 ? (<div className="space-y-2">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
                ) : scores.length === 0 ? (<Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет оценок</AlertTitle><AlertDescription>Еще не было выставлено ни одной оценки за оффлайн тесты.</AlertDescription></Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Ученик</TableHead><TableHead>Тест</TableHead><TableHead className="text-center">Оценка</TableHead><TableHead className="text-center">Статус</TableHead><TableHead className="text-right">Действия</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {scores.map(score => (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{score.studentName}</TableCell>
                            <TableCell>{score.testName}</TableCell>
                            <TableCell className="text-center"><Badge className={`text-lg font-bold ${score.score === 5 ? 'bg-green-500 hover:bg-green-600' : ''} ${score.score === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''} ${score.score === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''} ${score.score === 2 ? 'bg-red-500 hover:bg-red-600' : ''}`}>{score.score}</Badge></TableCell>
                            <TableCell className="text-center">
                              {score.passed ? (<Badge variant="default" className="bg-green-500 hover:bg-green-600"><Check className="mr-1 h-4 w-4" /> Пройден</Badge>
                              ) : (<Badge variant="destructive"><X className="mr-1 h-4 w-4" /> Не пройден</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Открыть меню</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setScoreToEdit(score)}>Редактировать</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-500" onClick={() => setScoreToDelete(score)}><Trash2 className="mr-2 h-4 w-4" />Удалить</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {scoreToEdit && (
        <EditOfflineScoreDialog
          score={scoreToEdit}
          students={students}
          isOpen={!!scoreToEdit}
          onClose={() => setScoreToEdit(null)}
          onScoreUpdated={() => {
            setScoreToEdit(null);
            fetchAllData();
          }}
        />
      )}

      <AlertDialog open={!!scoreToDelete} onOpenChange={(isOpen) => !isOpen && setScoreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие нельзя будет отменить. Оценка для ученика {scoreToDelete?.studentName} будет навсегда удалена.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setScoreToDelete(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScore} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
