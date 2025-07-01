'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WordTestInput from '@/components/curriculum/WordTestInput';
import { getOnlineTestById } from '@/lib/curriculum-data';
import type { OnlineTest, Word, OnlineTestResult } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, ThumbsUp, Repeat, ChevronLeft, Loader2, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type Attempt = { wordId: string; userAnswer: string; correct: boolean };

export default function OnlineTestTakePage() {
  const params = useParams();
  const router = useRouter();
  const testId = typeof params.testId === 'string' ? params.testId : '';
  
  const { user } = useAuth();
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [test, setTest] = useState<OnlineTest | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // New state to handle logic for tests already taken
  const [existingResult, setExistingResult] = useState<OnlineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Initial Setup & Pre-test Check ---
  useEffect(() => {
    if (testId && user) {
      setIsLoading(true);
      setError(null);
      setExistingResult(null);

      // Check for an existing result first
      fetch('/api/student/online-tests')
        .then(res => {
          if (!res.ok) throw new Error("Не удалось проверить статус теста.");
          return res.json();
        })
        .then((testsWithStatus: (OnlineTest & { lastResult: OnlineTestResult | null })[]) => {
          const currentTestStatus = testsWithStatus.find(t => t.id === testId);
          if (currentTestStatus?.lastResult) {
            // Test already taken, store result for redirect/message
            setExistingResult(currentTestStatus.lastResult);
          } else {
            // Test not taken, set it up for taking
            const testData = getOnlineTestById(testId);
            if (testData) {
              setTest(testData);
              setShuffledWords([...testData.words].sort(() => Math.random() - 0.5));
              setTimeRemaining(testData.durationMinutes * 60);
            } else {
              setError("Тест с таким ID не найден.");
            }
          }
        })
        .catch(err => {
          console.error("Failed to setup test:", err);
          setError((err as Error).message);
        })
        .finally(() => {
          setIsLoading(false);
        });

    } else if (!user) {
        setIsLoading(false); // If there's no user, stop loading
    }
  }, [testId, user]);

  // --- Timer Logic ---
  useEffect(() => {
    // Guard clause: Don't run timer logic if the test isn't set up, is already finished, or an existing result was found.
    if (!test || isTestFinished || existingResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining <= 0 && !isTestFinished) {
      // Time's up! Force finish.
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTestFinished(true); // Trigger submission useEffect
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, timeRemaining, isTestFinished, existingResult]);

  // --- Test Submission Logic (useEffect driven) ---
  useEffect(() => {
    if (isTestFinished && !isSubmitting && user && test) {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const correctAnswers = attempts.filter(a => a.correct).length;
      const score = test.words.length > 0 ? Math.round((correctAnswers / test.words.length) * 100) : 0;
      const durationSeconds = (test.durationMinutes * 60) - timeRemaining;

      const payload = {
        onlineTestId: test.id,
        score,
        answers: attempts,
        durationSeconds,
      };

      fetch('/api/student/online-tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(async (response) => {
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Не удалось сохранить результат теста.');
          }
          return response.json();
      })
      .then((savedResult: OnlineTestResult) => {
          toast({ title: "Тест завершен!", description: `Ваш результат сохранен.` });
          router.push(`/dashboard/student/online-tests`);
      })
      .catch((error) => {
          console.error("[OnlineTest] Failed to save result:", error);
          toast({ title: "Ошибка", description: (error as Error).message, variant: "destructive" });
          setIsSubmitting(false); // Allow retry if submission fails
          setIsTestFinished(false);
      });
    }
  }, [isTestFinished, attempts, user, test, router, toast, isSubmitting, timeRemaining]);

  const handleAnswerSubmit = (isCorrect: boolean, userAnswer: string) => {
    if (!test || !shuffledWords[currentWordIndex]) return;
    const newAttempt: Attempt = {
      wordId: shuffledWords[currentWordIndex].id,
      userAnswer,
      correct: isCorrect,
    };
    setAttempts(prev => [...prev, newAttempt]);
  };

  const proceedToNextStep = () => {
    if (currentWordIndex < shuffledWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setIsTestFinished(true);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (error) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user) {
     return <Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите в систему.</AlertDescription></Alert>;
  }

  // New guard clause for already taken tests
  if (existingResult) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
            <Breadcrumb className="w-full max-w-2xl">
              <BreadcrumbList>
                <BreadcrumbItem><Link href="/dashboard/student/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Тест: {getOnlineTestById(testId)?.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Тест уже пройден</AlertTitle>
                <AlertDescription>
                    Вы уже прошли этот тест и не можете пройти его снова.
                </AlertDescription>
                <div className="mt-4 flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/student/online-tests">
                           К списку тестов
                        </Link>
                    </Button>
                </div>
            </Alert>
        </div>
    );
  }

  if (!test) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Тест не найден</AlertTitle></Alert>;
  }

  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = shuffledWords.length > 0 ? ((currentWordIndex) / shuffledWords.length) * 100 : 0;

  if (isTestFinished && isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Завершаем тест и сохраняем результаты...</p>
        </div>
      )
  }
  
  if (isTestFinished && !isSubmitting) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <p className="text-xl text-muted-foreground">Неожиданное состояние. Попробуйте обновить страницу.</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
       <Breadcrumb className="w-full max-w-2xl">
          <BreadcrumbList>
            <BreadcrumbItem><Link href="/dashboard/student/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Тест: {test.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary">{test.name}</h2>
          <div className="flex items-center gap-2 font-mono font-semibold text-lg text-destructive">
            <Timer className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 mb-6" />
      </div>

      {currentWord ? (
        <WordTestInput 
          word={currentWord} 
          onAnswer={handleAnswerSubmit} 
          showNextButton={true}
          onNext={proceedToNextStep}
        />
      ) : (
        <p>Загрузка слова...</p>
      )}
    </div>
  );
}
