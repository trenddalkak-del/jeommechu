import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";

interface KakaoProfile {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
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
        token.name =
          kakaoProfile.properties?.nickname ||
          kakaoProfile.kakao_account?.profile?.nickname ||
          token.name;
        token.picture =
          kakaoProfile.properties?.profile_image ||
          kakaoProfile.kakao_account?.profile?.profile_image_url ||
          token.picture;
        token.email = kakaoProfile.kakao_account?.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub || "",
          kakaoId: (token.kakaoId as string | undefined) || "",
          name: (token.name as string | undefined) ?? null,
          email: (token.email as string | undefined) ?? null,
          image: (token.picture as string | undefined) ?? null,
        },
      };
    },
  },
  pages: {
    signIn: "/",
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
