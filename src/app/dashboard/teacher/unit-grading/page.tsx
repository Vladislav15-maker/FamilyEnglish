'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { User, StudentUnitGrade } from '@/lib/types';
import UnitGradeForm from '@/components/teacher/UnitGradeForm';
import EditUnitGradeDialog from '@/components/teacher/EditUnitGradeDialog';
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
import { Sigma, AlertCircle, BookOpen, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { curriculum } from '@/lib/curriculum-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TeacherUnitGradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [unitGrades, setUnitGrades] = useState<StudentUnitGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gradeToEdit, setGradeToEdit] = useState<StudentUnitGrade | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<StudentUnitGrade | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        fetch('/api/teacher/students'),
        fetch('/api/teacher/unit-grades'),
      ]);

      if (!studentsRes.ok) throw new Error('Не удалось загрузить список учеников');
      if (!gradesRes.ok) throw new Error('Не удалось загрузить оценки за юниты');

      const studentsData: User[] = await studentsRes.json();
      const gradesData: StudentUnitGrade[] = await gradesRes.json();
      
      const enrichedGrades = gradesData.map(grade => ({
        ...grade,
        unitName: curriculum.find(u => u.id === grade.unitId)?.name || grade.unitId,
        studentName: studentsData.find(s => s.id === grade.studentId)?.name || grade.studentId,
      }));
      
      setStudents(studentsData);
      setUnitGrades(enrichedGrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

  const handleDeleteGrade = async () => {
    if (!gradeToDelete) return;

    try {
      const response = await fetch(`/api/teacher/unit-grades/${gradeToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Не удалось удалить оценку');
      }
      toast({ title: 'Успех', description: 'Оценка за юнит была успешно удалена.' });
      setGradeToDelete(null);
      await fetchAllData(); // Refresh data
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading && !unitGrades.length && students.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-1/3" /></div>
        <div className="grid md:grid-cols-2 gap-8">
          <div><Skeleton className="h-[500px] w-full" /></div>
          <div><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-2">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</CardContent></Card></div>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'teacher') {
     return (<Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только для учителей.</AlertDescription></Alert>);
  }
  
  if (error && (!students.length || !unitGrades.length)) {
    return (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка загрузки</AlertTitle><AlertDescription>{error.split('\n').map((line, i) => <p key={i}>{line}</p>)}</AlertDescription></Alert>);
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Sigma className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold font-headline">Оценки за Юниты</h1>
        </div>
        {error && (students.length > 0 || unitGrades.length > 0) && (
           <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка при загрузке части данных</AlertTitle><AlertDescription>{error.split('\n').map((line, i) => <p key={i}>{line}</p>)}Некоторые данные могут быть неактуальны.</AlertDescription></Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-start"> 
          <div className="md:col-span-1">
            <UnitGradeForm students={students} onGradeAdded={fetchAllData} />
          </div>

          <div className="md:col-span-1"> 
            <Card className="shadow-lg">
              <CardHeader><CardTitle>История Оценок за Юниты</CardTitle><CardDescription>Список всех выставленных оценок за юниты.</CardDescription></CardHeader>
              <CardContent>
                {isLoading && unitGrades.length === 0 ? (
                  <div className="space-y-2">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
                ) : unitGrades.length === 0 ? (
                   <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет оценок</AlertTitle><AlertDescription>Еще не было выставлено ни одной оценки за юниты.</AlertDescription></Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Ученик</TableHead><TableHead>Юнит</TableHead><TableHead className="text-center">Оценка</TableHead><TableHead className="text-right">Действия</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {unitGrades.map(grade => (
                          <TableRow key={grade.id}>
                            <TableCell>{grade.studentName}</TableCell>
                            <TableCell>{grade.unitName}</TableCell>
                            <TableCell className="text-center"><Badge className={`text-lg font-bold ${grade.grade === 5 ? 'bg-green-500 hover:bg-green-600' : ''} ${grade.grade === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''} ${grade.grade === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''} ${grade.grade === 2 ? 'bg-red-500 hover:bg-red-600' : ''}`}>{grade.grade}</Badge></TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Открыть меню</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setGradeToEdit(grade)}>Редактировать</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-500" onClick={() => setGradeToDelete(grade)}><Trash2 className="mr-2 h-4 w-4" />Удалить</DropdownMenuItem>
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

      {gradeToEdit && (
        <EditUnitGradeDialog
          grade={gradeToEdit}
          isOpen={!!gradeToEdit}
          onClose={() => setGradeToEdit(null)}
          onGradeUpdated={() => {
            setGradeToEdit(null);
            fetchAllData();
          }}
        />
      )}

      <AlertDialog open={!!gradeToDelete} onOpenChange={(isOpen) => !isOpen && setGradeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие нельзя будет отменить. Оценка за юнит "{gradeToDelete?.unitName}" для ученика {gradeToDelete?.studentName} будет навсегда удалена.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGradeToDelete(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGrade} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
