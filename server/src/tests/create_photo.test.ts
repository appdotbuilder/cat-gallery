
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photosTable, catsTable, usersTable } from '../db/schema';
import { type CreatePhotoInput } from '../schema';
import { createPhoto } from '../handlers/create_photo';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg'
};

const testCat = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3,
  description: 'A beautiful Persian cat',
  user_id: 1 // Will be set after creating user
};

const testInput: CreatePhotoInput = {
  cat_id: 1, // Will be set after creating cat
  url: 'https://example.com/photo.jpg',
  filename: 'photo.jpg',
  file_size: 1024000,
  mime_type: 'image/jpeg',
  caption: 'A beautiful photo of my cat',
  is_primary: false
};

describe('createPhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a photo', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create prerequisite cat
    const catResult = await db.insert(catsTable)
      .values({
        ...testCat,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create photo with correct cat_id
    const photoInput = {
      ...testInput,
      cat_id: catResult[0].id
    };

    const result = await createPhoto(photoInput);

    // Basic field validation
    expect(result.cat_id).toEqual(catResult[0].id);
    expect(result.url).toEqual('https://example.com/photo.jpg');
    expect(result.filename).toEqual('photo.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.caption).toEqual('A beautiful photo of my cat');
    expect(result.is_primary).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save photo to database', async () => {
    // Create prerequisite user and cat
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const catResult = await db.insert(catsTable)
      .values({
        ...testCat,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const photoInput = {
      ...testInput,
      cat_id: catResult[0].id
    };

    const result = await createPhoto(photoInput);

    // Query database to verify photo was saved
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].cat_id).toEqual(catResult[0].id);
    expect(photos[0].url).toEqual('https://example.com/photo.jpg');
    expect(photos[0].filename).toEqual('photo.jpg');
    expect(photos[0].file_size).toEqual(1024000);
    expect(photos[0].mime_type).toEqual('image/jpeg');
    expect(photos[0].caption).toEqual('A beautiful photo of my cat');
    expect(photos[0].is_primary).toEqual(false);
    expect(photos[0].created_at).toBeInstanceOf(Date);
  });

  it('should set other photos as non-primary when creating primary photo', async () => {
    // Create prerequisite user and cat
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const catResult = await db.insert(catsTable)
      .values({
        ...testCat,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create first photo as primary
    const firstPhotoInput = {
      ...testInput,
      cat_id: catResult[0].id,
      is_primary: true,
      filename: 'first.jpg',
      url: 'https://example.com/first.jpg'
    };

    await createPhoto(firstPhotoInput);

    // Create second photo as primary
    const secondPhotoInput = {
      ...testInput,
      cat_id: catResult[0].id,
      is_primary: true,
      filename: 'second.jpg',
      url: 'https://example.com/second.jpg'
    };

    await createPhoto(secondPhotoInput);

    // Check that only the second photo is primary
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, catResult[0].id))
      .execute();

    expect(photos).toHaveLength(2);
    const primaryPhotos = photos.filter(photo => photo.is_primary);
    expect(primaryPhotos).toHaveLength(1);
    expect(primaryPhotos[0].filename).toEqual('second.jpg');
  });

  it('should throw error when cat does not exist', async () => {
    const invalidInput = {
      ...testInput,
      cat_id: 999 // Non-existent cat ID
    };

    await expect(createPhoto(invalidInput)).rejects.toThrow(/Cat with id 999 not found/i);
  });

  it('should handle nullable caption field', async () => {
    // Create prerequisite user and cat
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const catResult = await db.insert(catsTable)
      .values({
        ...testCat,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create photo with null caption
    const photoInput = {
      ...testInput,
      cat_id: catResult[0].id,
      caption: null
    };

    const result = await createPhoto(photoInput);

    expect(result.caption).toBeNull();

    // Verify in database
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos[0].caption).toBeNull();
  });
});
