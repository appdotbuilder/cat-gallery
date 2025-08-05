
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable, photosTable } from '../db/schema';
import { type UpdatePhotoInput } from '../schema';
import { updatePhoto } from '../handlers/update_photo';
import { eq } from 'drizzle-orm';

describe('updatePhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let catId: number;
  let photoId1: number;
  let photoId2: number;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: null
      })
      .returning()
      .execute();
    userId = user[0].id;

    // Create test cat
    const cat = await db.insert(catsTable)
      .values({
        name: 'Test Cat',
        breed: 'Persian',
        age: 3,
        description: 'A test cat',
        user_id: userId
      })
      .returning()
      .execute();
    catId = cat[0].id;

    // Create test photos
    const photo1 = await db.insert(photosTable)
      .values({
        cat_id: catId,
        url: 'https://example.com/photo1.jpg',
        filename: 'photo1.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: 'Original caption',
        is_primary: true
      })
      .returning()
      .execute();
    photoId1 = photo1[0].id;

    const photo2 = await db.insert(photosTable)
      .values({
        cat_id: catId,
        url: 'https://example.com/photo2.jpg',
        filename: 'photo2.jpg',
        file_size: 2048,
        mime_type: 'image/png',
        caption: null,
        is_primary: false
      })
      .returning()
      .execute();
    photoId2 = photo2[0].id;
  });

  it('should update photo caption', async () => {
    const input: UpdatePhotoInput = {
      id: photoId1,
      caption: 'Updated caption'
    };

    const result = await updatePhoto(input);

    expect(result.id).toEqual(photoId1);
    expect(result.caption).toEqual('Updated caption');
    expect(result.is_primary).toEqual(true); // Should remain unchanged
  });

  it('should update caption to null', async () => {
    const input: UpdatePhotoInput = {
      id: photoId1,
      caption: null
    };

    const result = await updatePhoto(input);

    expect(result.id).toEqual(photoId1);
    expect(result.caption).toBeNull();
    expect(result.is_primary).toEqual(true); // Should remain unchanged
  });

  it('should update is_primary status', async () => {
    const input: UpdatePhotoInput = {
      id: photoId2,
      is_primary: true
    };

    const result = await updatePhoto(input);

    expect(result.id).toEqual(photoId2);
    expect(result.is_primary).toEqual(true);
    expect(result.caption).toBeNull(); // Should remain unchanged
  });

  it('should set other photos to non-primary when setting one as primary', async () => {
    const input: UpdatePhotoInput = {
      id: photoId2,
      is_primary: true
    };

    await updatePhoto(input);

    // Check that photo2 is now primary
    const photo2 = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId2))
      .execute();
    expect(photo2[0].is_primary).toEqual(true);

    // Check that photo1 is no longer primary
    const photo1 = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId1))
      .execute();
    expect(photo1[0].is_primary).toEqual(false);
  });

  it('should update both caption and is_primary', async () => {
    const input: UpdatePhotoInput = {
      id: photoId2,
      caption: 'New primary photo',
      is_primary: true
    };

    const result = await updatePhoto(input);

    expect(result.id).toEqual(photoId2);
    expect(result.caption).toEqual('New primary photo');
    expect(result.is_primary).toEqual(true);

    // Verify other photo is no longer primary
    const photo1 = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId1))
      .execute();
    expect(photo1[0].is_primary).toEqual(false);
  });

  it('should persist changes to database', async () => {
    const input: UpdatePhotoInput = {
      id: photoId1,
      caption: 'Database test caption'
    };

    await updatePhoto(input);

    // Query database directly to verify persistence
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId1))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].caption).toEqual('Database test caption');
  });

  it('should throw error for non-existent photo', async () => {
    const input: UpdatePhotoInput = {
      id: 99999,
      caption: 'This should fail'
    };

    expect(updatePhoto(input)).rejects.toThrow(/photo not found/i);
  });

  it('should handle setting is_primary to false', async () => {
    const input: UpdatePhotoInput = {
      id: photoId1,
      is_primary: false
    };

    const result = await updatePhoto(input);

    expect(result.id).toEqual(photoId1);
    expect(result.is_primary).toEqual(false);
    expect(result.caption).toEqual('Original caption'); // Should remain unchanged
  });
});
