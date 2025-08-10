'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[LoginForm] Attempting login for user:', username);

    try {
      const result = await login({ username, password });
      console.log('[LoginForm] Login result:', result);

      if (result && !result.error) {
        toast({
          title: 'Успешный вход',
          description: `Добро пожаловать!`,
          variant: 'default',
        });
        router.push('/dashboard');
        router.refresh();
      } else {
        toast({
          title: 'Ошибка входа',
          description: result?.error || 'Неверное имя пользователя или пароль.',
          variant: 'destructive',
        });
        console.error('[LoginForm] Login failed:', result?.error);
      }
    } catch (error) {
      console.error("[LoginForm] Login submission error:", error);
      toast({
        title: 'Ошибка входа',
        description: 'Произошла непредвиденная ошибка на клиенте.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#4A55A2] via-[#789DCE] to-[#E3B48D] p-4">
      <Card className="w-full max-w-md shadow-lg border-none rounded-2xl">
        <CardHeader className="items-center text-center space-y-3 pt-8 pb-4">
           <div className="flex">
            <LogIn className="w-10 h-10 text-primary" />
           </div>
          <CardTitle className="text-3xl font-bold">EnglishCourse</CardTitle>
          <CardDescription>Войдите в свой аккаунт для продолжения</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="например, vladislav_teacher"
                className="text-base h-11 bg-input border-0 focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                  className="text-base h-11 bg-input border-0 focus-visible:ring-2 focus-visible:ring-ring"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full text-lg h-12" size="lg" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
