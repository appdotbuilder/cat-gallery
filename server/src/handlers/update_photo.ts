
import { db } from '../db';
import { photosTable } from '../db/schema';
import { type UpdatePhotoInput, type Photo } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updatePhoto = async (input: UpdatePhotoInput): Promise<Photo> => {
  try {
    // If setting is_primary to true, first set all other photos for this cat to false
    if (input.is_primary === true) {
      // Get the cat_id for this photo first
      const photo = await db.select({ cat_id: photosTable.cat_id })
        .from(photosTable)
        .where(eq(photosTable.id, input.id))
        .execute();

      if (photo.length === 0) {
        throw new Error('Photo not found');
      }

      // Set all other photos for this cat to is_primary = false
      await db.update(photosTable)
        .set({ is_primary: false })
        .where(and(
          eq(photosTable.cat_id, photo[0].cat_id),
          eq(photosTable.is_primary, true)
        ))
        .execute();
    }

    // Build update object with only provided fields
    const updateData: { caption?: string | null; is_primary?: boolean } = {};
    
    if (input.caption !== undefined) {
      updateData.caption = input.caption;
    }
    
    if (input.is_primary !== undefined) {
      updateData.is_primary = input.is_primary;
    }

    // Update the photo
    const result = await db.update(photosTable)
      .set(updateData)
      .where(eq(photosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Photo not found');
    }

    return result[0];
  } catch (error) {
    console.error('Photo update failed:', error);
    throw error;
  }
};
