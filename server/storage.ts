import { 
  users, checkIns, billings, 
  type User, type InsertUser, type CheckIn, type InsertCheckIn, 
  type Billing, type InsertBilling, type UserUpdate, type CheckOutData 
} from "@shared/schema";
import { startOfWeek, endOfWeek, format, subDays, setDay } from "date-fns";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { db } from "./db";

// PostgreSQL implementation

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Check-in operations
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getCheckIn(id: number): Promise<CheckIn | undefined>;
  updateCheckIn(id: number, data: Partial<CheckIn>): Promise<CheckIn | undefined>;
  getActiveCheckIn(userId: number): Promise<CheckIn | undefined>;
  getRecentCheckIns(userId: number, limit: number): Promise<CheckIn[]>;
  
  // Billing operations
  createBilling(billing: InsertBilling): Promise<Billing>;
  getBillingHistory(userId: number): Promise<Billing[]>;
  
  // Analytics operations
  getWeeklyUsage(userId: number): Promise<{ totalMinutes: number; weeklyLimit: number }>;
  getWeeklyAnalytics(userId: number): Promise<any[]>;
  
  // Reports operations
  getAttendanceReport(userId: number, period: string, date: Date): Promise<CheckIn[]>;
  getUsageReport(userId: number, period: string, date: Date): Promise<any>;
  getBillingReport(userId: number, period: string, date: Date): Promise<Billing[]>;
}

export class PostgresStorage implements IStorage {
  async initializeDatabase() {
    console.log("Initializing database...");
    
    // Create superadmin account if it doesn't exist
    const existingAdmin = await db.select().from(users).where(eq(users.username, "superadmin"));
    
    if (existingAdmin.length === 0) {
      console.log("Creating superadmin account...");
      await db.insert(users).values({
        username: "superadmin",
        password: "Tech!e2025", // This would ideally be hashed
        email: "admin@techie.com",
        fullName: "Super Admin",
        role: "admin",
        currentPlan: "monthly"
      });
    }
  }
  
  constructor() {
    // We'll call initializeDatabase from routes.ts
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Delete related check-ins and billings first (due to foreign key constraints)
      await db.delete(checkIns).where(eq(checkIns.userId, id));
      await db.delete(billings).where(eq(billings.userId, id));
      
      // Delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Check-in operations
  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const result = await db.insert(checkIns).values({
      ...insertCheckIn,
      checkInTime: insertCheckIn.checkInTime || new Date(),
      status: insertCheckIn.status || "active"
    }).returning();
    return result[0];
  }

  async getCheckIn(id: number): Promise<CheckIn | undefined> {
    const result = await db.select().from(checkIns).where(eq(checkIns.id, id));
    return result[0];
  }

  async updateCheckIn(id: number, data: Partial<CheckIn>): Promise<CheckIn | undefined> {
    const result = await db.update(checkIns).set(data).where(eq(checkIns.id, id)).returning();
    return result[0];
  }

  async getActiveCheckIn(userId: number): Promise<CheckIn | undefined> {
    const result = await db.select().from(checkIns).where(
      and(
        eq(checkIns.userId, userId),
        eq(checkIns.status, "active")
      )
    );
    return result[0];
  }

