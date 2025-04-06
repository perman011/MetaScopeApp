import {
  User, InsertUser,
  SalesforceOrg, InsertSalesforceOrg,
  Metadata, InsertMetadata,
  HealthScore, InsertHealthScore,
  HealthScoreIssue
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Salesforce org operations
  getOrg(id: number): Promise<SalesforceOrg | undefined>;
  getUserOrgs(userId: number): Promise<SalesforceOrg[]>;
  createOrg(org: InsertSalesforceOrg): Promise<SalesforceOrg>;
  updateOrg(id: number, updates: Partial<InsertSalesforceOrg>): Promise<SalesforceOrg | undefined>;
  deleteOrg(id: number): Promise<boolean>;
  
  // Metadata operations
  getMetadata(id: number): Promise<Metadata | undefined>;
  getOrgMetadata(orgId: number, type?: string): Promise<Metadata[]>;
  createMetadata(metadata: InsertMetadata): Promise<Metadata>;
  updateMetadata(id: number, updates: Partial<InsertMetadata>): Promise<Metadata | undefined>;
  deleteMetadata(id: number): Promise<boolean>;
  
  // Health score operations
  getHealthScore(id: number): Promise<HealthScore | undefined>;
  getLatestHealthScore(orgId: number): Promise<HealthScore | undefined>;
  createHealthScore(score: InsertHealthScore): Promise<HealthScore>;
  
  // Session store
  sessionStore: any; // Express session store type
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private orgs: Map<number, SalesforceOrg>;
  private metadata: Map<number, Metadata>;
  private healthScores: Map<number, HealthScore>;
  private userIdCounter: number;
  private orgIdCounter: number;
  private metadataIdCounter: number;
  private healthScoreIdCounter: number;
  sessionStore: any; // Express session store

  constructor() {
    this.users = new Map();
    this.orgs = new Map();
    this.metadata = new Map();
    this.healthScores = new Map();
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.metadataIdCounter = 1;
    this.healthScoreIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create admin user for first-time setup
    this.setupAdminUser();
  }
  
  // Create a default admin user for application administration
  private async setupAdminUser() {
    const existingAdmin = await this.getUserByUsername('4980005@gmail.com');
    if (!existingAdmin) {
      // Create an admin user with preset credentials using proper password hashing
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');
      const hashedPassword = `${hash}.${salt}`;
      
      // Create an admin user with preset credentials
      await this.createUser({
        username: '4980005@gmail.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        email: '4980005@gmail.com',
        isAdmin: true
      });
      console.log('Admin user created successfully');
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      fullName: insertUser.fullName || null,
      email: insertUser.email || null,
      isAdmin: insertUser.isAdmin ?? false // Set default value to false if not provided
    };
    this.users.set(id, user);
    return user;
  }

  // Salesforce org operations
  async getOrg(id: number): Promise<SalesforceOrg | undefined> {
    return this.orgs.get(id);
  }

  async getUserOrgs(userId: number): Promise<SalesforceOrg[]> {
    return Array.from(this.orgs.values()).filter(
      (org) => org.userId === userId
    );
  }

  async createOrg(insertOrg: InsertSalesforceOrg): Promise<SalesforceOrg> {
    const id = this.orgIdCounter++;
    
    // Extract domain from instanceUrl if not provided
    let domain = insertOrg.domain;
    if (!domain && insertOrg.instanceUrl) {
      try {
        const url = new URL(insertOrg.instanceUrl);
        domain = url.hostname;
      } catch (e) {
        domain = null;
      }
    }
    
    const org: SalesforceOrg = {
      ...insertOrg,
      id,
      domain: domain || null,
      type: insertOrg.type || "production",
      accessToken: insertOrg.accessToken || null,
      refreshToken: insertOrg.refreshToken || null,
      tokenType: insertOrg.tokenType || null,
      isActive: insertOrg.isActive ?? true,
      lastMetadataSync: null,
      lastSyncedAt: null,
      lastAccessedAt: new Date() as Date,
    };
    this.orgs.set(id, org);
    return org;
  }

  async updateOrg(id: number, updates: Partial<InsertSalesforceOrg> & { lastSyncedAt?: string }): Promise<SalesforceOrg | undefined> {
    const org = this.orgs.get(id);
    if (!org) return undefined;
    
    // Handle lastSyncedAt separately if it's provided as a string
    let lastSyncedAt = org.lastSyncedAt;
    if (updates.lastSyncedAt) {
      lastSyncedAt = new Date(updates.lastSyncedAt) as Date;
      delete updates.lastSyncedAt;
    }
    
    const updatedOrg: SalesforceOrg = {
      ...org,
      ...updates,
      lastSyncedAt,
    };
    
    this.orgs.set(id, updatedOrg);
    return updatedOrg;
  }

  async deleteOrg(id: number): Promise<boolean> {
    return this.orgs.delete(id);
  }

  // Metadata operations
  async getMetadata(id: number): Promise<Metadata | undefined> {
    return this.metadata.get(id);
  }

  async getOrgMetadata(orgId: number, type?: string): Promise<Metadata[]> {
    return Array.from(this.metadata.values()).filter(
      (meta) => meta.orgId === orgId && (!type || meta.type === type)
    );
  }

  async createMetadata(insertMetadata: InsertMetadata): Promise<Metadata> {
    const id = this.metadataIdCounter++;
    const metadata: Metadata = { ...insertMetadata, id };
    this.metadata.set(id, metadata);
    return metadata;
  }

  async updateMetadata(id: number, updates: Partial<InsertMetadata>): Promise<Metadata | undefined> {
    const metadata = this.metadata.get(id);
    if (!metadata) return undefined;
    
    const updatedMetadata: Metadata = {
      ...metadata,
      ...updates,
    };
    this.metadata.set(id, updatedMetadata);
    return updatedMetadata;
  }

  async deleteMetadata(id: number): Promise<boolean> {
    return this.metadata.delete(id);
  }

  // Health score operations
  async getHealthScore(id: number): Promise<HealthScore | undefined> {
    return this.healthScores.get(id);
  }

  async getLatestHealthScore(orgId: number): Promise<HealthScore | undefined> {
    const orgScores = Array.from(this.healthScores.values()).filter(
      (score) => score.orgId === orgId
    );
    
    if (orgScores.length === 0) return undefined;
    
    return orgScores.reduce((latest, score) => 
      latest.lastAnalyzed > score.lastAnalyzed ? latest : score
    );
  }

  async createHealthScore(insertScore: InsertHealthScore): Promise<HealthScore> {
    const id = this.healthScoreIdCounter++;
    
    // Create the base database entry
    const baseScore = {
      id,
      orgId: insertScore.orgId,
      overallScore: insertScore.overallScore,
      securityScore: insertScore.securityScore,
      dataModelScore: insertScore.dataModelScore,
      automationScore: insertScore.automationScore,
      apexScore: insertScore.apexScore,
      uiComponentScore: insertScore.uiComponentScore,
      complexityScore: insertScore.complexityScore ?? 50,
      performanceRisk: insertScore.performanceRisk ?? 50,
      technicalDebt: insertScore.technicalDebt ?? 50,
      metadataVolume: insertScore.metadataVolume ?? 50,
      customizationLevel: insertScore.customizationLevel ?? 50,
      lastAnalyzed: insertScore.lastAnalyzed || new Date(),
      issues: insertScore.issues || []
    };
    
    // Convert the raw data to a proper HealthScore object
    let parsedIssues: HealthScoreIssue[] = [];
    
    // Only try to parse issues if they exist
    if (baseScore.issues) {
      try {
        // Handle different potential formats of issues data
        if (Array.isArray(baseScore.issues)) {
          parsedIssues = baseScore.issues.map(issue => {
            if (typeof issue === 'object') {
              return {
                id: issue.id || `issue-${Math.random().toString(36).substring(2, 9)}`,
                severity: issue.severity || 'info',
                category: issue.category || 'security',
                title: issue.title || 'Unknown Issue',
                description: issue.description || 'No description provided',
                impact: issue.impact || 'Unknown impact',
                recommendation: issue.recommendation || 'No recommendation provided'
              };
            }
            return null;
          }).filter((issue): issue is HealthScoreIssue => issue !== null);
        }
      } catch (e) {
        console.error("Failed to parse health score issues:", e);
        parsedIssues = [];
      }
    }
    
    // Create the HealthScore with the properly typed issues array
    const score: HealthScore = {
      ...baseScore,
      issues: parsedIssues
    };
    
    this.healthScores.set(id, score);
    return score;
  }
}

// Export a singleton instance
export const storage = new MemStorage();
