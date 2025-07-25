import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc } from "drizzle-orm";
import pg from "pg";
import { 
  users, 
  medicalItems, 
  bills,
  type User, 
  type InsertUser,
  type MedicalItem,
  type InsertMedicalItem,
  type Bill,
  type InsertBill
} from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Medical items methods
  getAllMedicalItems(): Promise<MedicalItem[]>;
  getMedicalItemsByType(isOutpatient: boolean): Promise<MedicalItem[]>;
  getMedicalItemsByCategory(category: string, isOutpatient: boolean): Promise<MedicalItem[]>;
  createMedicalItem(item: InsertMedicalItem): Promise<MedicalItem>;
  updateMedicalItem(id: number, item: Partial<InsertMedicalItem>): Promise<MedicalItem | undefined>;
  deleteMedicalItem(id: number): Promise<boolean>;
  searchMedicalItems(query: string, isOutpatient: boolean): Promise<MedicalItem[]>;
  
  // Bills methods
  saveBill(bill: InsertBill): Promise<Bill>;
  getBillBySession(sessionId: string, type: "outpatient" | "inpatient"): Promise<Bill | undefined>;
  initializeDatabase(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllMedicalItems(): Promise<MedicalItem[]> {
    const result = await db.select().from(medicalItems).orderBy(medicalItems.category, medicalItems.name);
    return result as MedicalItem[];
  }

  async getMedicalItemsByType(isOutpatient: boolean): Promise<MedicalItem[]> {
    const result = await db.select().from(medicalItems)
      .where(eq(medicalItems.isOutpatient, isOutpatient))
      .orderBy(medicalItems.category, medicalItems.name);
    return result as MedicalItem[];
  }

  async getMedicalItemsByCategory(category: string, isOutpatient: boolean): Promise<MedicalItem[]> {
    const result = await db.select().from(medicalItems)
      .where(and(
        eq(medicalItems.category, category),
        eq(medicalItems.isOutpatient, isOutpatient)
      ))
      .orderBy(medicalItems.name);
    return result as MedicalItem[];
  }

  async createMedicalItem(item: InsertMedicalItem): Promise<MedicalItem> {
    const result = await db.insert(medicalItems).values({
      ...item,
      price: item.price.toString()
    }).returning();
    return {
      ...result[0],
      price: parseFloat(result[0].price)
    };
  }

  async updateMedicalItem(id: number, item: Partial<InsertMedicalItem>): Promise<MedicalItem | undefined> {
    const updateData = item.price ? { ...item, price: item.price.toString() } : item;
    const result = await db.update(medicalItems)
      .set(updateData)
      .where(eq(medicalItems.id, id))
      .returning();
    
    if (result[0]) {
      return {
        ...result[0],
        price: parseFloat(result[0].price)
      };
    }
    return undefined;
  }

  async deleteMedicalItem(id: number): Promise<boolean> {
    const result = await db.delete(medicalItems).where(eq(medicalItems.id, id)).returning();
    return result.length > 0;
  }

  async searchMedicalItems(query: string, isOutpatient: boolean): Promise<MedicalItem[]> {
    const result = await db.select().from(medicalItems)
      .where(and(
        eq(medicalItems.isOutpatient, isOutpatient)
      ))
      .orderBy(medicalItems.category, medicalItems.name);
    
    // Filter in memory for simplicity (in production, use database LIKE queries)
    const filtered = result.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.map(item => ({
      ...item,
      price: parseFloat(item.price)
    }));
  }

  async saveBill(bill: InsertBill): Promise<Bill> {
    // First, try to update existing bill
    const existing = await this.getBillBySession(bill.sessionId, bill.type);
    
    if (existing) {
      const result = await db.update(bills)
        .set({ 
          billData: bill.billData, 
          total: bill.total.toString(),
          daysAdmitted: bill.daysAdmitted,
          updatedAt: new Date()
        })
        .where(and(
          eq(bills.sessionId, bill.sessionId),
          eq(bills.type, bill.type)
        ))
        .returning();
      return {
        ...result[0],
        total: parseFloat(result[0].total)
      };
    } else {
      const result = await db.insert(bills).values({
        ...bill,
        total: bill.total.toString()
      }).returning();
      return {
        ...result[0],
        total: parseFloat(result[0].total)
      };
    }
  }

  async getBillBySession(sessionId: string, type: "outpatient" | "inpatient"): Promise<Bill | undefined> {
    const result = await db.select().from(bills)
      .where(and(
        eq(bills.sessionId, sessionId),
        eq(bills.type, type)
      ))
      .orderBy(desc(bills.updatedAt))
      .limit(1);
    
    if (result[0]) {
      return {
        ...result[0],
        total: parseFloat(result[0].total)
      };
    }
    return undefined;
  }

  async initializeDatabase(): Promise<void> {
    // Check if medical items already exist
    const existingItems = await db.select().from(medicalItems).limit(1);
    if (existingItems.length > 0) {
      return; // Already initialized
    }

    // Initialize with default data
    const defaultItems = [
      // Outpatient items
      { category: 'Laboratory', name: 'Complete Blood Count', price: '250.00', isOutpatient: true },
      { category: 'Laboratory', name: 'Urinalysis', price: '150.00', isOutpatient: true },
      { category: 'Laboratory', name: 'Blood Chemistry', price: '400.00', isOutpatient: true },
      { category: 'X-Ray', name: 'Chest X-Ray', price: '800.00', isOutpatient: true },
      { category: 'X-Ray', name: 'Extremity X-Ray', price: '600.00', isOutpatient: true },
      { category: 'Registration Fees', name: 'Outpatient Registration', price: '100.00', isOutpatient: true },
      { category: 'Dr. Fees', name: 'General Consultation', price: '500.00', isOutpatient: true },
      { category: 'Dr. Fees', name: 'Specialist Consultation', price: '800.00', isOutpatient: true },
      { category: 'Medicine', name: 'Paracetamol 500mg', price: '15.00', isOutpatient: true },
      { category: 'Physical Therapy', name: 'PT Session', price: '300.00', isOutpatient: true },
      
      // Inpatient items
      { category: 'Blood', name: 'Blood Transfusion', price: '2500.00', isOutpatient: false },
      { category: 'Laboratory', name: 'Complete Blood Count', price: '300.00', isOutpatient: false },
      { category: 'Laboratory', name: 'Blood Chemistry Panel', price: '500.00', isOutpatient: false },
      { category: 'Food', name: 'Regular Diet (per day)', price: '350.00', isOutpatient: false },
      { category: 'Food', name: 'Special Diet (per day)', price: '450.00', isOutpatient: false },
      { category: 'Registration Fees', name: 'Admission Fee', price: '500.00', isOutpatient: false },
      { category: 'Medicine', name: 'IV Antibiotics', price: '800.00', isOutpatient: false },
      { category: 'Medicine', name: 'Pain Medication', price: '200.00', isOutpatient: false },
      { category: 'Halo, O2, NO2, etc.', name: 'Oxygen Therapy (per day)', price: '400.00', isOutpatient: false },
      { category: 'Surgery, O.R. & Delivery', name: 'Minor Surgery', price: '15000.00', isOutpatient: false },
      { category: 'Surgery, O.R. & Delivery', name: 'Major Surgery', price: '35000.00', isOutpatient: false },
      { category: 'Seat & Ad. Fee', name: 'Admission Processing (per day)', price: '200.00', isOutpatient: false },
    ];

    await db.insert(medicalItems).values(defaultItems);
  }
}

export const storage = new DatabaseStorage();
