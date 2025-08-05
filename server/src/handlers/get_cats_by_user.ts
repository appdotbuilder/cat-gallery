
import { db } from '../db';
import { catsTable, photosTable } from '../db/schema';
import { type GetCatsByUserInput, type CatWithPhotos } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getCatsByUser = async (input: GetCatsByUserInput): Promise<CatWithPhotos[]> => {
  try {
    // Get all cats for the user with their photos via left join
    const results = await db.select()
      .from(catsTable)
      .leftJoin(photosTable, eq(catsTable.id, photosTable.cat_id))
      .where(eq(catsTable.user_id, input.user_id))
      .orderBy(desc(catsTable.created_at), desc(photosTable.created_at))
      .execute();

    // Group results by cat to build the nested structure
    const catsMap = new Map<number, CatWithPhotos>();

    for (const result of results) {
      const cat = result.cats;
      const photo = result.photos;

      if (!catsMap.has(cat.id)) {
        catsMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          breed: cat.breed,
          age: cat.age,
          description: cat.description,
          user_id: cat.user_id,
          created_at: cat.created_at,
          photos: []
        });
      }

      // Add photo if it exists (left join might return null photos)
      if (photo) {
        catsMap.get(cat.id)!.photos.push({
          id: photo.id,
          cat_id: photo.cat_id,
          url: photo.url,
          filename: photo.filename,
          file_size: photo.file_size,
          mime_type: photo.mime_type,
          caption: photo.caption,
          is_primary: photo.is_primary,
          created_at: photo.created_at
        });
      }
    }

    return Array.from(catsMap.values());
  } catch (error) {
    console.error('Failed to get cats by user:', error);
    throw error;
  }
};
