
import { serial, text, pgTable, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  display_name: varchar('display_name', { length: 100 }),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const catsTable = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  breed: varchar('breed', { length: 100 }),
  age: integer('age'),
  description: text('description'),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull().references(() => catsTable.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: varchar('mime_type', { length: 50 }).notNull(),
  caption: text('caption'),
  is_primary: boolean('is_primary').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  cats: many(catsTable),
}));

export const catsRelations = relations(catsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [catsTable.user_id],
    references: [usersTable.id],
  }),
  photos: many(photosTable),
}));

export const photosRelations = relations(photosTable, ({ one }) => ({
  cat: one(catsTable, {
    fields: [photosTable.cat_id],
    references: [catsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Cat = typeof catsTable.$inferSelect;
export type NewCat = typeof catsTable.$inferInsert;
export type Photo = typeof photosTable.$inferSelect;
export type NewPhoto = typeof photosTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  cats: catsTable, 
  photos: photosTable 
};
