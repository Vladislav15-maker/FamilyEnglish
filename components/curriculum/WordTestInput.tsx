'use client';

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Send } from 'lucide-react';

interface WordTestInputProps {
  word: Word;
  onSubmitAnswer: (userAnswer: string) => void;
  isLastWord?: boolean;
}

export default function WordTestInput({ word, onSubmitAnswer, isLastWord = false }: WordTestInputProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const uniqueId = `word-input-${word.id}`;

  useEffect(() => {
    setUserAnswer('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAnswer(userAnswer.trim());
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
              autoComplete="one-time-code"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Введите перевод на английском"
              className="text-lg p-4 h-14"
              aria-label="Поле для ввода перевода"
            />
          </div>
            <Button type="submit" className="w-full text-lg py-3" size="lg">
              {isLastWord ? (
                <>Завершить тест <Send className="ml-2 h-5 w-5" /></>
              ) : (
                <>Дальше <ChevronRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
        </form>

      </CardContent>
    </Card>
  );
}