  async getRecentCheckIns(userId: number, limit: number): Promise<CheckIn[]> {
    return db.select().from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.checkInTime))
      .limit(limit);
  }

  // Billing operations
  async createBilling(insertBilling: InsertBilling): Promise<Billing> {
    const result = await db.insert(billings).values({
      ...insertBilling,
      status: insertBilling.status || "pending"
    }).returning();
    return result[0];
  }

  async getBillingHistory(userId: number): Promise<Billing[]> {
    return db.select().from(billings)
      .where(eq(billings.userId, userId))
      .orderBy(desc(billings.startDate));
  }

  // Analytics operations
  async getWeeklyUsage(userId: number): Promise<{ totalMinutes: number; weeklyLimit: number }> {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    
    // Get all check-ins for the week
    const weeklyCheckIns = await db.select().from(checkIns).where(
      and(
        eq(checkIns.userId, userId),
        gte(checkIns.checkInTime, start),
        lte(checkIns.checkInTime, end)
      )
    );
    
    // Calculate total minutes
    let totalMinutes = 0;
    
    for (const checkIn of weeklyCheckIns) {
      if (checkIn.status === "completed" && checkIn.duration) {
        totalMinutes += checkIn.duration;
      } else if (checkIn.status === "active") {
        // For active check-ins, calculate duration from check-in time to now
        const checkInTime = new Date(checkIn.checkInTime).getTime();
        const now = new Date().getTime();
        const durationMs = now - checkInTime;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        totalMinutes += durationMinutes;
      }
    }
    
    // Weekly limit based on plan (in minutes)
    const planLimits: Record<string, number> = {
      hourly: 20 * 60, // 20 hours per week
      daily: 40 * 60, // 40 hours per week
      weekly: 50 * 60, // 50 hours per week
      monthly: 60 * 60 // 60 hours per week
    };
    
    const user = await this.getUser(userId);
    const weeklyLimit = user && user.currentPlan ? planLimits[user.currentPlan] : planLimits.hourly;
    
    return { totalMinutes, weeklyLimit };
  }

  async getWeeklyAnalytics(userId: number): Promise<any[]> {
    const daysOfWeek = [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];
    
    const now = new Date();
    const dayAnalytics = [];
    
    for (let i = 0; i < daysOfWeek.length; i++) {
      const dayOfWeek = setDay(now, i + 1, { weekStartsOn: 1 });
      const dayStart = new Date(dayOfWeek);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayOfWeek);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get all check-ins for the day
      const dayCheckIns = await db.select().from(checkIns).where(
        and(
          eq(checkIns.userId, userId),
          gte(checkIns.checkInTime, dayStart),
          lte(checkIns.checkInTime, dayEnd)
        )
      );
      
      // Calculate total minutes for the day
      let totalMinutes = 0;
      
      for (const checkIn of dayCheckIns) {
        if (checkIn.status === "completed" && checkIn.duration) {
          totalMinutes += checkIn.duration;
        } else if (checkIn.status === "active") {
          // For active check-ins, calculate duration from check-in time to now
          const checkInTime = new Date(checkIn.checkInTime).getTime();
          const now = new Date().getTime();
          const durationMs = now - checkInTime;
          const durationMinutes = Math.floor(durationMs / (1000 * 60));
          totalMinutes += durationMinutes;
        }
      }
      
      // Calculate percentage relative to 8 hours (480 minutes)
      const percentage = Math.min(Math.round((totalMinutes / 480) * 100), 100);
      
      dayAnalytics.push({
        day: daysOfWeek[i],
        minutes: totalMinutes,
        hours: totalMinutes / 60,
        percentage
      });
    }
    
    return dayAnalytics;
  }

  // Report operations
  async getAttendanceReport(userId: number, period: string, date: Date): Promise<CheckIn[]> {
    let startDate: Date, endDate: Date;
    
    switch (period) {
      case "daily":
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case "monthly":
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "yearly":
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
    }
    
    // Get all check-ins for the period
    return db.select().from(checkIns).where(
      and(
        eq(checkIns.userId, userId),
        gte(checkIns.checkInTime, startDate),
        lte(checkIns.checkInTime, endDate)
      )
    ).orderBy(desc(checkIns.checkInTime));
  }

  async getUsageReport(userId: number, period: string, date: Date): Promise<any> {
    const attendanceData = await this.getAttendanceReport(userId, period, date);
    
    // Calculate total minutes
    let totalMinutes = 0;
    for (const checkIn of attendanceData) {
      if (checkIn.status === "completed" && checkIn.duration) {
        totalMinutes += checkIn.duration;
      } else if (checkIn.status === "active") {
        const checkInTime = new Date(checkIn.checkInTime).getTime();
        const now = new Date().getTime();
        const durationMs = now - checkInTime;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        totalMinutes += durationMinutes;
      }
    }
    
    // Get day breakdown
    const dayAnalytics = await this.getWeeklyAnalytics(userId);
    
    // Find peak usage day
    let peakDay = "None";
    let maxMinutes = 0;
    
    for (const day of dayAnalytics) {
      if (day.minutes > maxMinutes) {
        maxMinutes = day.minutes;
        peakDay = day.day;
      }
    }
    
    // Calculate average daily minutes
    const activeDays = dayAnalytics.filter(day => day.minutes > 0).length || 1;
    const avgDailyMinutes = Math.round(totalMinutes / activeDays);
    
    return {
      totalMinutes,
      avgDailyMinutes,
      peakDay,
      dayBreakdown: dayAnalytics
    };
  }

  async getBillingReport(userId: number, period: string, date: Date): Promise<Billing[]> {
    let startDate: Date, endDate: Date;
    
    switch (period) {
      case "daily":
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case "monthly":
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "yearly":
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
    }
    
    // Get all billings for the period
    return db.select().from(billings).where(
      and(
        eq(billings.userId, userId),
        gte(billings.startDate, startDate),
        lte(billings.startDate, endDate)
      )
    ).orderBy(desc(billings.startDate));
  }
}

// Create PostgreSQL storage instance instead of MemStorage
export const storage = new PostgresStorage();
