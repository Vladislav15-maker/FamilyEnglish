'use client';

import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface WordMultipleChoiceProps {
  word: Word;
  options: Word[]; // Array of 3 words: one correct, two incorrect
  onAnswer: (isCorrect: boolean, chosenAnswer: string) => void;
}

export default function WordMultipleChoice({ word, options, onAnswer }: WordMultipleChoiceProps) {
  const [shuffledOptions, setShuffledOptions] = useState<Word[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setShuffledOptions([...options].sort(() => Math.random() - 0.5));
    setSelectedAnswer(null);
    setIsSubmitted(false);
  }, [options]);

  const handleOptionClick = (chosenWord: Word) => {
    if (isSubmitted) return;
    
    const isCorrect = chosenWord.id === word.id;
    setSelectedAnswer(chosenWord.russian);
    setIsSubmitted(true);
    
    // Give feedback, then automatically proceed after a delay.
    setTimeout(() => {
        onAnswer(isCorrect, chosenWord.russian);
    }, 1000);
  };

  const getButtonClass = (option: Word) => {
    if (!isSubmitted) return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    if (option.id === word.id) return 'bg-green-500 hover:bg-green-600 text-white';
    if (option.russian === selectedAnswer) return 'bg-red-500 hover:bg-red-600 text-white';
    return 'bg-secondary text-secondary-foreground opacity-50';
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary">Выберите правильный перевод</CardTitle>
        <CardDescription className="text-muted-foreground">Какое из этих слов означает:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-secondary/30 rounded-lg text-center">
          <p className="text-4xl font-bold text-secondary-foreground font-body my-2">{word.english}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {shuffledOptions.map((option) => (
            <Button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              disabled={isSubmitted}
              className={cn("w-full text-lg h-14 transition-all duration-300", getButtonClass(option))}
              size="lg"
            >
              {option.russian}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
