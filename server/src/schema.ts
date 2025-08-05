
import { z } from 'zod';

// Cat schema
export const catSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string().nullable(),
  age: z.number().int().nullable(),
  description: z.string().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Cat = z.infer<typeof catSchema>;

// Photo schema
export const photoSchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  url: z.string(),
  filename: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  caption: z.string().nullable(),
  is_primary: z.boolean(),
  created_at: z.coerce.date()
});

export type Photo = z.infer<typeof photoSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schemas for creating
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  display_name: z.string().nullable(),
  avatar_url: z.string().url().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCatInputSchema = z.object({
  name: z.string().min(1).max(100),
  breed: z.string().nullable(),
  age: z.number().int().min(0).max(30).nullable(),
  description: z.string().max(500).nullable(),
  user_id: z.number()
});

export type CreateCatInput = z.infer<typeof createCatInputSchema>;

export const createPhotoInputSchema = z.object({
  cat_id: z.number(),
  url: z.string().url(),
  filename: z.string(),
  file_size: z.number().positive(),
  mime_type: z.string(),
  caption: z.string().max(200).nullable(),
  is_primary: z.boolean().default(false)
});

export type CreatePhotoInput = z.infer<typeof createPhotoInputSchema>;

// Input schemas for updating
export const updateCatInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  breed: z.string().nullable().optional(),
  age: z.number().int().min(0).max(30).nullable().optional(),
  description: z.string().max(500).nullable().optional()
});

export type UpdateCatInput = z.infer<typeof updateCatInputSchema>;

export const updatePhotoInputSchema = z.object({
  id: z.number(),
  caption: z.string().max(200).nullable().optional(),
  is_primary: z.boolean().optional()
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoInputSchema>;

// Query schemas
export const getCatsByUserInputSchema = z.object({
  user_id: z.number()
});

export type GetCatsByUserInput = z.infer<typeof getCatsByUserInputSchema>;

export const getPhotosByCatInputSchema = z.object({
  cat_id: z.number()
});

export type GetPhotosByCatInput = z.infer<typeof getPhotosByCatInputSchema>;

export const getCatByIdInputSchema = z.object({
  id: z.number()
});

export type GetCatByIdInput = z.infer<typeof getCatByIdInputSchema>;

export const deletePhotoInputSchema = z.object({
  id: z.number()
});

export type DeletePhotoInput = z.infer<typeof deletePhotoInputSchema>;

export const deleteCatInputSchema = z.object({
  id: z.number()
});

export type DeleteCatInput = z.infer<typeof deleteCatInputSchema>;

// Response schemas with relations
export const catWithPhotosSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string().nullable(),
  age: z.number().int().nullable(),
  description: z.string().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  photos: z.array(photoSchema)
});

export type CatWithPhotos = z.infer<typeof catWithPhotosSchema>;
