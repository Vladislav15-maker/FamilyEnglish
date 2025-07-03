'use client';

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Send, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface WordTestInputProps {
  word: Word;
  // Callback for regular tests with immediate feedback
  onAnswer?: (isCorrect: boolean, userAnswer: string) => void;
  // Callback for moving to the next step (used by both test types)
  onNext?: () => void;
  // Callback for online tests (no immediate feedback)
  onSubmitAnswer?: (userAnswer: string) => void;
  // UI flags
  isLastWord?: boolean;
}

// Function to normalize answers for comparison
function normalizeAnswer(answer: string): string {
  if (typeof answer !== 'string') return '';
  return answer.trim().toLowerCase().replace(/[`’]/g, "'");
}

export default function WordTestInput({ 
  word, 
  onAnswer, 
  onNext,
  onSubmitAnswer, 
  isLastWord = false 
}: WordTestInputProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine the mode based on which callback is provided
  const isOnlineTestMode = !!onSubmitAnswer;
  const uniqueId = `word-input-${word.id}`;

  useEffect(() => {
    // Reset state for the new word
    setUserAnswer('');
    setIsSubmitted(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOnlineTestMode) {
      // Online test: just submit the answer and the parent component handles the rest.
      onSubmitAnswer(userAnswer.trim());
    } else {
      // Regular test with immediate feedback
      if (isSubmitted) { // If feedback is already shown, button acts as "Next"
        onNext?.();
        return;
      }
      
      const cleanUserAnswer = normalizeAnswer(userAnswer);
      const cleanCorrectAnswer = normalizeAnswer(word.english);
      const correct = cleanUserAnswer === cleanCorrectAnswer;

      setIsCorrect(correct);
      setIsSubmitted(true);
      onAnswer?.(correct, userAnswer.trim());
    }
  };
  
  const handleRetryInternal = () => {
    setUserAnswer('');
    setIsSubmitted(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary">Тест: Переведите слово</CardTitle>
        <CardDescription className="text-muted-foreground">Напишите английский перевод для русского слова.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-secondary/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Русское слово:</p>
          <p className="text-4xl font-bold text-secondary-foreground font-body my-2">{word.russian}</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
           <div className="relative">
            <Input
              ref={inputRef}
              id={uniqueId}
              name={uniqueId}
              type="text"
              autoComplete="one-time-code" // Helps prevent browser autofill
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Введите перевод на английском"
              disabled={isSubmitted && !isOnlineTestMode} // Disable only for regular tests after submission
              className={`text-lg p-4 h-14 ${isSubmitted && !isOnlineTestMode ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}
              aria-label="Поле для ввода перевода"
            />
          </div>
            <Button type="submit" className="w-full text-lg py-3" size="lg">
              {isOnlineTestMode 
                ? (isLastWord ? 'Завершить тест' : 'Дальше') 
                : (isSubmitted ? 'Дальше' : 'Проверить')}
              {isLastWord && isOnlineTestMode && <Send className="ml-2 h-5 w-5" />}
              {!isLastWord && isOnlineTestMode && <ChevronRight className="ml-2 h-5 w-5" />}
              {!isOnlineTestMode && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
        </form>

        {!isOnlineTestMode && isSubmitted && (
          <div className={`p-4 rounded-md text-center ${isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {isCorrect ? (
              <div className="flex items-center justify-center text-green-700 dark:text-green-300">
                <CheckCircle className="h-8 w-8 mr-3" />
                <p className="text-xl font-semibold">Правильно!</p>
              </div>
            ) : (
              <div className="text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-center justify-center">
                  <XCircle className="h-8 w-8 mr-3" />
                  <p className="text-xl font-semibold">Неправильно.</p>
                </div>
                <p className="text-md">Ваш ответ: <span className="font-mono">{userAnswer || "(пусто)"}</span></p>
                <p className="text-md">Правильный ответ: <span className="font-semibold font-mono">{word.english}</span></p>
                {!onNext && ( // Show retry only if it's a single-word practice (no onNext)
                  <Button onClick={handleRetryInternal} variant="outline" size="sm" className="mt-2">
                    <RotateCcw className="mr-2 h-4 w-4" /> Попробовать еще раз
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
