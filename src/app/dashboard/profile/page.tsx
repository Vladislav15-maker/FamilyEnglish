'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Shield, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProfilePage() {
  const { user, isLoading, setAvatar } = useAuth();

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const handleChangeAvatar = () => {
    // Generate a random seed for a new avatar from placehold.co
    const newAvatarUrl = `https://placehold.co/100x100.png?text=${getInitials(user?.name)}&seed=${Math.random()}`;
    if(setAvatar) {
        setAvatar(newAvatarUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-5 w-24 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>Не удалось загрузить данные пользователя. Пожалуйста, войдите в систему заново.</AlertDescription>
      </Alert>
    )
  }

  const roleRussian = user.role === 'teacher' ? 'Учитель' : 'Ученик';

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center items-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span>{roleRussian}</span>
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
                 <div className="space-y-0.5">
                    <p className="text-sm font-medium">Имя пользователя</p>
                    <p className="text-muted-foreground">{user.username}</p>
                 </div>
                 <User className="h-5 w-5 text-primary" />
            </div>
            <Button onClick={handleChangeAvatar} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Сменить аватар
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
