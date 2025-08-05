
import { db } from '../db';
import { catsTable, photosTable } from '../db/schema';
import { type GetCatByIdInput, type CatWithPhotos } from '../schema';
import { eq } from 'drizzle-orm';

export const getCatById = async (input: GetCatByIdInput): Promise<CatWithPhotos | null> => {
  try {
    // Query cat with its photos using a join
    const results = await db.select()
      .from(catsTable)
      .leftJoin(photosTable, eq(photosTable.cat_id, catsTable.id))
      .where(eq(catsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Group photos by cat (there should only be one cat, but photos might be multiple)
    const catData = results[0].cats;
    const photos = results
      .map(result => result.photos)
      .filter(photo => photo !== null); // Filter out null photos from left join

    return {
      id: catData.id,
      name: catData.name,
      breed: catData.breed,
      age: catData.age,
      description: catData.description,
      user_id: catData.user_id,
      created_at: catData.created_at,
      photos: photos
    };
  } catch (error) {
    console.error('Get cat by ID failed:', error);
    throw error;
  }
};
