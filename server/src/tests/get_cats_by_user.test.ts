
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable, photosTable } from '../db/schema';
import { type GetCatsByUserInput } from '../schema';
import { getCatsByUser } from '../handlers/get_cats_by_user';

// Test data
const testUser = {
  username: 'catowner123',
  email: 'owner@cats.com',
  display_name: 'Cat Owner',
  avatar_url: null
};

const testCat1 = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3,
  description: 'A fluffy cat',
  user_id: 1
};

const testCat2 = {
  name: 'Shadow',
  breed: 'Maine Coon',
  age: 5,
  description: 'A large cat',
  user_id: 1
};

const testPhoto1 = {
  cat_id: 1,
  url: 'https://example.com/photo1.jpg',
  filename: 'photo1.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  caption: 'Cute cat photo',
  is_primary: true
};

const testPhoto2 = {
  cat_id: 1,
  url: 'https://example.com/photo2.jpg',
  filename: 'photo2.jpg',
  file_size: 2048,
  mime_type: 'image/jpeg',
  caption: null,
  is_primary: false
};

const testPhoto3 = {
  cat_id: 2,
  url: 'https://example.com/photo3.jpg',
  filename: 'photo3.jpg',
  file_size: 1536,
  mime_type: 'image/jpeg',
  caption: 'Shadow sleeping',
  is_primary: true
};

describe('getCatsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no cats', async () => {
    // Create user but no cats
    await db.insert(usersTable).values(testUser).execute();

    const input: GetCatsByUserInput = { user_id: 1 };
    const result = await getCatsByUser(input);

    expect(result).toEqual([]);
  });

  it('should return cats without photos', async () => {
    // Create user and cats but no photos
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values([testCat1, testCat2]).execute();

    const input: GetCatsByUserInput = { user_id: 1 };
    const result = await getCatsByUser(input);

    expect(result).toHaveLength(2);
    
    // Check first cat
    expect(result[0].name).toEqual('Shadow'); // Should be ordered by created_at desc
    expect(result[0].breed).toEqual('Maine Coon');
    expect(result[0].age).toEqual(5);
    expect(result[0].description).toEqual('A large cat');
    expect(result[0].user_id).toEqual(1);
    expect(result[0].photos).toEqual([]);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second cat
    expect(result[1].name).toEqual('Fluffy');
    expect(result[1].breed).toEqual('Persian');
    expect(result[1].age).toEqual(3);
    expect(result[1].description).toEqual('A fluffy cat');
    expect(result[1].user_id).toEqual(1);
    expect(result[1].photos).toEqual([]);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return cats with their photos', async () => {
    // Create user, cats, and photos
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values([testCat1, testCat2]).execute();
    await db.insert(photosTable).values([testPhoto1, testPhoto2, testPhoto3]).execute();

    const input: GetCatsByUserInput = { user_id: 1 };
    const result = await getCatsByUser(input);

    expect(result).toHaveLength(2);

    // Find cats by name since order might vary
    const fluffyCat = result.find(cat => cat.name === 'Fluffy');
    const shadowCat = result.find(cat => cat.name === 'Shadow');

    expect(fluffyCat).toBeDefined();
    expect(shadowCat).toBeDefined();

    // Check Fluffy's photos
    expect(fluffyCat!.photos).toHaveLength(2);
    expect(fluffyCat!.photos[0].url).toEqual('https://example.com/photo1.jpg');
    expect(fluffyCat!.photos[0].filename).toEqual('photo1.jpg');
    expect(fluffyCat!.photos[0].file_size).toEqual(1024);
    expect(fluffyCat!.photos[0].mime_type).toEqual('image/jpeg');
    expect(fluffyCat!.photos[0].caption).toEqual('Cute cat photo');
    expect(fluffyCat!.photos[0].is_primary).toEqual(true);
    expect(fluffyCat!.photos[0].created_at).toBeInstanceOf(Date);

    expect(fluffyCat!.photos[1].url).toEqual('https://example.com/photo2.jpg');
    expect(fluffyCat!.photos[1].caption).toBeNull();
    expect(fluffyCat!.photos[1].is_primary).toEqual(false);

    // Check Shadow's photos
    expect(shadowCat!.photos).toHaveLength(1);
    expect(shadowCat!.photos[0].url).toEqual('https://example.com/photo3.jpg');
    expect(shadowCat!.photos[0].caption).toEqual('Shadow sleeping');
    expect(shadowCat!.photos[0].is_primary).toEqual(true);
  });

  it('should return empty array for non-existent user', async () => {
    // Create some data for different user
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values(testCat1).execute();

    const input: GetCatsByUserInput = { user_id: 999 };
    const result = await getCatsByUser(input);

    expect(result).toEqual([]);
  });

  it('should only return cats for specified user', async () => {
    // Create two users
    await db.insert(usersTable).values([
      testUser,
      { username: 'other_user', email: 'other@example.com', display_name: null, avatar_url: null }
    ]).execute();

    // Create cats for both users
    await db.insert(catsTable).values([
      testCat1, // user_id: 1
      { ...testCat2, user_id: 2 } // user_id: 2
    ]).execute();

    const input: GetCatsByUserInput = { user_id: 1 };
    const result = await getCatsByUser(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Fluffy');
    expect(result[0].user_id).toEqual(1);
  });
});
