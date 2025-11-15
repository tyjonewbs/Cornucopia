import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { profileCompletionSchema } from '@/lib/validators/userSchemas';
import { getUser } from '@/lib/auth';

/**
 * Complete user profile on first login
 * POST /api/user/complete-profile
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = profileCompletionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, firstName, lastName, profileImage, city, state, zipCode } = validation.data;

    // Check if username is already taken (case-insensitive)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive',
          },
          NOT: {
            id: user.id,
          },
        } as any,
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Upsert user profile (create if doesn't exist, update if exists)
    const updatedUser = await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email || '',
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        profileImage: profileImage || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        profileComplete: true,
        usernameLastChanged: new Date(),
        role: 'USER',
      } as any,
      update: {
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        profileImage: profileImage || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        profileComplete: true,
        usernameLastChanged: new Date(),
      } as any,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        city: true,
        state: true,
        zipCode: true,
        profileComplete: true,
        role: true,
      } as any,
    });

    return NextResponse.json({
      message: 'Profile completed successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error completing profile:', error);
    return NextResponse.json(
      { error: 'Failed to complete profile' },
      { status: 500 }
    );
  }
}
