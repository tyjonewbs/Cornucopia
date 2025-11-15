import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { userProfileUpdateSchema, usernameUpdateSchema } from '@/lib/validators/userSchemas';
import { canChangeUsername } from '@/lib/dto/user.dto';

/**
 * GET /api/user
 * Get current user data
 */
export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
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
        role: true,
        profileComplete: true,
        usernameLastChanged: true,
      },
    }) as any; // Type assertion needed until Prisma types refresh

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
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
    const validation = userProfileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, firstName, lastName, city, state, zipCode } = validation.data;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
        usernameLastChanged: true,
      },
    }) as any;

    // If username is being changed, validate it
    if (username && username !== currentUser?.username) {
      // Check if user can change username (30-day cooldown)
      if (!canChangeUsername(currentUser)) {
        return NextResponse.json(
          { error: 'You can only change your username once every 30 days' },
          { status: 400 }
        );
      }

      // Validate username format
      const usernameValidation = usernameUpdateSchema.safeParse({ username });
      if (!usernameValidation.success) {
        return NextResponse.json(
          { error: usernameValidation.error.errors[0].message },
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

    // Build update data
    const updateData: any = {};
    if (username && username !== currentUser?.username) {
      updateData.username = username;
      updateData.usernameLastChanged = new Date();
    }
    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (zipCode !== undefined) updateData.zipCode = zipCode || null;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
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
        role: true,
        usernameLastChanged: true,
      },
    }) as any;

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
