
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsernameForAuth } from '@/lib/store';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Имя пользователя", type: "text", placeholder: "Vladislav" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        console.log('[NextAuth] Функция authorize вызвана с учетными данными:', credentials?.username);
        if (!credentials?.username || !credentials?.password) {
          console.error('[NextAuth] Отсутствует имя пользователя или пароль');
          return null;
        }

        const inputUsername = credentials.username;
        // Обрезаем пароль для удаления начальных/конечных пробелов
        const inputPassword = credentials.password.trim(); 

        try {
          const user = await getUserByUsernameForAuth(inputUsername);
          console.log('[NextAuth] Пользователь получен из БД для authorize:', user?.username, 'Роль:', user?.role);

          if (user && user.password_hash) {
            console.log('[NextAuth] Пароль из credentials для сравнения (обрезанный):', `"${inputPassword}"`, `(тип: ${typeof inputPassword}, длина: ${inputPassword.length})`);
            console.log('[NextAuth] Хеш пароля пользователя из БД:', `"${user.password_hash}"`, `(тип: ${typeof user.password_hash}, длина: ${user.password_hash.length})`);
            
            // --- ПРЯМОЙ ТЕСТ BCRYPT ---
            // Используем новые учетные данные Vladislav для жестко закодированного теста
            const testPassword = "Vladislav15"; 
            const testHashFromLog = "$2a$10$kP6wT9yE0gJ1lB2vC4dOq.0zX7f0D.Y4pYg5hB.xQzU.n2fXhD3kZ8s"; // Хеш для "Vladislav15"
            console.log('[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Тестовый пароль:', `"${testPassword}"`, `(тип: ${typeof testPassword}, длина: ${testPassword.length})`);
            console.log('[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Тестовый хеш:', `"${testHashFromLog}"`, `(тип: ${typeof testHashFromLog}, длина: ${testHashFromLog.length})`);
            
            let hardcodedTestResult = false;
            try {
                hardcodedTestResult = bcrypt.compareSync(testPassword, testHashFromLog);
            } catch (e: any) {
                console.error('[NextAuth] Ошибка во время жестко закодированного bcrypt.compareSync:', e.message, e.stack);
            }
            console.log(`[NextAuth] РЕЗУЛЬТАТ ЖЕСТКО ЗАКОДИРОВАННОГО BCRYPT ТЕСТА ("${testPassword}" vs "${testHashFromLog}"): ${hardcodedTestResult}`);
            // --- КОНЕЦ ПРЯМОГО ТЕСТА BCRYPT ---

            console.log('[NextAuth] Сравнение пароля для пользователя:', user.username);
            let isPasswordCorrect = false;
            try {
                isPasswordCorrect = bcrypt.compareSync(inputPassword, user.password_hash);
            } catch (e: any) {
                console.error('[NextAuth] Ошибка во время bcrypt.compareSync для пароля пользователя:', e.message, e.stack);
            }
            console.log('[NextAuth] Пароль верен (используя inputPassword и user.password_hash):', isPasswordCorrect);

            if (isPasswordCorrect) {
              console.log('[NextAuth] Аутентификация успешна для:', user.username);
              return {
                id: user.id, // Убедитесь, что user.id это строка
                name: user.name,
                username: user.username,
                role: user.role,
              };
            } else {
              console.log('[NextAuth] Неверный пароль для пользователя:', user.username);
               // Дополнительная проверка, если жестко закодированный тест также провалился с учетными данными Vladislav
               if (hardcodedTestResult === false && inputUsername === 'Vladislav' && inputPassword === 'Vladislav15') {
                console.error(`[NextAuth] КРИТИЧЕСКАЯ ОШИБКА: Жестко закодированный тест для Vladislav/Vladislav15 ПРОВАЛИЛСЯ. Это указывает на потенциальную проблему с bcrypt или окружением.`);
              }
              return null;
            }
          } else {
            console.log('[NextAuth] Пользователь не найден или отсутствует password_hash для имени пользователя:', inputUsername);
            return null;
          }
        } catch (error) {
          console.error('[NextAuth] Ошибка в функции authorize:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // Приведение типа для доступа к пользовательскому свойству
        token.username = (user as any).username; // Приведение типа для доступа к пользовательскому свойству
        console.log('[NextAuth] JWT callback, пользователь присутствует:', (user as any).username, 'Роль токена:', token.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as ('teacher' | 'student');
        (session.user as any).username = token.username as string;
        console.log('[NextAuth] Session callback, пользователь сессии:', (session.user as any).username, 'Роль:', (session.user as any).role);
      }
      return session;
    }
  },
  pages: {
    signIn: '/', 
  },
  secret: process.env.NEXTAUTH_SECRET, // Убедитесь, что это есть в вашем .env.local и переменных окружения Vercel
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
