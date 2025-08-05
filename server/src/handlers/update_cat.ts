
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type UpdateCatInput, type Cat } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCat = async (input: UpdateCatInput): Promise<Cat> => {
  try {
    // First, check if the cat exists
    const existingCat = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, input.id))
      .execute();

    if (existingCat.length === 0) {
      throw new Error(`Cat with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof catsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.breed !== undefined) {
      updateData.breed = input.breed;
    }
    if (input.age !== undefined) {
      updateData.age = input.age;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return existingCat[0];
    }

    // Update the cat record
    const result = await db.update(catsTable)
      .set(updateData)
      .where(eq(catsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Cat update failed:', error);
    throw error;
  }
};
