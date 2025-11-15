-- Sync existing Supabase Auth user to Prisma User table
-- Run this in your Supabase SQL Editor

-- Replace these values with your actual user data from Supabase Auth → Users
INSERT INTO "User" (
  id,
  email,
  "firstName",
  "lastName",
  "profileImage",
  "connectedAccountId",
  "stripeConnectedLinked",
  role,
  username,
  city,
  state,
  "zipCode",
  "profileComplete",
  "usernameLastChanged"
)
VALUES (
  '58d763be-51a4-427c-b342-6989390d5061',  -- Your user ID from the error log
  'your-email@example.com',  -- Replace with your actual email from Supabase Auth
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  'USER',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email, username, "profileComplete" FROM "User" WHERE id = '58d763be-51a4-427c-b342-6989390d5061';
