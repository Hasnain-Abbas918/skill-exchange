import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SkillSwap — Exchange Skills, Learn Together",
  description: "Trade your skills with people around the world. Free, trusted, community-powered.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#06b6d4", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}