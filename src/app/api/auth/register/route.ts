import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, insertUserSchema } from '@/db/schema'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract password and remove from body for validation
    const { password, ...rest } = body
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    // Validate input (without password)
    const validatedData = insertUserSchema.parse(rest)

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email.toLowerCase()),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [newUser] = await db.insert(users).values({
      ...validatedData,
      email: validatedData.email.toLowerCase(),
      passwordHash: hashedPassword,
    }).returning({ id: users.id, email: users.email })

    return NextResponse.json(
      { message: 'User created successfully', userId: newUser.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}