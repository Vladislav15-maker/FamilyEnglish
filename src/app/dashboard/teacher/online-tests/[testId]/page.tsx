'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { OnlineTest, OnlineTestResult, User, Word } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  BookOpen,
  TestTube2,
  Check,
  X,
  MoreHorizontal,
  FileText,
  User as UserIcon,
  HelpCircle,
  CheckCircle,
  XCircle,
  Timer,
  Edit,
} from 'lucide-react';
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
import GradeOnlineTestDialog from '@/components/teacher/GradeOnlineTestDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


type TestDetailsWithResults = {
  testDetails: OnlineTest;
  results: (OnlineTestResult & { studentName: string; })[];
};

function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function TeacherOnlineTestResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const testId = typeof params.testId === 'string' ? params.testId : '';

  const [data, setData] = useState<TestDetailsWithResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [resultToGrade, setResultToGrade] = useState<(OnlineTestResult & { studentName: string; }) | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teacher/online-tests/${testId}/results`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить результаты теста');
      }
      const jsonData: TestDetailsWithResults = await response.json();
      // Sort results: pending ones first, then by date
      jsonData.results.sort((a, b) => {
          if (a.completedAt === null && b.completedAt !== null) return 1;
          if (a.completedAt !== null && b.completedAt === null) return -1;
          if (a.isPassed === null && b.isPassed !== null) return -1;
          if (a.isPassed !== null && b.isPassed === null) return 1;
          if (a.completedAt && b.completedAt) {
              return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
          }
          return 0;
      });
      setData(jsonData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchData();
    }
  }, [user, fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка Загрузки</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user || user.role !== 'teacher') {
    return <Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только учителю.</AlertDescription></Alert>;
  }

  if (!data) {
    return <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет данных</AlertTitle><AlertDescription>Не удалось найти информацию по этому тесту.</AlertDescription></Alert>;
  }

  return (
    <>
      <div className="space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><Link href="/dashboard/teacher/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{data.testDetails.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center space-x-3">
          <TestTube2 className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold font-headline">{data.testDetails.name}</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Результаты Учеников</CardTitle>
            <CardDescription>Список всех учеников и их результаты по данному тесту.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead className="text-center">Результат (%)</TableHead>
                  <TableHead className="text-center">Время</TableHead>
                  <TableHead className="text-center">Оценка</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">Учеников нет или они еще не сдавали тест.</TableCell></TableRow>
                ) : (
                  data.results.map(result => (
                    <TableRow key={result.id} className={result.isPassed === null && result.completedAt ? "bg-yellow-500/10" : ""}>
                      <TableCell className="font-medium">
                        <p>{result.studentName}</p>
                        {result.completedAt && <p className="text-xs text-muted-foreground">{format(new Date(result.completedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>}
                      </TableCell>
                      <TableCell className="text-center font-mono text-lg">{result.score !== null ? `${result.score}%` : 'N/A'}</TableCell>
                      <TableCell className="text-center font-mono">
                        {result.completedAt ? formatDuration(result.durationSeconds) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.grade ? (
                            <Badge className="text-lg font-bold">{result.grade}</Badge>
                        ) : result.completedAt ? (<Badge variant="secondary">Нет</Badge>) : '-'}
                      </TableCell>
                       <TableCell className="text-center">
                        {result.isPassed === true && <Badge className="bg-green-500 hover:bg-green-600"><Check className="mr-1 h-4 w-4" />Сдано</Badge>}
                        {result.isPassed === false && <Badge variant="destructive"><X className="mr-1 h-4 w-4" />Не сдано</Badge>}
                        {result.isPassed === null && result.completedAt && <Badge variant="secondary">На проверке</Badge>}
                        {!result.completedAt && <Badge variant="outline">Не сдавал</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                         <Button variant="outline" size="sm" onClick={() => setResultToGrade(result)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {result.completedAt ? (result.isPassed === null ? 'Проверить' : 'Изменить') : 'Оценить'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {resultToGrade && (
        <GradeOnlineTestDialog
          result={resultToGrade}
          testDetails={data.testDetails}
          isOpen={!!resultToGrade}
          onClose={() => setResultToGrade(null)}
          onGraded={() => {
            setResultToGrade(null);
            fetchData();
          }}
        />
      )}
    </>
  );
}
