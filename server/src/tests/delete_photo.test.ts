
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable, photosTable } from '../db/schema';
import { type DeletePhotoInput } from '../schema';
import { deletePhoto } from '../handlers/delete_photo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeletePhotoInput = {
  id: 1
};

describe('deletePhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing photo', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create prerequisite cat
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Test Cat',
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create test photo
    const photoResult = await db.insert(photosTable)
      .values({
        cat_id: catResult[0].id,
        url: 'https://example.com/photo.jpg',
        filename: 'photo.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        is_primary: false
      })
      .returning()
      .execute();

    const result = await deletePhoto({ id: photoResult[0].id });

    expect(result.success).toBe(true);

    // Verify photo is deleted from database
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoResult[0].id))
      .execute();

    expect(photos).toHaveLength(0);
  });

  it('should return false for non-existent photo', async () => {
    const result = await deletePhoto({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should handle multiple photos correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create prerequisite cat
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Test Cat',
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create two test photos
    const photosResult = await db.insert(photosTable)
      .values([
        {
          cat_id: catResult[0].id,
          url: 'https://example.com/photo1.jpg',
          filename: 'photo1.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          is_primary: true
        },
        {
          cat_id: catResult[0].id,
          url: 'https://example.com/photo2.jpg',
          filename: 'photo2.jpg',
          file_size: 2048,
          mime_type: 'image/png',
          is_primary: false
        }
      ])
      .returning()
      .execute();

    // Delete first photo
    const result = await deletePhoto({ id: photosResult[0].id });

    expect(result.success).toBe(true);

    // Verify only first photo is deleted
    const remainingPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, catResult[0].id))
      .execute();

    expect(remainingPhotos).toHaveLength(1);
    expect(remainingPhotos[0].id).toBe(photosResult[1].id);
    expect(remainingPhotos[0].filename).toBe('photo2.jpg');
  });
});
