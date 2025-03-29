import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // user, manager, admin
  qrCode: text("qr_code"),
  qrExpiry: timestamp("qr_expiry"),
  currentPlan: text("current_plan").default("hourly"), // hourly, daily, weekly, monthly
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Check-ins table
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  checkInTime: timestamp("check_in_time").notNull().defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  status: text("status").notNull().default("active"), // active, completed
  duration: integer("duration"), // in minutes
});

// Billing table
export const billings = pgTable("billings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planType: text("plan_type").notNull(), // hourly, daily, weekly, monthly
  amount: integer("amount").notNull(), // in local currency
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  paymentMethod: text("payment_method"),
  paymentId: text("payment_id"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  qrCode: true,
  qrExpiry: true,
  stripeCustomerId: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  checkOutTime: true,
  duration: true,
});

export const insertBillingSchema = createInsertSchema(billings).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

export type InsertBilling = z.infer<typeof insertBillingSchema>;
export type Billing = typeof billings.$inferSelect;

// Additional schemas for operations
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const checkOutSchema = z.object({
  checkInId: z.number(),
});

export const userUpdateSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  currentPlan: z.enum(["hourly", "daily", "weekly", "monthly"]).optional(),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type CheckOutData = z.infer<typeof checkOutSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
