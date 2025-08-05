
import { db } from '../db';
import { photosTable } from '../db/schema';
import { type GetPhotosByCatInput, type Photo } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPhotosByCat = async (input: GetPhotosByCatInput): Promise<Photo[]> => {
  try {
    // Query photos for the specific cat, ordered by primary photo first, then by creation date descending
    const results = await db.select()
      .from(photosTable)
      .where(eq(photosTable.cat_id, input.cat_id))
      .orderBy(desc(photosTable.is_primary), desc(photosTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get photos by cat:', error);
    throw error;
  }
};
