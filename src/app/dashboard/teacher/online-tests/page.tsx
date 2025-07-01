'use client';

import { useAuth } from '@/context/AuthContext';
import { ONLINE_TESTS } from '@/lib/curriculum-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TestTube2, AlertCircle, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeacherOnlineTestsListPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'teacher') {
    return <Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только для учителей.</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <TestTube2 className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Управление Онлайн Тестами</h1>
      </div>

      {ONLINE_TESTS.length === 0 ? (
        <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Нет Онлайн Тестов</AlertTitle><AlertDescription>В системе не определено ни одного онлайн теста. Их можно добавить в `src/lib/curriculum-data.ts`</AlertDescription></Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ONLINE_TESTS.map(test => (
            <Card key={test.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{test.name}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground">{test.words.length} слов, {test.durationMinutes} мин. на выполнение</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/teacher/online-tests/${test.id}`}>
                    Посмотреть результаты <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

