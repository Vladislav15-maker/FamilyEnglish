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
import { AlertCircle, BookOpen, Loader2, Timer, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type Attempt = { wordId: string; userAnswer: string; };

export default function OnlineTestTakePage() {
  const params = useParams();
  const router = useRouter();
  const testId = (params.testId || params.testid) as string | undefined;
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [test, setTest] = useState<OnlineTest | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // State flags
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Used to show loader and disable UI
  const [isFinished, setIsFinished] = useState(false); // Set to true only AFTER a successful submission to prevent re-submission
  const [existingResult, setExistingResult] = useState<OnlineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ref to hold the latest state for the unload handler
  const stateRef = useRef({ attempts, timeRemaining, test, user, isSubmitting, isFinished, existingResult });
  useEffect(() => {
    stateRef.current = { attempts, timeRemaining, test, user, isSubmitting, isFinished, existingResult };
  }, [attempts, timeRemaining, test, user, isSubmitting, isFinished, existingResult]);


  const submitTest = useCallback(async () => {
    // Prevent multiple submissions
    if (stateRef.current.isSubmitting || stateRef.current.isFinished) {
      return;
    }
    
    setIsSubmitting(true);
    toast({ title: "Завершение теста...", description: "Отправляем ваши ответы на проверку." });

    const { test, user, attempts, timeRemaining } = stateRef.current;

    if (!user || !test) {
      setIsSubmitting(false);
      toast({ title: "Ошибка", description: "Недостаточно данных для отправки теста.", variant: "destructive" });
      return;
    }

    const allWordsAnswers = test.words.map(word => {
        const attempt = attempts.find(a => a.wordId === word.id);
        return attempt || { wordId: word.id, userAnswer: '' };
    });
    const durationSeconds = test.durationMinutes > 0 ? (test.durationMinutes * 60) - timeRemaining : 0;
    const payload = {
        onlineTestId: test.id,
        answers: allWordsAnswers,
        durationSeconds,
    };

    try {
        const response = await fetch('/api/student/online-tests/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'Не удалось отправить тест.');
        }
        
        toast({ title: "Тест отправлен!", description: "Ваши ответы отправлены учителю на проверку." });
        setIsFinished(true); // Mark as finished to prevent unload handler from firing
        router.push(`/dashboard/student/online-tests`);

    } catch (err) {
        console.error("[OnlineTest] Failed to save result:", err);
        toast({ title: "Ошибка", description: (err as Error).message, variant: "destructive" });
        setIsSubmitting(false); // Allow re-submission on error
    }
  }, [router, toast]);

  // Effect to load initial data
  useEffect(() => {
    if (testId && user) {
      setIsLoading(true);
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
              if(testData.durationMinutes > 0) {
                setTimeRemaining(testData.durationMinutes * 60);
              }
            } else {
              setError("Тест с таким ID не найден.");
            }
          }
        })
        .catch(err => {
          console.error("Failed to setup test:", err);
          setError((err as Error).message);
        })
        .finally(() => setIsLoading(false));

    } else if (!user) {
        setIsLoading(false);
    }
  }, [testId, user]);


  // Effect for the timer
  useEffect(() => {
    if (isFinished || isSubmitting || !test || test.durationMinutes <= 0 || existingResult) {
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, isSubmitting, isFinished, existingResult, submitTest]);


  // Effect for the unload handler (safety net)
  useEffect(() => {
    const handleUnload = () => {
      // Use ref to get the absolute latest state
      const { test, user, isSubmitting, isFinished, existingResult, attempts, timeRemaining } = stateRef.current;
      
      // Do not run if: there is already a result from a previous session, 
      // the test is already finished/submitted via normal flow,
      // a graceful submission is already in progress, or no data.
      if (existingResult || isFinished || isSubmitting || !test || !user) {
        return;
      }
      
      const allWordsAnswers = test.words.map(word => {
        const attempt = attempts.find(a => a.wordId === word.id);
        return { wordId: word.id, userAnswer: attempt?.userAnswer || '' };
      });
      const durationSeconds = test.durationMinutes > 0 ? (test.durationMinutes * 60) - timeRemaining : 0;
      const payload = {
        onlineTestId: test.id,
        answers: allWordsAnswers,
        durationSeconds,
      };
      
      // Use fetch with keepalive: true. This is the most reliable method for unload events.
      fetch('/api/student/online-tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    };
    
    window.addEventListener('pagehide', handleUnload);
    
    return () => {
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []); // Correctly empty, uses ref for state

  const handleWordSubmit = (userAnswer: string) => {
    if (!test || !shuffledWords[currentWordIndex]) return;

    const newAttempt: Attempt = {
      wordId: shuffledWords[currentWordIndex].id,
      userAnswer,
    };
    
    setAttempts(prev => {
        const otherAttempts = prev.filter(a => a.wordId !== newAttempt.wordId);
        return [...otherAttempts, newAttempt];
    });

    if (currentWordIndex < shuffledWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      submitTest();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (error) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user) {
     return <Alert variant="default"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите в систему.</AlertDescription></Alert>;
  }

  if (existingResult) {
    const isPending = existingResult.isPassed === null;
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
            <Breadcrumb className="w-full max-w-2xl">
              <BreadcrumbList>
                <BreadcrumbItem><Link href="/dashboard/student/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Тест: {getOnlineTestById(testId || '')?.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Тест уже {isPending ? 'отправлен на проверку' : 'пройден'}</AlertTitle>
                <AlertDescription>
                    Вы уже отправляли этот тест и не можете пройти его снова. 
                    {isPending ? ' Ожидайте результатов проверки от учителя.' : ' Вы можете посмотреть свои результаты.'}
                </AlertDescription>
                <div className="mt-4 flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/student/online-tests">
                           К списку тестов
                        </Link>
                    </Button>
                    {!isPending && existingResult.id && (
                       <Button asChild>
                           <Link href={`/dashboard/student/online-tests/${testId}/result/${existingResult.id}`}>
                               Посмотреть результат
                           </Link>
                       </Button>
                    )}
                </div>
            </Alert>
        </div>
    );
  }

  if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Отправляем тест на проверку...</p>
        </div>
      )
  }

  if (!test) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Тест не найден</AlertTitle></Alert>;
  }

  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = shuffledWords.length > 0 ? ((currentWordIndex) / shuffledWords.length) * 100 : 0;

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
          {test.durationMinutes > 0 && (
            <div className="flex items-center gap-2 font-mono font-semibold text-lg text-destructive">
                <Timer className="h-5 w-5" />
                {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        <Progress value={progressPercentage} className="w-full h-2 mb-6" />
      </div>

      {currentWord ? (
        <WordTestInput 
          key={currentWord.id}
          word={currentWord} 
          onSubmitAnswer={handleWordSubmit}
          isLastWord={currentWordIndex === shuffledWords.length - 1}
        />
      ) : (
        <p>Загрузка слова...</p>
      )}
    </div>
  );
}
