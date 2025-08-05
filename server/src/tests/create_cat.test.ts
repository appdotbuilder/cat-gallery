
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, usersTable } from '../db/schema';
import { type CreateCatInput, type CreateUserInput } from '../schema';
import { createCat } from '../handlers/create_cat';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<number> => {
  const userInput: CreateUserInput = {
    username: 'testuser',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  const result = await db.insert(usersTable)
    .values(userInput)
    .returning()
    .execute();

  return result[0].id;
};

// Test input with all fields
const testInput: CreateCatInput = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3,
  description: 'A beautiful fluffy cat',
  user_id: 0 // Will be set by test
};

describe('createCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cat with all fields', async () => {
    const userId = await createTestUser();
    const input = { ...testInput, user_id: userId };

    const result = await createCat(input);

    // Basic field validation
    expect(result.name).toEqual('Fluffy');
    expect(result.breed).toEqual('Persian');
    expect(result.age).toEqual(3);
    expect(result.description).toEqual('A beautiful fluffy cat');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a cat with nullable fields as null', async () => {
    const userId = await createTestUser();
    const input: CreateCatInput = {
      name: 'Simple Cat',
      breed: null,
      age: null,
      description: null,
      user_id: userId
    };

    const result = await createCat(input);

    expect(result.name).toEqual('Simple Cat');
    expect(result.breed).toBeNull();
    expect(result.age).toBeNull();
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save cat to database', async () => {
    const userId = await createTestUser();
    const input = { ...testInput, user_id: userId };

    const result = await createCat(input);

    // Query database to verify cat was saved
    const cats = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, result.id))
      .execute();

    expect(cats).toHaveLength(1);
    expect(cats[0].name).toEqual('Fluffy');
    expect(cats[0].breed).toEqual('Persian');
    expect(cats[0].age).toEqual(3);
    expect(cats[0].description).toEqual('A beautiful fluffy cat');
    expect(cats[0].user_id).toEqual(userId);
    expect(cats[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testInput, user_id: 999 }; // Non-existent user ID

    await expect(createCat(input)).rejects.toThrow(/user with id 999 not found/i);
  });

  it('should create multiple cats for the same user', async () => {
    const userId = await createTestUser();
    
    const cat1Input = { ...testInput, name: 'Cat 1', user_id: userId };
    const cat2Input = { ...testInput, name: 'Cat 2', user_id: userId };

    const result1 = await createCat(cat1Input);
    const result2 = await createCat(cat2Input);

    expect(result1.name).toEqual('Cat 1');
    expect(result2.name).toEqual('Cat 2');
    expect(result1.user_id).toEqual(userId);
    expect(result2.user_id).toEqual(userId);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both cats exist in database
    const cats = await db.select()
      .from(catsTable)
      .where(eq(catsTable.user_id, userId))
      .execute();

    expect(cats).toHaveLength(2);
  });
});
