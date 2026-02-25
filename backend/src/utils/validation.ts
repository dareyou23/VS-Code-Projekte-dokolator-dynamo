import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100)
});

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  rolle: z.enum(['admin', 'user'])
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100)
});

export const resetPasswordSchema = z.object({
  email: z.string().email().max(255)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});
