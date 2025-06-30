import Link from 'next/link';
import type { Unit, StudentRoundProgress, StudentUnitGrade } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookMarked, ArrowRight, GraduationCap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UnitCardProps {
  unit: Unit;
  progress?: StudentRoundProgress[];
  isRemediation?: boolean;
  unitGrade?: StudentUnitGrade;
}

export default function UnitCard({ unit, progress = [], isRemediation = false, unitGrade }: UnitCardProps) {
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
    progressLabelText = "0%";
    unitStatusText = "В процессе";
  }


  const roundsCountText = totalRoundsInUnit === 1 ? 'раунд' : 
                         (totalRoundsInUnit > 1 && totalRoundsInUnit < 5 ? 'раунда' : 'раундов');

  const gradeColorClass =
    unitGrade?.grade === 5 ? 'text-green-500' :
    unitGrade?.grade === 4 ? 'text-blue-500' :
    unitGrade?.grade === 3 ? 'text-yellow-600' :
    unitGrade?.grade === 2 ? 'text-red-500' :
    '';

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-300 flex flex-col relative overflow-hidden", isRemediation && "border-accent ring-2 ring-accent/50")}>
      {unitGrade && (
        <div className="absolute top-4 right-4 text-center z-10">
          <p className={cn("text-6xl font-bold font-headline drop-shadow-lg", gradeColorClass)}>
            {unitGrade.grade}
          </p>
          {unitGrade.notes && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MessageSquare className="h-4 w-4 mx-auto text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Комментарий учителя:</p>
                  <p>{unitGrade.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 mb-2">
                {isRemediation ? 
                  <GraduationCap className="h-8 w-8 text-accent shrink-0" /> :
                  <BookMarked className="h-8 w-8 text-primary shrink-0" />
                }
                <CardTitle className="text-2xl font-headline pr-12">{unit.name}</CardTitle>
            </div>
        </div>
        <CardDescription>{totalRoundsInUnit} {roundsCountText}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Прогресс (средний балл по завершенным)</span>
            <span>{progressLabelText}</span>
          </div>
          <Progress value={displayProgressPercentage} aria-label={`Средний балл по юниту ${unit.name}: ${displayProgressPercentage}%`} className={cn(isRemediation && "[&>div]:bg-accent")} />
          <p className="text-xs text-muted-foreground text-center mt-1">Статус: {unitStatusText}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className={cn("w-full", isRemediation ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground")}>
          <Link href={`/dashboard/units/${unit.id}`}>
            Перейти к юниту
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
