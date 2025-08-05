
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type DeleteCatInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCat = async (input: DeleteCatInput): Promise<{ success: boolean }> => {
  try {
    // Check if cat exists first
    const existingCat = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, input.id))
      .execute();

    if (existingCat.length === 0) {
      throw new Error(`Cat with id ${input.id} not found`);
    }

    // Delete the cat - cascading deletes will handle photos automatically
    const result = await db.delete(catsTable)
      .where(eq(catsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Cat deletion failed:', error);
    throw error;
  }
};
