import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Medical item prices table
export const medicalItemPrices = sqliteTable("medical_item_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("BDT"),
  description: text("description"),
  isOutpatient: integer("is_outpatient", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertMedicalItemPriceSchema = createInsertSchema(medicalItemPrices).omit({
  id: true,
  createdAt: true,
});

export type InsertMedicalItemPrice = z.infer<typeof insertMedicalItemPriceSchema>;
export type MedicalItemPrice = typeof medicalItemPrices.$inferSelect;

export type MedicalItem = MedicalItemPrice;
export type InsertMedicalItem = InsertMedicalItemPrice;

// Bills table
export const bills = sqliteTable("bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["outpatient", "inpatient"] }).notNull(),
  sessionId: text("session_id").notNull(),
  billData: text("bill_data").notNull(),
  daysAdmitted: integer("days_admitted").default(1),
  total: real("total").notNull(),
  currency: text("currency").notNull().default("BDT"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;

// App Settings table
export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appName: text("app_name").notNull().default("Hospital Bill Calculator"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull().default("222.2 47.4% 11.2%"), // HSL
  secondaryColor: text("secondary_color").notNull().default("210 40% 96.1%"),
  accentColor: text("accent_color").notNull().default("210 40% 96.1%"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// Categories table for dynamic category management
export const itemCategories = sqliteTable("item_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isOutpatient: integer("is_outpatient", { mode: "boolean" }).notNull(),
  order: integer("order").notNull().default(0),
});

export const insertItemCategorySchema = createInsertSchema(itemCategories).omit({
  id: true,
});

export type ItemCategory = typeof itemCategories.$inferSelect;
export type InsertItemCategory = z.infer<typeof insertItemCategorySchema>;
