import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        if (credentials?.email === "1@1.com" && credentials?.password === "1") {
          // Any object returned will be saved in `user` property of the JWT
          const user = {
            id: "1",
            name: "user",
            email: "user@example.com",
          };
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          const user = {
            id: "1",
            name: "user",
            email: "user@example.com",
          };
          return user;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
