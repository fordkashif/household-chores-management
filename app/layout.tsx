import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { UsersProvider } from "@/contexts/users-context"
import { ChoresProvider } from "@/contexts/chores-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Household Chores Manager",
  description: "Manage and track household chores and assignments",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UsersProvider>
            <ChoresProvider>
              {children}
              <Toaster />
            </ChoresProvider>
          </UsersProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'