import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    coachName?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string;
      coachName?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    coachName?: string | null;
  }
}
