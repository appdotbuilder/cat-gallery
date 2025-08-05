
import { db } from '../db';
import { photosTable, catsTable } from '../db/schema';
import { type CreatePhotoInput, type Photo } from '../schema';
import { eq } from 'drizzle-orm';

export const createPhoto = async (input: CreatePhotoInput): Promise<Photo> => {
  try {
    // Validate that the cat exists
    const existingCat = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, input.cat_id))
      .execute();

    if (existingCat.length === 0) {
      throw new Error(`Cat with id ${input.cat_id} not found`);
    }

    // If this photo is set as primary, update other photos for this cat to not be primary
    if (input.is_primary) {
      await db.update(photosTable)
        .set({ is_primary: false })
        .where(eq(photosTable.cat_id, input.cat_id))
        .execute();
    }

    // Insert the new photo record
    const result = await db.insert(photosTable)
      .values({
        cat_id: input.cat_id,
        url: input.url,
        filename: input.filename,
        file_size: input.file_size,
        mime_type: input.mime_type,
        caption: input.caption,
        is_primary: input.is_primary
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Photo creation failed:', error);
    throw error;
  }
};
