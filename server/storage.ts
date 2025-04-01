import {
  User, InsertUser,
  SalesforceOrg, InsertSalesforceOrg,
  Metadata, InsertMetadata,
  HealthScore, InsertHealthScore,
  HealthScoreIssue
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      fullName: insertUser.fullName || null,
      email: insertUser.email || null
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
    const org: SalesforceOrg = {
      ...insertOrg,
      id,
      accessToken: insertOrg.accessToken || null,
      refreshToken: insertOrg.refreshToken || null,
      tokenType: insertOrg.tokenType || null,
      isActive: insertOrg.isActive ?? null,
      lastMetadataSync: null
    };
    this.orgs.set(id, org);
    return org;
  }

  async updateOrg(id: number, updates: Partial<InsertSalesforceOrg>): Promise<SalesforceOrg | undefined> {
    const org = this.orgs.get(id);
    if (!org) return undefined;
    
    const updatedOrg: SalesforceOrg = {
      ...org,
      ...updates,
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
    const score: HealthScore = { ...insertScore, id };
    this.healthScores.set(id, score);
    return score;
  }
}

// Export a singleton instance
export const storage = new MemStorage();
