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
        const inputPassword = credentials.password.trim(); 

        try {
          const user = await getUserByUsernameForAuth(inputUsername);
          console.log('[NextAuth] Пользователь получен из БД для authorize:', user?.username, 'Роль:', user?.role);

          if (user && user.password_hash) {
            console.log('[NextAuth] Пароль из credentials для сравнения (обрезанный):', `"${inputPassword}"`, `(тип: ${typeof inputPassword}, длина: ${inputPassword.length})`);
            console.log('[NextAuth] Хеш пароля пользователя из БД:', `"${user.password_hash}"`, `(тип: ${typeof user.password_hash}, длина: ${user.password_hash.length})`);
            
            // Жестко закодированный тест
            const testPassword = "Vladislav15"; 
            const testHash = "$2a$10$R9q7XhW.zY3pS.kP6wT9yO8vG3z7gH.Lw5jF3xT2rS.9YkPqQwOe"; // 60-символьный хеш для "Vladislav15"
            
            console.log('[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Тестовый пароль:', `"${testPassword}"`, `(тип: ${typeof testPassword}, длина: ${testPassword.length})`);
            console.log('[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Тестовый хеш:', `"${testHash}"`, `(тип: ${typeof testHash}, длина: ${testHash.length})`);
            
            const isTestHashValidLength = testHash.length === 60;
            console.log('[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Длина тестового хеша == 60?', isTestHashValidLength);

            let hardcodedTestResult = false;
            if (isTestHashValidLength) {
                try {
                    hardcodedTestResult = bcrypt.compareSync(testPassword, testHash);
                } catch (e: any) {
                    console.error('[NextAuth] Ошибка во время жестко закодированного bcrypt.compareSync:', e.message, e.stack);
                }
            } else {
                 console.error('[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - ОШИБКА ДЛИНЫ ХЕША! Ожидалось 60, получено:', testHash.length);
            }
            console.log(`[NextAuth] РЕЗУЛЬТАТ ЖЕСТКО ЗАКОДИРОВАННОГО BCRYPT ТЕСТА ("${testPassword}" vs "${testHash}"): ${hardcodedTestResult}`);
            
            // Основная проверка пароля
            let isPasswordCorrect = false;
            if (user.password_hash.length === 60) { // Проверяем длину хеша из БД
                try {
                    isPasswordCorrect = bcrypt.compareSync(inputPassword, user.password_hash);
                } catch (e: any) {
                    console.error('[NextAuth] Ошибка во время сравнения пароля пользователя bcrypt.compareSync:', e.message, e.stack);
                }
            } else {
                console.error('[NextAuth] Хеш пароля пользователя из БД имеет неверную длину! Ожидалось 60, получено:', user.password_hash.length);
            }
            console.log('[NextAuth] Пароль верен (используя inputPassword и user.password_hash):', isPasswordCorrect);

            if (isPasswordCorrect) {
              console.log('[NextAuth] Аутентификация успешна для:', user.username);
              return {
                id: user.id, 
                name: user.name,
                username: user.username,
                role: user.role,
              };
            } else {
              console.log('[NextAuth] Неверный пароль для пользователя:', user.username);
              // Если жестко закодированный тест прошел успешно, но основная проверка - нет,
              // и пользователь совпадает с тестовым, это указывает на проблему с хешем из БД для этого пользователя
              if (hardcodedTestResult && inputUsername === testPassword && !isPasswordCorrect) {
                  console.warn(`[NextAuth] ПРЕДУПРЕЖДЕНИЕ: Жестко закодированный тест для ${testPassword} УСПЕШЕН, но вход для пользователя ${inputUsername} с хешем из БД НЕУСПЕШЕН. Проверьте хеш в БД для ${inputUsername}.`);
              }
              return null;
            }
          } else {
            console.log('[NextAuth] Пользователь не найден или отсутствует password_hash для username:', inputUsername);
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
        token.role = (user as any).role; 
        token.username = (user as any).username; 
        console.log('[NextAuth] JWT callback, user present:', (user as any).username, 'Token role:', token.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as ('teacher' | 'student');
        (session.user as any).username = token.username as string;
        console.log('[NextAuth] Session callback, session user:', (session.user as any).username, 'Role:', (session.user as any).role);
      }
      return session;
    }
  },
  pages: {
    signIn: '/', 
  },
  secret: process.env.NEXTAUTH_SECRET, 
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
