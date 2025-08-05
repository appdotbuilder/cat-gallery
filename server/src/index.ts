
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  createCatInputSchema,
  createPhotoInputSchema,
  updateCatInputSchema,
  updatePhotoInputSchema,
  getCatsByUserInputSchema,
  getPhotosByCatInputSchema,
  getCatByIdInputSchema,
  deletePhotoInputSchema,
  deleteCatInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createCat } from './handlers/create_cat';
import { createPhoto } from './handlers/create_photo';
import { getCatsByUser } from './handlers/get_cats_by_user';
import { getCatById } from './handlers/get_cat_by_id';
import { getPhotosByCat } from './handlers/get_photos_by_cat';
import { updateCat } from './handlers/update_cat';
import { updatePhoto } from './handlers/update_photo';
import { deletePhoto } from './handlers/delete_photo';
import { deleteCat } from './handlers/delete_cat';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Cat management
  createCat: publicProcedure
    .input(createCatInputSchema)
    .mutation(({ input }) => createCat(input)),

  getCatsByUser: publicProcedure
    .input(getCatsByUserInputSchema)
    .query(({ input }) => getCatsByUser(input)),

  getCatById: publicProcedure
    .input(getCatByIdInputSchema)
    .query(({ input }) => getCatById(input)),

  updateCat: publicProcedure
    .input(updateCatInputSchema)
    .mutation(({ input }) => updateCat(input)),

  deleteCat: publicProcedure
    .input(deleteCatInputSchema)
    .mutation(({ input }) => deleteCat(input)),

  // Photo management
  createPhoto: publicProcedure
    .input(createPhotoInputSchema)
    .mutation(({ input }) => createPhoto(input)),

  getPhotosByCat: publicProcedure
    .input(getPhotosByCatInputSchema)
    .query(({ input }) => getPhotosByCat(input)),

  updatePhoto: publicProcedure
    .input(updatePhotoInputSchema)
    .mutation(({ input }) => updatePhoto(input)),

  deletePhoto: publicProcedure
    .input(deletePhotoInputSchema)
    .mutation(({ input }) => deletePhoto(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
