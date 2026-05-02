import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";

interface KakaoProfile {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    email?: string;
  };
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const kakaoProfile = profile as unknown as KakaoProfile;
        token.kakaoId = String(kakaoProfile.id);
        token.name = kakaoProfile.properties?.nickname || token.name;
        token.picture = kakaoProfile.properties?.profile_image || token.picture;
        token.email = kakaoProfile.kakao_account?.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.kakaoId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (session as any).user;
        user.kakaoId = token.kakaoId as string;
        user.id = token.sub || "";
        user.name = (token.name as string | undefined) ?? null;
        user.email = (token.email as string | undefined) ?? null;
        user.image = (token.picture as string | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
