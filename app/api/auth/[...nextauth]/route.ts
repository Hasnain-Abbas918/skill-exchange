import NextAuth from "next-auth"
import { authOptions } from "@/auth" // Ensure karein ke authOptions wahan maujood hain

const handler = NextAuth(authOptions)

export const GET = handler.handlers.GET
export const POST = handler.handlers.POST