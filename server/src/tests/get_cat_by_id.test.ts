
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable, photosTable } from '../db/schema';
import { type GetCatByIdInput, type CreateUserInput, type CreateCatInput, type CreatePhotoInput } from '../schema';
import { getCatById } from '../handlers/get_cat_by_id';

// Test data
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
  user_id: 1 // Will be set after user creation
};

const testPhoto1: CreatePhotoInput = {
  cat_id: 1, // Will be set after cat creation
  url: 'https://example.com/photo1.jpg',
  filename: 'photo1.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  caption: 'Primary photo',
  is_primary: true
};

const testPhoto2: CreatePhotoInput = {
  cat_id: 1, // Will be set after cat creation
  url: 'https://example.com/photo2.jpg',
  filename: 'photo2.jpg',
  file_size: 2048,
  mime_type: 'image/jpeg',
  caption: 'Secondary photo',
  is_primary: false
};

describe('getCatById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return cat with photos when cat exists', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create cat
    const catResult = await db.insert(catsTable)
      .values({
        ...testCat,
        user_id: userId
      })
      .returning()
      .execute();
    const catId = catResult[0].id;

    // Create photos
    await db.insert(photosTable)
      .values([
        { ...testPhoto1, cat_id: catId },
        { ...testPhoto2, cat_id: catId }
      ])
      .execute();

    const input: GetCatByIdInput = { id: catId };
    const result = await getCatById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(catId);
    expect(result!.name).toEqual('Fluffy');
    expect(result!.breed).toEqual('Persian');
    expect(result!.age).toEqual(3);
    expect(result!.description).toEqual('A fluffy cat');
    expect(result!.user_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.photos).toHaveLength(2);

    // Check photos are included correctly
    const primaryPhoto = result!.photos.find(p => p.is_primary);
    const secondaryPhoto = result!.photos.find(p => !p.is_primary);

    expect(primaryPhoto).toBeDefined();
    expect(primaryPhoto!.caption).toEqual('Primary photo');
    expect(primaryPhoto!.url).toEqual('https://example.com/photo1.jpg');

    expect(secondaryPhoto).toBeDefined();
    expect(secondaryPhoto!.caption).toEqual('Secondary photo');
    expect(secondaryPhoto!.url).toEqual('https://example.com/photo2.jpg');
  });

  it('should return cat with empty photos array when cat has no photos', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create cat without photos
    const catResult = await db.insert(catsTable)
      .values({
        ...testCat,
        user_id: userId
      })
      .returning()
      .execute();
    const catId = catResult[0].id;

    const input: GetCatByIdInput = { id: catId };
    const result = await getCatById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(catId);
    expect(result!.name).toEqual('Fluffy');
    expect(result!.photos).toHaveLength(0);
  });

  it('should return null when cat does not exist', async () => {
    const input: GetCatByIdInput = { id: 999 };
    const result = await getCatById(input);

    expect(result).toBeNull();
  });

  it('should handle cat with nullable fields correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create cat with null fields
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Mystery Cat',
        breed: null,
        age: null,
        description: null,
        user_id: userId
      })
      .returning()
      .execute();
    const catId = catResult[0].id;

    const input: GetCatByIdInput = { id: catId };
    const result = await getCatById(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Mystery Cat');
    expect(result!.breed).toBeNull();
    expect(result!.age).toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.photos).toHaveLength(0);
  });
});
