import NextAuth from "next-auth"

const handler = NextAuth({
  providers: [
    // add your providers here
  ],
})

export { handler as GET, handler as POST }