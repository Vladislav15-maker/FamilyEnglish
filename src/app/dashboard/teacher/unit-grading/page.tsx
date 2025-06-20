'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { User, StudentUnitGrade } from '@/lib/types';
import UnitGradeForm from '@/components/teacher/UnitGradeForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Sigma, AlertCircle, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { curriculum } from '@/lib/curriculum-data';

export default function TeacherUnitGradingPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [unitGrades, setUnitGrades] = useState<StudentUnitGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/students');
      if (!res.ok) throw new Error('Не удалось загрузить список учеников');
      const studentsData: User[] = await res.json();
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError(prev => prev ? `${prev}\n${(err as Error).message}` : (err as Error).message);
    }
  }, []);

  const fetchUnitGrades = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/unit-grades'); // API to get all unit grades by this teacher
      if (!res.ok) throw new Error('Не удалось загрузить оценки за юниты');
      const gradesData: StudentUnitGrade[] = await res.json();
      
      // Enrich with unit names
      const enrichedGrades = gradesData.map(grade => {
        const unitInfo = curriculum.find(u => u.id === grade.unitId);
        return {
          ...grade,
          unitName: unitInfo ? unitInfo.name : grade.unitId,
        };
      });
      setUnitGrades(enrichedGrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Failed to load unit grades:", err);
      setError(prev => prev ? `${prev}\n${(err as Error).message}` : (err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      setError(null);
      Promise.all([fetchStudents(), fetchUnitGrades()])
        .finally(() => setIsLoading(false));
    } else if (user && user.role !== 'teacher') {
      setIsLoading(false);
      setError("Доступ запрещен.");
    } else {
      setIsLoading(false);
    }
  }, [user, fetchStudents, fetchUnitGrades]);

  if (isLoading && !unitGrades.length && students.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-1/3" /></div>
        <div className="grid md:grid-cols-2 gap-8">
          <div><Skeleton className="h-96 w-full" /></div>
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
          <UnitGradeForm students={students} onGradeAdded={fetchUnitGrades} />
        </div>

        <div className="md:col-span-1"> 
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>История Оценок за Юниты</CardTitle>
              <CardDescription>Список всех выставленных оценок за юниты.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && unitGrades.length === 0 ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
              ) : unitGrades.length === 0 ? (
                 <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет оценок</AlertTitle><AlertDescription>Еще не было выставлено ни одной оценки за юниты.</AlertDescription></Alert>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Ученик</TableHead>
                      <TableHead>Юнит</TableHead>
                      <TableHead className="text-center">Оценка</TableHead>
                      <TableHead>Комментарий</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unitGrades.map(grade => (
                      <TableRow key={grade.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(grade.date), 'dd.MM.yy HH:mm', { locale: ru })}</TableCell>
                        <TableCell>{grade.studentName || students.find(s => s.id === grade.studentId)?.name || grade.studentId}</TableCell>
                        <TableCell>{grade.unitName || grade.unitId}</TableCell>
                        <TableCell className="text-center">
                           <Badge className={`text-lg font-bold ${grade.grade === 5 ? 'bg-green-500 hover:bg-green-600' : ''} ${grade.grade === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''} ${grade.grade === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''} ${grade.grade === 2 ? 'bg-red-500 hover:bg-red-600' : ''}`}>{grade.grade}</Badge>
                        </TableCell>
                        <TableCell>{grade.notes || '-'}</TableCell>
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
  );
}
