import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    envKeys: Object.keys(process.env),
  });
}
