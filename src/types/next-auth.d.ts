import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "owner" | "admin";
      locale: "ar" | "en";
    } & DefaultSession["user"];
  }

  interface User {
    role: "owner" | "admin";
    locale: "ar" | "en";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "owner" | "admin";
    locale: "ar" | "en";
  }
}
