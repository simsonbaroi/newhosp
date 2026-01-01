import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoints for deployment platforms
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'Hospital Bill Calculator',
      version: '1.0.0'
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'Hospital Bill Calculator API',
      database: 'connected'
    });
  });

  // Initialize database with default data
  await storage.initializeDatabase();

  // Medical Items API Routes
  app.get("/api/medical-items", async (req, res) => {
    try {
      const { type, category, search } = req.query;
      let items;

      if (search && typeof search === 'string') {
        const isOutpatient = type === 'outpatient';
        items = await storage.searchMedicalItems(search, isOutpatient);
      } else if (category && typeof category === 'string') {
        const isOutpatient = type === 'outpatient';
        items = await storage.getMedicalItemsByCategory(category, isOutpatient);
      } else if (type) {
        const isOutpatient = type === 'outpatient';
        items = await storage.getMedicalItemsByType(isOutpatient);
      } else {
        items = await storage.getAllMedicalItems();
      }

      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medical items" });
    }
  });

  app.post("/api/medical-items", async (req, res) => {
    try {
      const item = await storage.createMedicalItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create medical item" });
    }
  });

  app.put("/api/medical-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateMedicalItem(id, req.body);
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ message: "Medical item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update medical item" });
    }
  });

  app.delete("/api/medical-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMedicalItem(id);
      if (success) {
        res.json({ message: "Medical item deleted successfully" });
      } else {
        res.status(404).json({ message: "Medical item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete medical item" });
    }
  });

  // Bills API Routes
  app.post("/api/bills", async (req, res) => {
    try {
      const bill = await storage.saveBill(req.body);
      res.json(bill);
    } catch (error) {
      res.status(500).json({ message: "Failed to save bill" });
    }
  });

  app.get("/api/bills", async (req, res) => {
    try {
      const { sessionId, type } = req.query;
      if (!sessionId || !type) {
        return res.status(400).json({ message: "Session ID and type are required" });
      }
      
      const bill = await storage.getBillBySession(
        sessionId as string, 
        type as "outpatient" | "inpatient"
      );
      
      res.json(bill || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bill" });
    }
  });

  // Settings API Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Categories API Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      if (category) {
        res.json(category);
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      if (success) {
        res.json({ message: "Category deleted successfully" });
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
