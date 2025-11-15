import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { usernameSchema } from '@/lib/validators/userSchemas';
import { getUser } from '@/lib/auth';

/**
 * Check if a username is available
 * GET /api/user/check-username?username=example
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { available: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    const validation = usernameSchema.safeParse(username);
    if (!validation.success) {
      return NextResponse.json(
        { 
          available: false, 
          error: validation.error.errors[0].message 
        },
        { status: 400 }
      );
    }

    // Check if username is already taken (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      } as any, // Type assertion needed until Prisma types refresh
      select: { id: true },
    });

    // Get current user to allow them to keep their own username
    const currentUser = await getUser();
    const isOwnUsername = currentUser && existingUser?.id === currentUser.id;

    return NextResponse.json({
      available: !existingUser || isOwnUsername,
      username: validation.data,
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
