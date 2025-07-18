'use client';

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Send, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface WordTestInputProps {
  word: Word;
  // Callback for regular tests (practice) with immediate feedback
  onAnswer?: (isCorrect: boolean, userAnswer: string) => void;
  // Callback for moving to the next step (used by practice tests)
  onNext?: () => void;
  // Callback for online tests (no immediate feedback)
  onSubmitAnswer?: (userAnswer: string) => void;
  // UI flag for online tests
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOnlineTestMode = !!onSubmitAnswer;

  useEffect(() => {
    // Reset state for the new word
    setUserAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
    setIsPasswordVisible(isOnlineTestMode ? false : isPasswordVisible);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word, isOnlineTestMode]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOnlineTestMode) {
      // ONLINE TEST MODE: Just submit the answer. The parent component handles moving to the next word.
      onSubmitAnswer?.(userAnswer.trim());
    } else {
      // PRACTICE TEST MODE: Check answer and show feedback.
      if (isSubmitted) { // If feedback is already shown, button acts as "Next"
        onNext?.();
      } else {
        const cleanUserAnswer = normalizeAnswer(userAnswer);
        const cleanCorrectAnswer = normalizeAnswer(word.english);
        const correct = cleanUserAnswer === cleanCorrectAnswer;

        setIsCorrect(correct);
        setIsSubmitted(true);
        setIsPasswordVisible(true); // Automatically show answer on submit
        onAnswer?.(correct, userAnswer.trim());
      }
    }
  };
  
  const buttonText = isOnlineTestMode 
    ? (isLastWord ? 'Завершить тест' : 'Дальше') 
    : (isSubmitted ? 'Дальше' : 'Проверить');
  
  const showNextButtonForPractice = isSubmitted && onNext;

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
              type={isPasswordVisible || (isSubmitted && !isOnlineTestMode) ? 'text' : 'password'}
              autoComplete="off"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Введите перевод на английском"
              disabled={isSubmitted && !isOnlineTestMode && !showNextButtonForPractice} // Disable only when showing feedback but not ready for next
              className={`text-lg p-4 h-14 pr-12 ${isSubmitted && !isOnlineTestMode ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}
              aria-label="Поле для ввода перевода"
            />
             <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                aria-label={isPasswordVisible ? "Скрыть ответ" : "Показать ответ"}
                tabIndex={-1}
              >
                {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
          </div>
            <Button type="submit" className="w-full text-lg py-3" size="lg">
              {buttonText}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
        </form>

        {/* This feedback block will ONLY render in practice mode */}
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
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
