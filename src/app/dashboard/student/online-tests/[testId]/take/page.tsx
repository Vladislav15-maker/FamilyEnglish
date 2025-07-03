'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WordTestInput from '@/components/curriculum/WordTestInput';
import { getOnlineTestById } from '@/lib/curriculum-data';
import type { OnlineTest, Word, OnlineTestResult, AuthenticatedUser } from '@/lib/types';
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

  const [existingResult, setExistingResult] = useState<OnlineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to hold the latest state for the unload handler
  const stateRef = useRef({
    isTestFinished: false,
    isSubmitting: false,
    attempts: [] as Attempt[],
    timeRemaining: 0,
    test: null as OnlineTest | null,
    user: null as AuthenticatedUser | null,
  });

  // Keep the ref updated with the latest state on every render
  useEffect(() => {
    stateRef.current = {
      isTestFinished,
      isSubmitting,
      attempts,
      timeRemaining,
      test,
      user,
    };
  });


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (testId && user) {
      setIsLoading(true);
      setError(null);
      setExistingResult(null);

      fetch('/api/student/online-tests')
        .then(res => {
          if (!res.ok) throw new Error("Не удалось проверить статус теста.");
          return res.json();
        })
        .then((testsWithStatus: (OnlineTest & { lastResult: OnlineTestResult | null })[]) => {
          const currentTestStatus = testsWithStatus.find(t => t.id === testId);
          if (currentTestStatus?.lastResult) {
            setExistingResult(currentTestStatus.lastResult);
          } else {
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
        setIsLoading(false);
    }
  }, [testId, user]);

  useEffect(() => {
    if (!test || isTestFinished || existingResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining <= 0 && !isTestFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTestFinished(true);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, timeRemaining, isTestFinished, existingResult]);

  // Effect for normal submission when test is finished
  useEffect(() => {
    if (isTestFinished && !isSubmitting && user && test) {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const finalAnswers = test.words.map(word => {
        const attempt = attempts.find(a => a.wordId === word.id);
        if (attempt) {
          return attempt;
        }
        return { wordId: word.id, userAnswer: '', correct: false };
      });

      const correctAnswers = finalAnswers.filter(a => a.correct).length;
      const score = test.words.length > 0 ? Math.round((correctAnswers / test.words.length) * 100) : 0;
      const durationSeconds = (test.durationMinutes * 60) - timeRemaining;

      const payload = {
        onlineTestId: test.id,
        score,
        answers: finalAnswers,
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
          setIsSubmitting(false); // Only reset if submission fails, otherwise component unmounts
          setIsTestFinished(false);
      });
    }
  }, [isTestFinished, attempts, user, test, router, toast, isSubmitting, timeRemaining]);


  // Effect to handle component unmount (leaving the page)
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts.
      // We read the latest state from the ref.
      const { isTestFinished, isSubmitting, test, user, attempts, timeRemaining } = stateRef.current;
      
      // If the test was in progress and not already being submitted, submit it.
      if (!isTestFinished && !isSubmitting && test && user) {
        
        const finalAnswers = test.words.map(word => {
          const attempt = attempts.find(a => a.wordId === word.id);
          return attempt || { wordId: word.id, userAnswer: '', correct: false };
        });

        const correctAnswers = finalAnswers.filter(a => a.correct).length;
        const score = test.words.length > 0 ? Math.round((correctAnswers / test.words.length) * 100) : 0;
        const durationSeconds = (test.durationMinutes * 60) - timeRemaining;

        const payload = {
          onlineTestId: test.id,
          score,
          answers: finalAnswers,
          durationSeconds,
        };
        
        // Use fetch with keepalive to ensure the request is sent even if the page is closed.
        // This is a "fire-and-forget" request. We won't get a response.
        fetch('/api/student/online-tests/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        });
      }
    };
  }, []); // Empty dependency array ensures this effect runs only on mount and unmount


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
    // This state might be briefly visible if submission fails.
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
          key={currentWord.id + '-' + currentWordIndex}
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
