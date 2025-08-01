'use client';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnlineTestResult, OnlineTest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const gradingFormSchema = z.object({
  answers: z.array(z.object({
    wordId: z.string(),
    userAnswer: z.string(),
    correct: z.boolean({ required_error: "Обязательно отметьте" }),
  })).optional(),
  grade: z.coerce.number().min(2, "Оценка от 2 до 5").max(5, "Оценка от 2 до 5"),
  teacherNotes: z.string().optional(),
  isPassed: z.boolean(),
});

type GradingFormValues = z.infer<typeof gradingFormSchema>;

interface GradeOnlineTestDialogProps {
  result: OnlineTestResult & { studentName: string };
  testDetails: OnlineTest;
  isOpen: boolean;
  onClose: () => void;
  onGraded: () => void;
}

export default function GradeOnlineTestDialog({ result, testDetails, isOpen, onClose, onGraded }: GradeOnlineTestDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isNewSubmission = !result.completedAt;

  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      answers: result.answers?.map(a => ({
        ...a,
        correct: a.correct ?? false
      })) || [],
      grade: result.grade || undefined,
      teacherNotes: result.teacherNotes || '',
      isPassed: result.isPassed ?? false,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "answers"
  });

  const watchedAnswers = form.watch('answers');
  const correctCount = watchedAnswers?.filter(a => a.correct).length || 0;
  const totalCount = isNewSubmission ? 0 : result.answers.length;
  const currentScore = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  
  const onSubmit = async (data: GradingFormValues) => {
    setIsLoading(true);
    
    const payload = { 
        ...data, 
        score: isNewSubmission ? 0 : currentScore,
        answers: isNewSubmission ? [] : data.answers,
        onlineTestId: result.onlineTestId // Pass test ID for creation case
    };

    try {
      const response = await fetch(`/api/teacher/online-tests/results/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить оценку.');
      }
      toast({ title: 'Успех', description: `Оценка для ученика ${result.studentName} сохранена.` });
      onGraded();
    } catch (error) {
      toast({ title: 'Ошибка', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Проверка теста: {result.studentName}</DialogTitle>
          <DialogDescription>
            Тест: {testDetails.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {isNewSubmission ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Тест не сдан</AlertTitle>
                    <AlertDescription>Ученик не начинал этот тест. Вы можете выставить оценку за несданную работу.</AlertDescription>
                </Alert>
            ) : (
                <ScrollArea className="h-[50vh] border rounded-md p-4">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[25%]">Слово</TableHead>
                        <TableHead className="w-[25%]">Правильный ответ</TableHead>
                        <TableHead className="w-[25%]">Ответ ученика</TableHead>
                        <TableHead className="text-center w-[25%]">Результат</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {fields.map((field, index) => {
                        const wordInfo = testDetails.words.find(w => w.id === field.wordId);
                        return (
                        <TableRow key={field.id} className={form.getValues(`answers.${index}.correct`) ? 'bg-green-500/10' : 'bg-red-500/10'}>
                            <TableCell>{wordInfo?.russian}</TableCell>
                            <TableCell className="font-mono text-green-600 dark:text-green-400">{wordInfo?.english}</TableCell>
                            <TableCell className="font-mono">{field.userAnswer || '(пусто)'}</TableCell>
                            <TableCell className="text-center">
                            <FormField
                                control={form.control}
                                name={`answers.${index}.correct`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Отметить как правильный" />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            </TableCell>
                        </TableRow>
                        )
                    })}
                    </TableBody>
                </Table>
                </ScrollArea>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-4">
                <div className="md:col-span-1 space-y-4">
                     {!isNewSubmission && (
                        <Card>
                            <CardHeader className="p-4"><CardTitle>Итог</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-4xl font-bold text-primary">{currentScore}%</p>
                                <p className="text-sm text-muted-foreground">Правильно: {correctCount} из {totalCount}</p>
                            </CardContent>
                        </Card>
                     )}
                     <FormField
                        control={form.control}
                        name="isPassed"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel className="text-base">Тест сдан?</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                </div>
                <div className="md:col-span-2 space-y-4">
                    <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                        <FormItem className="rounded-lg border p-4"><FormLabel>Итоговая оценка</FormLabel><FormControl><RadioGroup onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()} className="flex space-x-4 pt-2">{[5, 4, 3, 2].map(val => (<FormItem key={val} className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value={val.toString()} /></FormControl><FormLabel className="font-normal text-lg">{val}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="teacherNotes"
                    render={({ field }) => (
                        <FormItem><FormLabel>Комментарий (необязательно)</FormLabel><FormControl><Textarea placeholder="Добавьте комментарий..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}
                    />
                </div>
            </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Отмена</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Сохранить оценку'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
