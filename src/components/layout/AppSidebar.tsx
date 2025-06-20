'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, Users, BookOpen, CheckSquare, Award, BarChart3, LibraryBig, Sigma, Users2 } from 'lucide-react'; // Added Users2 for "Класс"

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('teacher' | 'student')[];
  exactMatch?: boolean; 
}

export const navItems: NavItem[] = [
  // Student items
  { href: '/dashboard/student/home', label: 'Главная', icon: Home, roles: ['student'], exactMatch: true },
  { href: '/dashboard/units', label: 'Юниты (Мои)', icon: BookOpen, roles: ['student'] },
  { href: '/dashboard/student/offline-tests', label: 'Оффлайн Тесты (Мои)', icon: Award, roles: ['student'] },
  { href: '/dashboard/student/unit-grades', label: 'Оценки за Юниты (Мои)', icon: Sigma, roles: ['student'] },
  { href: '/dashboard/student/class-overview', label: 'Класс', icon: Users2, roles: ['student'] }, 
  
  // Teacher items
  { href: '/dashboard/teacher/students', label: 'Ученики', icon: Users, roles: ['teacher'], exactMatch: true }, 
  { href: '/dashboard/teacher/progress-overview', label: 'Обзор Успеваемости Класса', icon: BarChart3, roles: ['teacher'] },
  { href: '/dashboard/teacher/offline-tests', label: 'Оффлайн Тесты (Управление)', icon: CheckSquare, roles: ['teacher'] },
  { href: '/dashboard/teacher/unit-grading', label: 'Оценки за Юниты (Управление)', icon: Sigma, roles: ['teacher'] },
  { href: '/dashboard/teacher/curriculum', label: 'Учебный План', icon: LibraryBig, roles: ['teacher'] },
];

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r md:sticky md:block bg-card text-card-foreground">
      <ScrollArea className="h-full py-6 pr-6 lg:py-8">
        <nav className="space-y-1 px-2">
          {filteredNavItems.map((item) => {
            const isActive = item.exactMatch ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm py-2.5" 
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
