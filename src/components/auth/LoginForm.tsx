'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#4051b5] via-[#789dce] to-[#9f755b] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 text-foreground shadow-2xl">
        <div className="text-center mb-8">
           <div className="flex justify-center items-center mx-auto mb-4 h-16 w-16 bg-[#e7e9f9] rounded-xl">
            <LogIn className="w-8 h-8 text-primary" />
           </div>
          <h1 className="text-3xl font-bold font-headline text-[#181e44]">EnglishCourse</h1>
          <p className="text-[#5f5d97] mt-2">Войдите в свой аккаунт для продолжения</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-left">
            <Label htmlFor="username" className="text-[#5f5d97]">Имя пользователя</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="например, vladislav_teacher"
              className="text-base h-12 bg-[#e7e9f9] border-0 text-[#181e44] placeholder:text-[#5d5c99] focus-visible:ring-2 focus-visible:ring-primary/50"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-[#5f5d97]">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
                className="text-base h-12 bg-[#e7e9f9] border-0 text-[#181e44] placeholder:text-[#5d5c99] focus-visible:ring-2 focus-visible:ring-primary/50"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-[#5f5d98] hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full text-lg h-12 bg-primary text-primary-foreground hover:bg-primary/90" size="lg" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  );
}
