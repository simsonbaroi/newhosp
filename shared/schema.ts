import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Medical items table
export const medicalItems = pgTable("medical_items", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isOutpatient: boolean("is_outpatient").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalItemSchema = createInsertSchema(medicalItems).omit({
  id: true,
  createdAt: true,
});

export type InsertMedicalItem = z.infer<typeof insertMedicalItemSchema>;
export type MedicalItem = typeof medicalItems.$inferSelect;

// Bills table for saved calculations
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["outpatient", "inpatient"] }).notNull(),
  sessionId: text("session_id").notNull(), // For browser session persistence
  billData: text("bill_data").notNull(), // JSON string of bill items
  daysAdmitted: integer("days_admitted").default(1),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;
