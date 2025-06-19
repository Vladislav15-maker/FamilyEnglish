
import NextAuth, { type NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsernameForAuth } from '@/lib/store';
import bcrypt from 'bcryptjs';

// Export authOptions so it can be used with getServerSession in other parts of the app
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
            console.log('[NextAuth] Хеш пароля пользователя из БД (строка):', `"${user.password_hash}"`, `(тип: ${typeof user.password_hash}, длина: ${user.password_hash.length})`);
            
            let isPasswordCorrect = false;
            // bcryptjs should handle different prefixes like $2a$, $2b$, $2y$ automatically if the hash structure is valid
            if (user.password_hash.length === 60) { 
                try {
                    isPasswordCorrect = bcrypt.compareSync(inputPassword, user.password_hash);
                } catch (e: any) {
                    console.error('[NextAuth] Ошибка во время сравнения пароля пользователя bcrypt.compareSync:', e.message, e.stack);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as ('teacher' | 'student');
        (session.user as any).username = token.username as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/', 
  },
  secret: process.env.NEXTAUTH_SECRET, 
  debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Helper to get session on the server side (e.g. in Route Handlers)
export async function getAppSession() {
  return await getServerSession(authOptions);
}
