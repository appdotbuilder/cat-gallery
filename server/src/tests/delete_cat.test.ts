
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable, photosTable } from '../db/schema';
import { type DeleteCatInput, type CreateUserInput, type CreateCatInput, type CreatePhotoInput } from '../schema';
import { deleteCat } from '../handlers/delete_cat';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteCatInput = {
  id: 1
};

// Prerequisites for testing
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: null
};

const testCat: CreateCatInput = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3,
  description: 'A fluffy cat',
  user_id: 1
};

const testPhoto: CreatePhotoInput = {
  cat_id: 1,
  url: 'https://example.com/photo.jpg',
  filename: 'photo.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  caption: 'Cute photo',
  is_primary: true
};

describe('deleteCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a cat', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create cat
    await db.insert(catsTable).values(testCat).execute();

    const result = await deleteCat(testInput);

    expect(result.success).toBe(true);

    // Verify cat is deleted
    const cats = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, testInput.id))
      .execute();

    expect(cats).toHaveLength(0);
  });

  it('should cascade delete associated photos', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create cat
    await db.insert(catsTable).values(testCat).execute();
    
    // Create associated photo
    await db.insert(photosTable).values(testPhoto).execute();

    // Verify photo exists before deletion
    const photosBefore = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, testInput.id))
      .execute();
    
    expect(photosBefore).toHaveLength(1);

    const result = await deleteCat(testInput);

    expect(result.success).toBe(true);

    // Verify photos are cascade deleted
    const photosAfter = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, testInput.id))
      .execute();

    expect(photosAfter).toHaveLength(0);
  });

  it('should throw error when cat does not exist', async () => {
    const nonExistentInput: DeleteCatInput = {
      id: 999
    };

    await expect(deleteCat(nonExistentInput)).rejects.toThrow(/not found/i);
  });

  it('should delete multiple photos when cat has multiple photos', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create cat
    await db.insert(catsTable).values(testCat).execute();
    
    // Create multiple photos
    const photo1: CreatePhotoInput = {
      ...testPhoto,
      url: 'https://example.com/photo1.jpg',
      filename: 'photo1.jpg',
      is_primary: true
    };
    
    const photo2: CreatePhotoInput = {
      ...testPhoto,
      url: 'https://example.com/photo2.jpg',
      filename: 'photo2.jpg',
      is_primary: false
    };

    await db.insert(photosTable).values([photo1, photo2]).execute();

    // Verify photos exist before deletion
    const photosBefore = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, testInput.id))
      .execute();
    
    expect(photosBefore).toHaveLength(2);

    const result = await deleteCat(testInput);

    expect(result.success).toBe(true);

    // Verify all photos are cascade deleted
    const photosAfter = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, testInput.id))
      .execute();

    expect(photosAfter).toHaveLength(0);
  });
});
