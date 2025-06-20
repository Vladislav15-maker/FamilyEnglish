'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User, Unit } from '@/lib/types';
import { curriculum } from '@/lib/curriculum-data';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Check, Edit, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const unitGradeSchema = z.object({
  studentId: z.string().min(1, "Выберите ученика"),
  unitId: z.string().min(1, "Выберите юнит"),
  grade: z.coerce.number().min(2, "Оценка должна быть от 2 до 5").max(5, "Оценка должна быть от 2 до 5"),
  notes: z.string().optional(),
});

type UnitGradeFormValues = z.infer<typeof unitGradeSchema>;

interface UnitGradeFormProps {
  students: User[];
  onGradeAdded?: () => void; 
}

export default function UnitGradeForm({ students, onGradeAdded }: UnitGradeFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<UnitGradeFormValues>({
    resolver: zodResolver(unitGradeSchema),
    defaultValues: {
      studentId: '',
      unitId: '',
      grade: undefined, 
      notes: '',
    },
  });

  const onSubmit = async (data: UnitGradeFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teacher/unit-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Неизвестная ошибка сервера" }));
        throw new Error(errorData.error?.message || errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const newGrade = await response.json();
      toast({
        title: 'Оценка за юнит добавлена',
        description: `Оценка ${newGrade.grade} для ученика по юниту успешно сохранена.`,
        variant: 'default'
      });
      form.reset();
      onGradeAdded?.();
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: (error as Error).message || 'Не удалось сохранить оценку. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
      console.error("Failed to add unit grade via API:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (students.length === 0) {
    return (
        <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
                <div className="flex items-center space-x-3">
                    <Edit className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Добавить Оценку за Юнит</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Нет учеников</AlertTitle>
                    <AlertDescription>
                    Для выставления оценок за юниты в системе должны быть зарегистрированы ученики.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }
  
  if (curriculum.length === 0) {
     return (
        <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
                <div className="flex items-center space-x-3">
                    <Edit className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Добавить Оценку за Юнит</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Нет юнитов</AlertTitle>
                    <AlertDescription>
                    В системе нет учебных юнитов для выставления оценок.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
            <Edit className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Добавить Оценку за Юнит</CardTitle>
        </div>
        <CardDescription>Выберите ученика, юнит и выставьте оценку.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ученик</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ученика" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Юнит</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите юнит" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {curriculum.map((unit: Unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Оценка</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      className="flex space-x-4"
                    >
                      {[5, 4, 3, 2].map(val => (
                        <FormItem key={val} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={val.toString()} />
                          </FormControl>
                          <FormLabel className="font-normal text-lg">{val}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Добавьте комментарий к оценке..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить оценку за юнит'}
              {!isLoading && <Check className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
