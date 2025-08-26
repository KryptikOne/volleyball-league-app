import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    isAdministrator: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdministrator: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdministrator: boolean
  }
}