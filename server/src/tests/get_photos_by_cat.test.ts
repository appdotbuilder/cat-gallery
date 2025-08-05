
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable, photosTable } from '../db/schema';
import { type GetPhotosByCatInput } from '../schema';
import { getPhotosByCat } from '../handlers/get_photos_by_cat';

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: null
};

const testCat = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3,
  description: 'A fluffy cat',
  user_id: 1
};

const testPhoto1 = {
  cat_id: 1,
  url: 'https://example.com/photo1.jpg',
  filename: 'photo1.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  caption: 'First photo',
  is_primary: false
};

const testPhoto2 = {
  cat_id: 1,
  url: 'https://example.com/photo2.jpg',
  filename: 'photo2.jpg',
  file_size: 2048,
  mime_type: 'image/jpeg',
  caption: 'Primary photo',
  is_primary: true
};

const testPhoto3 = {
  cat_id: 1,
  url: 'https://example.com/photo3.jpg',
  filename: 'photo3.jpg',
  file_size: 1536,
  mime_type: 'image/jpeg',
  caption: null,
  is_primary: false
};

describe('getPhotosByCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when cat has no photos', async () => {
    // Create user and cat first
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values(testCat).execute();

    const input: GetPhotosByCatInput = { cat_id: 1 };
    const result = await getPhotosByCat(input);

    expect(result).toEqual([]);
  });

  it('should return all photos for a specific cat', async () => {
    // Create user and cat first
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values(testCat).execute();

    // Create photos
    await db.insert(photosTable).values([testPhoto1, testPhoto2, testPhoto3]).execute();

    const input: GetPhotosByCatInput = { cat_id: 1 };
    const result = await getPhotosByCat(input);

    expect(result).toHaveLength(3);
    
    // Verify all photos belong to the correct cat
    result.forEach(photo => {
      expect(photo.cat_id).toEqual(1);
      expect(photo.id).toBeDefined();
      expect(photo.created_at).toBeInstanceOf(Date);
    });

    // Check that specific photos are included
    const urls = result.map(p => p.url);
    expect(urls).toContain('https://example.com/photo1.jpg');
    expect(urls).toContain('https://example.com/photo2.jpg');
    expect(urls).toContain('https://example.com/photo3.jpg');
  });

  it('should order photos with primary photo first, then by creation date descending', async () => {
    // Create user and cat first
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values(testCat).execute();

    // Insert photos with slight delay to ensure different creation times
    await db.insert(photosTable).values(testPhoto1).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(photosTable).values(testPhoto3).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(photosTable).values(testPhoto2).execute(); // Primary photo created last

    const input: GetPhotosByCatInput = { cat_id: 1 };
    const result = await getPhotosByCat(input);

    expect(result).toHaveLength(3);

    // Primary photo should be first
    expect(result[0].is_primary).toBe(true);
    expect(result[0].caption).toEqual('Primary photo');

    // Non-primary photos should be ordered by creation date descending
    expect(result[1].is_primary).toBe(false);
    expect(result[2].is_primary).toBe(false);
    
    // The photo created later should come before the one created earlier
    expect(result[1].created_at.getTime()).toBeGreaterThanOrEqual(result[2].created_at.getTime());
  });

  it('should not return photos from other cats', async () => {
    // Create user and two cats
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values([
      testCat,
      { ...testCat, name: 'Whiskers' } // Second cat with same user_id
    ]).execute();

    // Create photos for both cats
    await db.insert(photosTable).values([
      testPhoto1, // cat_id: 1
      { ...testPhoto2, cat_id: 2 }, // cat_id: 2
      testPhoto3 // cat_id: 1
    ]).execute();

    const input: GetPhotosByCatInput = { cat_id: 1 };
    const result = await getPhotosByCat(input);

    expect(result).toHaveLength(2);
    result.forEach(photo => {
      expect(photo.cat_id).toEqual(1);
    });
  });

  it('should handle nullable fields correctly', async () => {
    // Create user and cat first
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(catsTable).values(testCat).execute();

    // Create photo with null caption
    await db.insert(photosTable).values(testPhoto3).execute();

    const input: GetPhotosByCatInput = { cat_id: 1 };
    const result = await getPhotosByCat(input);

    expect(result).toHaveLength(1);
    expect(result[0].caption).toBeNull();
    expect(result[0].url).toEqual('https://example.com/photo3.jpg');
    expect(result[0].filename).toEqual('photo3.jpg');
    expect(result[0].file_size).toEqual(1536);
    expect(result[0].mime_type).toEqual('image/jpeg');
    expect(result[0].is_primary).toBe(false);
  });
});
