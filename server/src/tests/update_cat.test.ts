
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, catsTable } from '../db/schema';
import { type UpdateCatInput } from '../schema';
import { updateCat } from '../handlers/update_cat';
import { eq } from 'drizzle-orm';

describe('updateCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a cat with all fields', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a cat to update
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Original Cat',
        breed: 'Persian',
        age: 3,
        description: 'A fluffy cat',
        user_id: userId
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Update the cat
    const updateInput: UpdateCatInput = {
      id: catId,
      name: 'Updated Cat',
      breed: 'Maine Coon',
      age: 5,
      description: 'An updated fluffy cat'
    };

    const result = await updateCat(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(catId);
    expect(result.name).toEqual('Updated Cat');
    expect(result.breed).toEqual('Maine Coon');
    expect(result.age).toEqual(5);
    expect(result.description).toEqual('An updated fluffy cat');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        display_name: 'Test User 2',
        avatar_url: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a cat to update
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Original Cat',
        breed: 'Persian',
        age: 3,
        description: 'A fluffy cat',
        user_id: userId
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Update only the name and age
    const updateInput: UpdateCatInput = {
      id: catId,
      name: 'Partially Updated Cat',
      age: 4
    };

    const result = await updateCat(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated Cat');
    expect(result.age).toEqual(4);
    
    // Verify unchanged fields
    expect(result.breed).toEqual('Persian');
    expect(result.description).toEqual('A fluffy cat');
    expect(result.user_id).toEqual(userId);
  });

  it('should handle null values correctly', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser3',
        email: 'test3@example.com',
        display_name: 'Test User 3',
        avatar_url: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a cat with non-null values
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Cat with Details',
        breed: 'Siamese',
        age: 2,
        description: 'A detailed cat',
        user_id: userId
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Update to null values
    const updateInput: UpdateCatInput = {
      id: catId,
      breed: null,
      age: null,
      description: null
    };

    const result = await updateCat(updateInput);

    // Verify null values are set
    expect(result.name).toEqual('Cat with Details'); // Unchanged
    expect(result.breed).toBeNull();
    expect(result.age).toBeNull();
    expect(result.description).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser4',
        email: 'test4@example.com',
        display_name: 'Test User 4',
        avatar_url: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a cat to update
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Database Test Cat',
        breed: 'Tabby',
        age: 1,
        description: 'Testing database persistence',
        user_id: userId
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Update the cat
    const updateInput: UpdateCatInput = {
      id: catId,
      name: 'Updated Database Cat',
      age: 2
    };

    await updateCat(updateInput);

    // Query the database directly to verify changes were saved
    const savedCat = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, catId))
      .execute();

    expect(savedCat).toHaveLength(1);
    expect(savedCat[0].name).toEqual('Updated Database Cat');
    expect(savedCat[0].age).toEqual(2);
    expect(savedCat[0].breed).toEqual('Tabby'); // Unchanged
    expect(savedCat[0].description).toEqual('Testing database persistence'); // Unchanged
  });

  it('should return unchanged cat when no fields provided', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser5',
        email: 'test5@example.com',
        display_name: 'Test User 5',
        avatar_url: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a cat
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Unchanged Cat',
        breed: 'Russian Blue',
        age: 6,
        description: 'Should remain the same',
        user_id: userId
      })
      .returning()
      .execute();

    const catId = catResult[0].id;
    const originalCreatedAt = catResult[0].created_at;

    // Update with no fields
    const updateInput: UpdateCatInput = {
      id: catId
    };

    const result = await updateCat(updateInput);

    // Verify all fields remain unchanged
    expect(result.id).toEqual(catId);
    expect(result.name).toEqual('Unchanged Cat');
    expect(result.breed).toEqual('Russian Blue');
    expect(result.age).toEqual(6);
    expect(result.description).toEqual('Should remain the same');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toEqual(originalCreatedAt);
  });

  it('should throw error when cat does not exist', async () => {
    const updateInput: UpdateCatInput = {
      id: 99999,
      name: 'Non-existent Cat'
    };

    expect(updateCat(updateInput)).rejects.toThrow(/Cat with id 99999 not found/i);
  });
});
