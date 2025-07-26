import { 
  type User, 
  type InsertUser,
  type MedicalItem,
  type InsertMedicalItem,
  type Bill,
  type InsertBill
} from "@shared/schema";

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

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private medicalItems: MedicalItem[] = [];
  private bills: Bill[] = [];
  private nextUserId = 1;
  private nextMedicalItemId = 1;
  private nextBillId = 1;
  private initialized = false;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      username: insertUser.username,
      password: insertUser.password,
    };
    this.users.push(user);
    return user;
  }

  async getAllMedicalItems(): Promise<MedicalItem[]> {
    return [...this.medicalItems].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }

  async getMedicalItemsByType(isOutpatient: boolean): Promise<MedicalItem[]> {
    return this.medicalItems
      .filter(item => item.isOutpatient === isOutpatient)
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
  }

  async getMedicalItemsByCategory(category: string, isOutpatient: boolean): Promise<MedicalItem[]> {
    return this.medicalItems
      .filter(item => item.category === category && item.isOutpatient === isOutpatient)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createMedicalItem(item: InsertMedicalItem): Promise<MedicalItem> {
    const medicalItem: MedicalItem = {
      id: this.nextMedicalItemId++,
      category: item.category,
      name: item.name,
      price: item.price,
      currency: 'BDT',
      description: item.description || null,
      isOutpatient: item.isOutpatient,
      createdAt: new Date(),
    };
    this.medicalItems.push(medicalItem);
    return medicalItem;
  }

  async updateMedicalItem(id: number, item: Partial<InsertMedicalItem>): Promise<MedicalItem | undefined> {
    const index = this.medicalItems.findIndex(medItem => medItem.id === id);
    if (index === -1) return undefined;

    this.medicalItems[index] = {
      ...this.medicalItems[index],
      ...item,
    };
    return this.medicalItems[index];
  }

  async deleteMedicalItem(id: number): Promise<boolean> {
    const initialLength = this.medicalItems.length;
    this.medicalItems = this.medicalItems.filter(item => item.id !== id);
    return this.medicalItems.length < initialLength;
  }

  async searchMedicalItems(query: string, isOutpatient: boolean): Promise<MedicalItem[]> {
    const lowerQuery = query.toLowerCase();
    return this.medicalItems
      .filter(item => 
        item.isOutpatient === isOutpatient &&
        (item.name.toLowerCase().includes(lowerQuery) ||
         item.category.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
  }

  async saveBill(bill: InsertBill): Promise<Bill> {
    // First, try to update existing bill
    const existingIndex = this.bills.findIndex(b => 
      b.sessionId === bill.sessionId && b.type === bill.type
    );
    
    if (existingIndex !== -1) {
      this.bills[existingIndex] = {
        ...this.bills[existingIndex],
        billData: bill.billData,
        total: bill.total,
        currency: 'BDT',
        daysAdmitted: bill.daysAdmitted || null,
        updatedAt: new Date(),
      };
      return this.bills[existingIndex];
    } else {
      const newBill: Bill = {
        id: this.nextBillId++,
        type: bill.type,
        sessionId: bill.sessionId,
        billData: bill.billData,
        daysAdmitted: bill.daysAdmitted || 1,
        total: bill.total,
        currency: 'BDT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.bills.push(newBill);
      return newBill;
    }
  }

  async getBillBySession(sessionId: string, type: "outpatient" | "inpatient"): Promise<Bill | undefined> {
    const filtered = this.bills
      .filter(bill => bill.sessionId === sessionId && bill.type === type)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return filtered[0] || undefined;
  }

  async initializeDatabase(): Promise<void> {
    // Always reinitialize to ensure clean data
    this.medicalItems = [];
    this.nextMedicalItemId = 1;

    // Initialize with default data
    const defaultItems = [
      // Outpatient items
      { category: 'Laboratory', name: 'Complete Blood Count', price: '250.00', currency: 'BDT', isOutpatient: true },
      { category: 'Laboratory', name: 'Urinalysis', price: '150.00', currency: 'BDT', isOutpatient: true },
      { category: 'Laboratory', name: 'Blood Chemistry', price: '400.00', currency: 'BDT', isOutpatient: true },
      { category: 'X-Ray', name: 'Chest X-Ray', price: '800.00', currency: 'BDT', isOutpatient: true },
      { category: 'X-Ray', name: 'Extremity X-Ray', price: '600.00', currency: 'BDT', isOutpatient: true },
      { category: 'Registration Fees', name: 'Outpatient Registration', price: '100.00', currency: 'BDT', isOutpatient: true },
      { category: 'Registration Fees', name: 'Emergency Registration', price: '200.00', currency: 'BDT', isOutpatient: true },
      { category: 'Dr. Fees', name: 'General Consultation', price: '500.00', currency: 'BDT', isOutpatient: true },
      { category: 'Dr. Fees', name: 'Specialist Consultation', price: '800.00', currency: 'BDT', isOutpatient: true },
      { category: 'Dr. Fees', name: 'Emergency Consultation', price: '1000.00', currency: 'BDT', isOutpatient: true },
      { category: 'Medic Fee', name: 'Basic Medical Service', price: '300.00', currency: 'BDT', isOutpatient: true },
      { category: 'Medic Fee', name: 'Advanced Medical Service', price: '500.00', currency: 'BDT', isOutpatient: true },
      { category: 'Medic Fee', name: 'Emergency Medical Service', price: '700.00', currency: 'BDT', isOutpatient: true },
      { category: 'Medicine', name: 'Paracetamol 500mg', price: '15.00', currency: 'BDT', isOutpatient: true },
      { category: 'Physical Therapy', name: 'PT Session', price: '300.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Ankle Brace', price: '1200.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Knee Brace', price: '1800.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Wrist Splint', price: '800.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Elbow Support', price: '900.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Back Brace', price: '2500.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Arm Sling', price: '400.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Cervical Collar', price: '1500.00', currency: 'BDT', isOutpatient: true },
      { category: 'Limb and Brace', name: 'Walking Crutches (pair)', price: '1600.00', currency: 'BDT', isOutpatient: true },
      
      // Inpatient items
      { category: 'Blood', name: 'Blood Transfusion', price: '2500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Blood', name: 'Blood Cross-matching', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Blood', name: 'Platelet Transfusion', price: '3500.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Laboratory', name: 'Complete Blood Count', price: '300.00', currency: 'BDT', isOutpatient: false },
      { category: 'Laboratory', name: 'Blood Chemistry Panel', price: '500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Laboratory', name: 'Liver Function Test', price: '600.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Limb and Brace', name: 'Post-surgical Brace', price: '2000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Limb and Brace', name: 'Hospital Walker', price: '1800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Limb and Brace', name: 'Compression Stockings', price: '900.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Food', name: 'Regular Diet (per day)', price: '350.00', currency: 'BDT', isOutpatient: false },
      { category: 'Food', name: 'Special Diet (per day)', price: '450.00', currency: 'BDT', isOutpatient: false },
      { category: 'Food', name: 'Liquid Diet (per day)', price: '300.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Halo, O2, NO2, etc.', name: 'Oxygen Therapy (per day)', price: '400.00', currency: 'BDT', isOutpatient: false },
      { category: 'Halo, O2, NO2, etc.', name: 'Nitrous Oxide', price: '600.00', currency: 'BDT', isOutpatient: false },
      { category: 'Halo, O2, NO2, etc.', name: 'Halo Traction', price: '1200.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Orthopedic, S.Roll, etc.', name: 'Orthopedic Consultation', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Orthopedic, S.Roll, etc.', name: 'Spinal Roll Support', price: '1500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Orthopedic, S.Roll, etc.', name: 'Orthopedic Brace', price: '2200.00', currency: 'BDT', isOutpatient: false },
      { category: 'Orthopedic, S.Roll, etc.', name: 'Spine Support System', price: '3500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Orthopedic, S.Roll, etc.', name: 'Orthopedic Device Setup', price: '1800.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Surgery, O.R. & Delivery', name: 'Minor Surgery', price: '15000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Surgery, O.R. & Delivery', name: 'Major Surgery', price: '35000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Surgery, O.R. & Delivery', name: 'Normal Delivery', price: '8000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Surgery, O.R. & Delivery', name: 'C-Section Delivery', price: '25000.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Registration Fees', name: 'Admission Fee', price: '500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Registration Fees', name: 'ICU Admission', price: '1000.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Discharge Medicine', name: 'Discharge Medication Package', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Discharge Medicine', name: 'Pain Relief Package', price: '400.00', currency: 'BDT', isOutpatient: false },
      { category: 'Discharge Medicine', name: 'Antibiotic Course', price: '600.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'General Anesthesia', price: '3000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'Spinal Anesthesia', price: '2000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'Ketamine', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'ORS Solution', price: '50.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Physical Therapy', name: 'Physical Therapy Session', price: '400.00', currency: 'BDT', isOutpatient: false },
      { category: 'Physical Therapy', name: 'Rehabilitation Package', price: '1200.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'IV.\'s', name: 'IV Fluid (Normal Saline)', price: '200.00', currency: 'BDT', isOutpatient: false },
      { category: 'IV.\'s', name: 'IV Antibiotics', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'IV.\'s', name: 'IV Pain Medication', price: '300.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Plaster/Milk', name: 'Plaster Cast Application', price: '1500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Plaster/Milk', name: 'Cast Removal', price: '500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Plaster/Milk', name: 'Milk Formula (per day)', price: '150.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Procedures', name: 'Wound Dressing', price: '300.00', currency: 'BDT', isOutpatient: false },
      { category: 'Procedures', name: 'Catheter Insertion', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Procedures', name: 'Suture Removal', price: '200.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Seat & Ad. Fee', name: 'Admission Processing (per day)', price: '200.00', currency: 'BDT', isOutpatient: false },
      { category: 'Seat & Ad. Fee', name: 'Bed Fee (General Ward)', price: '500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Seat & Ad. Fee', name: 'Bed Fee (Private Room)', price: '1200.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'X-Ray', name: 'Chest X-Ray', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'X-Ray', name: 'Extremity X-Ray', price: '600.00', currency: 'BDT', isOutpatient: false },
      { category: 'X-Ray', name: 'CT Scan', price: '4000.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Lost Laundry', name: 'Hospital Gown Replacement', price: '300.00', currency: 'BDT', isOutpatient: false },
      { category: 'Lost Laundry', name: 'Bed Sheet Replacement', price: '200.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Travel', name: 'Ambulance Service (Local)', price: '1500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Travel', name: 'Ambulance Service (Long Distance)', price: '3000.00', currency: 'BDT', isOutpatient: false },
      
      { category: 'Other', name: 'Miscellaneous Charges', price: '500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Other', name: 'Administrative Fee', price: '300.00', currency: 'BDT', isOutpatient: false },
      
      // Medicine, ORS & Anesthesia, Ket, Spinal category
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'General Anesthesia', price: '3000.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'Spinal Anesthesia', price: '2500.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'Ketamine Injection', price: '800.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'ORS Solution (per bottle)', price: '50.00', currency: 'BDT', isOutpatient: false },
      { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', name: 'IV Fluid with ORS', price: '300.00', currency: 'BDT', isOutpatient: false },

    ];

    for (const item of defaultItems) {
      await this.createMedicalItem(item);
    }

    this.initialized = true;
  }
}

export const storage = new MemoryStorage();