
import { db } from '../db';
import { catsTable, usersTable } from '../db/schema';
import { type CreateCatInput, type Cat } from '../schema';
import { eq } from 'drizzle-orm';

export const createCat = async (input: CreateCatInput): Promise<Cat> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Insert cat record
    const result = await db.insert(catsTable)
      .values({
        name: input.name,
        breed: input.breed,
        age: input.age,
        description: input.description,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Cat creation failed:', error);
    throw error;
  }
};
