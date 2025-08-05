
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.display_name).toEqual('Test User');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].display_name).toEqual('Test User');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields', async () => {
    const inputWithNulls: CreateUserInput = {
      username: 'minimalist',
      email: 'minimal@example.com',
      display_name: null,
      avatar_url: null
    };

    const result = await createUser(inputWithNulls);

    expect(result.username).toEqual('minimalist');
    expect(result.email).toEqual('minimal@example.com');
    expect(result.display_name).toBeNull();
    expect(result.avatar_url).toBeNull();
  });

  it('should enforce unique username constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same username
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com', // Different email
      display_name: 'Different User',
      avatar_url: null
    };

    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/duplicate/i);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com', // Same email
      display_name: 'Different User',
      avatar_url: null
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate/i);
  });
});
