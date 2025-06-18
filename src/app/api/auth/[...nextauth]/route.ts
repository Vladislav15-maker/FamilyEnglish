
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

        // HARDCODED BCRYPT TEST - START
        const hardcodedTestPassword = "Vladislav"; // New password
        // This is the 60-character hash for "Vladislav" provided by the user
        const hardcodedTestHash = "$2y$10$db7OlM26nDujU0wKxgR.5u80myoLZmmMSBn6eCH3yNn2dPV4aEjly";

        console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Тестовый пароль: "${hardcodedTestPassword}" (тип: ${typeof hardcodedTestPassword}, длина: ${hardcodedTestPassword.length})`);
        console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Тестовый хеш (строка): "${hardcodedTestHash}"`);
        console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Длина тестового хеша (из свойства .length): ${hardcodedTestHash.length}`);

        let charCodes = '';
        for (let i = 0; i < hardcodedTestHash.length; i++) {
          charCodes += hardcodedTestHash.charCodeAt(i) + (i === hardcodedTestHash.length - 1 ? '' : ' ');
        }
        console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Коды символов тестового хеша (${hardcodedTestHash.length} шт.): [${charCodes}]`);

        if (hardcodedTestHash.length > 0) {
            console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Код ПОСЛЕДНЕГО символа: ${hardcodedTestHash.charCodeAt(hardcodedTestHash.length - 1)} ('${hardcodedTestHash[hardcodedTestHash.length - 1]}')`);
            if (hardcodedTestHash.length > 1) {
                 console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Код ПРЕДПОСЛЕДНЕГО символа: ${hardcodedTestHash.charCodeAt(hardcodedTestHash.length - 2)} ('${hardcodedTestHash[hardcodedTestHash.length - 2]}')`);
            }
        }
        
        const isHardcodedHashExpectedLength = hardcodedTestHash.length === 60;
        console.log(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - Длина тестового хеша == 60? ${isHardcodedHashExpectedLength}`);

        let hardcodedTestComparisonResult = false;
        if (isHardcodedHashExpectedLength) {
            try {
                hardcodedTestComparisonResult = bcrypt.compareSync(hardcodedTestPassword, hardcodedTestHash);
            } catch (e: any) {
                console.error('[NextAuth] ОШИБКА во время жестко закодированного bcrypt.compareSync (возможно, из-за префикса $2y$):', e.message, e.stack);
            }
        } else {
             console.error(`[NextAuth] ЖЕСТКО ЗАКОДИРОВАННЫЙ ТЕСТ - ДЛИНА ХЕША НЕ 60! Ожидалось 60, но текущая длина: ${hardcodedTestHash.length}. Тест bcrypt не будет выполнен.`);
        }
        console.log(`[NextAuth] РЕЗУЛЬТАТ ЖЕСТКО ЗАКОДИРОВАННОГО BCRYPT ТЕСТА ("${hardcodedTestPassword}" vs "${hardcodedTestHash}"): ${hardcodedTestComparisonResult}`);
        // HARDCODED BCRYPT TEST - END

        try {
          const user = await getUserByUsernameForAuth(inputUsername);
          console.log('[NextAuth] Пользователь получен из БД для authorize:', user?.username, 'Роль:', user?.role);

          if (user && user.password_hash) {
            console.log(`[NextAuth] Пароль из credentials для сравнения (обрезанный): "${inputPassword}" (тип: ${typeof inputPassword}, длина: ${inputPassword.length})`);
            console.log(`[NextAuth] Хеш пароля пользователя из БД (строка): "${user.password_hash}"`);
            console.log(`[NextAuth] Длина хеша пароля из БД (из свойства .length): ${user.password_hash.length}`);

            let userDbHashCharCodes = '';
            for (let i = 0; i < user.password_hash.length; i++) {
                userDbHashCharCodes += user.password_hash.charCodeAt(i) + (i === user.password_hash.length - 1 ? '' : ' ');
            }
            console.log(`[NextAuth] Коды символов хеша из БД (${user.password_hash.length} шт.): [${userDbHashCharCodes}]`);

            let isPasswordCorrect = false;
            if (user.password_hash.length === 60) {
                try {
                    isPasswordCorrect = bcrypt.compareSync(inputPassword, user.password_hash);
                } catch (e: any) {
                    console.error('[NextAuth] ОШИБКА во время сравнения пароля пользователя bcrypt.compareSync (возможно, из-за префикса $2y$):', e.message, e.stack);
                }
            } else {
                console.error(`[NextAuth] Хеш пароля пользователя из БД имеет неверную длину! Ожидалось 60, получено: ${user.password_hash.length}. Сравнение bcrypt не будет выполнено.`);
            }
            console.log(`[NextAuth] Пароль верен (используя inputPassword и user.password_hash): ${isPasswordCorrect}`);

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
