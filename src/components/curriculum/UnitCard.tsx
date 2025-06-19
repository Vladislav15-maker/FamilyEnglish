import Link from 'next/link';
import type { Unit, StudentRoundProgress } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookMarked, ArrowRight } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  progress?: StudentRoundProgress[]; // Progress for all rounds in this unit for a specific student
}

export default function UnitCard({ unit, progress = [] }: UnitCardProps) {
  const totalRoundsInUnit = unit.rounds.length;
  
  const completedRoundsInUnit = progress.filter(p => p.unitId === unit.id && p.completed);
  const attemptedRoundsInUnit = progress.filter(p => p.unitId === unit.id && (p.attempts?.length > 0 || p.completed));


  let displayProgressPercentage = 0;
  let progressLabelText = "0%";
  let unitStatusText = "Не начат";

  if (totalRoundsInUnit === 0) {
    progressLabelText = "Нет раундов";
    unitStatusText = "Нет раундов";
  } else if (completedRoundsInUnit.length > 0) {
    const sumOfScores = completedRoundsInUnit.reduce((sum, p) => sum + p.score, 0);
    displayProgressPercentage = Math.round(sumOfScores / completedRoundsInUnit.length);
    progressLabelText = `${displayProgressPercentage}%`;
    if (completedRoundsInUnit.length === totalRoundsInUnit) {
        unitStatusText = `Завершен (${displayProgressPercentage}%)`;
    } else {
        unitStatusText = `В процессе (${displayProgressPercentage}%)`;
    }
  } else if (attemptedRoundsInUnit.length > 0) {
    // Если есть попытки, но ни один раунд не завершен, средний балл 0, но статус "В процессе"
    progressLabelText = "0%";
    unitStatusText = "В процессе";
  }


  const roundsCountText = totalRoundsInUnit === 1 ? 'раунд' : 
                         (totalRoundsInUnit > 1 && totalRoundsInUnit < 5 ? 'раунда' : 'раундов');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
            <BookMarked className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-headline">{unit.name}</CardTitle>
        </div>
        <CardDescription>{totalRoundsInUnit} {roundsCountText}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Прогресс (средний балл по завершенным)</span>
            <span>{progressLabelText}</span>
          </div>
          <Progress value={displayProgressPercentage} aria-label={`Средний балл по юниту ${unit.name}: ${displayProgressPercentage}%`} />
          <p className="text-xs text-muted-foreground text-center mt-1">Статус: {unitStatusText}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/dashboard/units/${unit.id}`}>
            Перейти к юниту
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
