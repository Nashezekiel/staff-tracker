import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, loginSchema, insertCheckInSchema, userUpdateSchema, checkOutSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import * as crypto from "crypto";
import * as qrcode from "qrcode";
import { addMonths, differenceInMinutes } from "date-fns";
// import Stripe from "stripe";

// Initialize Stripe if API key is available - commented out
// const stripe = null;

// QR Code generation with workspace identifier for security
const generateQRCode = async (userId: number): Promise<string> => {
  const qrData = JSON.stringify({
    userId,
    workspace: "techie",
    timestamp: Date.now(),
    token: crypto.randomBytes(16).toString("hex"),
  });
  
  try {
    const qrImage = await qrcode.toDataURL(qrData);
    return qrImage;
  } catch (error) {
    console.error("QR code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the database if we're using a PostgreSQL storage implementation
  if (typeof (storage as any).initializeDatabase === 'function') {
    try {
      await (storage as any).initializeDatabase();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }
  // Session authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // User registration
  app.post("/api/register", async (req, res) => {
    try {
      try {
        insertUserSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password in a real application
      // For simplicity, we're not hashing here
      const user = await storage.createUser(req.body);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // User login
  app.post("/api/login", async (req, res) => {
    try {
      try {
        loginSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }

      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      if (req.session) {
        req.session.userId = user.id;
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User logout
  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "No active session" });
    }
  });

  // Get current user
  app.get("/api/users/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      const allUsers = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user
  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Ensure user can only modify their own account unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot modify other users" });
        }
      }

      try {
        userUpdateSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Delete user (admin only)
  app.delete("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Ensure only admins can delete users
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Change user plan
  app.post("/api/users/change-plan", isAuthenticated, async (req: any, res) => {
    try {
      const { planType } = req.body;
      
      if (!["hourly", "daily", "weekly", "monthly"].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }
      
      const userId = req.session.userId;
      const user = await storage.updateUser(userId, { currentPlan: planType });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a billing record
      const planRates: Record<string, number> = {
        hourly: 500,
        daily: 4000,
        weekly: 20000,
        monthly: 68000
      };
      
      await storage.createBilling({
        userId,
        planType,
        amount: planRates[planType],
        startDate: new Date(),
        status: "pending"
      });
      
      res.json({ message: "Plan updated successfully" });
    } catch (error) {
      console.error("Change plan error:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Generate QR code
  app.post("/api/qrcode/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const qrCode = await generateQRCode(userId);
      const expiryDate = addMonths(new Date(), 1);
      
      // Update user with new QR code
      await storage.updateUser(userId, {
        qrCode,
        qrExpiry: expiryDate
      });
      
      res.json({ qrCode, expiryDate });
    } catch (error) {
      console.error("QR code generation error:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Get current QR code
  app.get("/api/qrcode/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.qrCode || !user.qrExpiry || new Date(user.qrExpiry) < new Date()) {
        return res.status(404).json({ message: "No valid QR code found" });
      }
      
      res.json({ qrCode: user.qrCode, expiryDate: user.qrExpiry });
    } catch (error) {
      console.error("Get QR code error:", error);
      res.status(500).json({ message: "Failed to retrieve QR code" });
    }
  });

  // Check in
  app.post("/api/check-ins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Check if user already has an active check-in
      const activeCheckIn = await storage.getActiveCheckIn(userId);
      if (activeCheckIn) {
        return res.status(400).json({ message: "You already have an active check-in" });
      }

      const checkIn = await storage.createCheckIn({
        userId,
        checkInTime: new Date(),
        status: "active"
      });
      
      res.status(201).json(checkIn);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // Check out
  app.patch("/api/check-ins/:id/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const checkInId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      const checkIn = await storage.getCheckIn(checkInId);
      if (!checkIn) {
        return res.status(404).json({ message: "Check-in record not found" });
      }
      
      if (checkIn.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not your check-in record" });
      }
      
      if (checkIn.status !== "active") {
        return res.status(400).json({ message: "This check-in is already completed" });
      }
      
      const now = new Date();
      const duration = differenceInMinutes(now, new Date(checkIn.checkInTime));
      
      const updatedCheckIn = await storage.updateCheckIn(checkInId, {
        checkOutTime: now,
        status: "completed",
        duration
      });
      
      res.json(updatedCheckIn);
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  // Get current check-in status
  app.get("/api/check-ins/current/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only view their own check-ins unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' check-ins" });
        }
      }
      
      const checkIn = await storage.getActiveCheckIn(userId);
      res.json(checkIn || null);
    } catch (error) {
      console.error("Get current check-in error:", error);
      res.status(500).json({ message: "Failed to get check-in status" });
    }
  });

  // Get user's recent activity
  app.get("/api/users/:userId/recent-activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only view their own activity unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' activity" });
        }
      }
      
      const recentActivity = await storage.getRecentCheckIns(userId, 5);
      res.json(recentActivity);
    } catch (error) {
      console.error("Get recent activity error:", error);
      res.status(500).json({ message: "Failed to get recent activity" });
    }
  });

  // Get weekly usage
  app.get("/api/users/:userId/weekly-usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only view their own usage unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' usage" });
        }
      }
      
      const weeklyUsage = await storage.getWeeklyUsage(userId);
      res.json(weeklyUsage);
    } catch (error) {
      console.error("Get weekly usage error:", error);
      res.status(500).json({ message: "Failed to get weekly usage" });
    }
  });

  // Get weekly analytics
  app.get("/api/users/:userId/analytics/weekly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only view their own analytics unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' analytics" });
        }
      }
      
      const weeklyAnalytics = await storage.getWeeklyAnalytics(userId);
      res.json(weeklyAnalytics);
    } catch (error) {
      console.error("Get weekly analytics error:", error);
      res.status(500).json({ message: "Failed to get weekly analytics" });
    }
  });

  // Get billing history
  app.get("/api/billings/:userId/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only view their own billing unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' billing" });
        }
      }
      
      const billingHistory = await storage.getBillingHistory(userId);
      res.json(billingHistory);
    } catch (error) {
      console.error("Get billing history error:", error);
      res.status(500).json({ message: "Failed to get billing history" });
    }
  });

  // Stripe payment integration - Commented out per user request
  /*
  if (stripe) {
    app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
      try {
        const { amount } = req.body;
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "ngn", // Nigerian Naira
          metadata: {
            userId: userId.toString(),
          },
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Payment intent error:", error);
        res.status(500).json({ message: "Failed to create payment intent" });
      }
    });
  }
  */

  // Reports routes
  app.get("/api/users/:userId/reports/attendance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const period = req.query.period as string || "monthly";
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      // Ensure user can only view their own reports unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' reports" });
        }
      }
      
      const attendanceReport = await storage.getAttendanceReport(userId, period, date);
      res.json(attendanceReport);
    } catch (error) {
      console.error("Get attendance report error:", error);
      res.status(500).json({ message: "Failed to get attendance report" });
    }
  });

  app.get("/api/users/:userId/reports/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const period = req.query.period as string || "monthly";
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      // Ensure user can only view their own reports unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' reports" });
        }
      }
      
      const usageReport = await storage.getUsageReport(userId, period, date);
      res.json(usageReport);
    } catch (error) {
      console.error("Get usage report error:", error);
      res.status(500).json({ message: "Failed to get usage report" });
    }
  });

  app.get("/api/users/:userId/reports/billing", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const period = req.query.period as string || "monthly";
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      // Ensure user can only view their own reports unless they're an admin
      if (req.session.userId !== userId) {
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Cannot view other users' reports" });
        }
      }
      
      const billingReport = await storage.getBillingReport(userId, period, date);
      res.json(billingReport);
    } catch (error) {
      console.error("Get billing report error:", error);
      res.status(500).json({ message: "Failed to get billing report" });
    }
  });

  // Payment methods (mock data for now)
  app.get("/api/users/:userId/payment-methods", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only view their own payment methods
      if (req.session.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Cannot view other users' payment methods" });
      }
      
      // For demo purposes, return an empty array
      res.json([]);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ message: "Failed to get payment methods" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
