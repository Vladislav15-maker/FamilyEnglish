// src/app/dashboard/teacher/groups/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, PlusCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ManageGroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetch('/api/teacher/students')
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          setError(null);
        })
        .catch(() => setError('Не удалось загрузить список учеников.'))
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedStudents.length === 0) {
      toast({
        title: 'Ошибка валидации',
        description: 'Пожалуйста, введите название группы и выберите хотя бы одного ученика.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, memberIds: selectedStudents }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать группу.');
      }

      toast({
        title: 'Группа создана!',
        description: `Группа "${groupName}" успешно создана.`,
      });
      setGroupName('');
      setSelectedStudents([]);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (user?.role !== 'teacher') {
      return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только учителям.</AlertDescription></Alert>
  }
  
  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center space-x-3">
        <PlusCircle className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Управление группами чата</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Создать новую группу</CardTitle>
          <CardDescription>Создайте группу и добавьте в нее учеников для общения в чате.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="groupName" className="font-medium">Название группы</label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Например, 10-А класс"
              />
            </div>
            <div className="space-y-2">
               <label className="font-medium">Участники</label>
               {students.length === 0 ? (
                    <p className="text-muted-foreground text-sm">В системе нет учеников для добавления.</p>
               ) : (
                <Card className="p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                    {students.map(student => (
                        <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleSelectStudent(student.id)}
                        />
                        <label
                            htmlFor={`student-${student.id}`}
                            className="text-sm font-medium leading-none"
                        >
                            {student.name}
                        </label>
                        </div>
                    ))}
                    </div>
                </Card>
               )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || students.length === 0} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Создать группу
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
