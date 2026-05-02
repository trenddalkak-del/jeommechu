import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      kakaoId: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }

  interface User {
    kakaoId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    kakaoId?: string;
  }
}
