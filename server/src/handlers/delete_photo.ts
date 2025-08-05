
import { db } from '../db';
import { photosTable } from '../db/schema';
import { type DeletePhotoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deletePhoto = async (input: DeletePhotoInput): Promise<{ success: boolean }> => {
  try {
    // Delete the photo record
    const result = await db.delete(photosTable)
      .where(eq(photosTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Photo deletion failed:', error);
    throw error;
  }
};
