import {
  User, InsertUser,
  SalesforceOrg, InsertSalesforceOrg,
  Metadata, InsertMetadata,
  HealthScore, InsertHealthScore,
  HealthScoreIssue,
  CodeQuality, InsertCodeQuality,
  ComponentDependency, InsertComponentDependency,
  Compliance, InsertCompliance,
  TechnicalDebtItem, InsertTechnicalDebtItem,
  ReleaseImpact, InsertReleaseImpact
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
  
  // Code Quality operations
  getCodeQuality(id: number): Promise<CodeQuality | undefined>;
  getComponentCodeQuality(orgId: number, componentId: number): Promise<CodeQuality | undefined>;
  getOrgCodeQuality(orgId: number, componentType?: string): Promise<CodeQuality[]>;
  createCodeQuality(codeQuality: InsertCodeQuality): Promise<CodeQuality>;
  updateCodeQuality(id: number, updates: Partial<InsertCodeQuality>): Promise<CodeQuality | undefined>;
  
  // Component Dependencies operations
  getComponentDependency(id: number): Promise<ComponentDependency | undefined>;
  getComponentDependencies(orgId: number, componentId: number): Promise<ComponentDependency[]>;
  getReverseDependencies(orgId: number, componentId: number): Promise<ComponentDependency[]>;
  createComponentDependency(dependency: InsertComponentDependency): Promise<ComponentDependency>;
  updateComponentDependency(id: number, updates: Partial<InsertComponentDependency>): Promise<ComponentDependency | undefined>;
  
  // Compliance operations
  getCompliance(id: number): Promise<Compliance | undefined>;
  getOrgCompliance(orgId: number, frameworkName?: string): Promise<Compliance[]>;
  createCompliance(compliance: InsertCompliance): Promise<Compliance>;
  updateCompliance(id: number, updates: Partial<InsertCompliance>): Promise<Compliance | undefined>;
  
  // Technical Debt operations
  getTechnicalDebtItem(id: number): Promise<TechnicalDebtItem | undefined>;
  getComponentTechnicalDebt(orgId: number, componentId: number): Promise<TechnicalDebtItem[]>;
  getOrgTechnicalDebt(orgId: number, category?: string, status?: string): Promise<TechnicalDebtItem[]>;
  createTechnicalDebtItem(item: InsertTechnicalDebtItem): Promise<TechnicalDebtItem>;
  updateTechnicalDebtItem(id: number, updates: Partial<InsertTechnicalDebtItem>): Promise<TechnicalDebtItem | undefined>;
  
  // Release Impact operations
  getReleaseImpact(id: number): Promise<ReleaseImpact | undefined>;
  getOrgReleaseImpacts(orgId: number, status?: string): Promise<ReleaseImpact[]>;
  createReleaseImpact(impact: InsertReleaseImpact): Promise<ReleaseImpact>;
  updateReleaseImpact(id: number, updates: Partial<InsertReleaseImpact>): Promise<ReleaseImpact | undefined>;
  
  // Session store
  sessionStore: any; // Express session store type
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private orgs: Map<number, SalesforceOrg>;
  private metadata: Map<number, Metadata>;
  private healthScores: Map<number, HealthScore>;
  private codeQuality: Map<number, CodeQuality>;
  private componentDependencies: Map<number, ComponentDependency>;
  private compliance: Map<number, Compliance>;
  private technicalDebtItems: Map<number, TechnicalDebtItem>;
  private releaseImpacts: Map<number, ReleaseImpact>;
  private userIdCounter: number;
  private orgIdCounter: number;
  private metadataIdCounter: number;
  private healthScoreIdCounter: number;
  private codeQualityIdCounter: number;
  private componentDependencyIdCounter: number;
  private complianceIdCounter: number;
  private technicalDebtItemIdCounter: number;
  private releaseImpactIdCounter: number;
  sessionStore: any; // Express session store

  constructor() {
    this.users = new Map();
    this.orgs = new Map();
    this.metadata = new Map();
    this.healthScores = new Map();
    this.codeQuality = new Map();
    this.componentDependencies = new Map();
    this.compliance = new Map();
    this.technicalDebtItems = new Map();
    this.releaseImpacts = new Map();
    
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.metadataIdCounter = 1;
    this.healthScoreIdCounter = 1;
    this.codeQualityIdCounter = 1;
    this.componentDependencyIdCounter = 1;
    this.complianceIdCounter = 1;
    this.technicalDebtItemIdCounter = 1;
    this.releaseImpactIdCounter = 1;
    
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

  // Code Quality operations
  async getCodeQuality(id: number): Promise<CodeQuality | undefined> {
    return this.codeQuality.get(id);
  }

  async getComponentCodeQuality(orgId: number, componentId: number): Promise<CodeQuality | undefined> {
    return Array.from(this.codeQuality.values()).find(
      (quality) => quality.orgId === orgId && quality.componentId === componentId
    );
  }

  async getOrgCodeQuality(orgId: number, componentType?: string): Promise<CodeQuality[]> {
    return Array.from(this.codeQuality.values()).filter(
      (quality) => quality.orgId === orgId && (!componentType || quality.componentType === componentType)
    );
  }

  async createCodeQuality(insertCodeQuality: InsertCodeQuality): Promise<CodeQuality> {
    const id = this.codeQualityIdCounter++;
    const codeQuality: CodeQuality = {
      ...insertCodeQuality,
      id,
      lastAnalyzed: insertCodeQuality.lastAnalyzed || new Date(),
    };
    this.codeQuality.set(id, codeQuality);
    return codeQuality;
  }

  async updateCodeQuality(id: number, updates: Partial<InsertCodeQuality>): Promise<CodeQuality | undefined> {
    const codeQuality = this.codeQuality.get(id);
    if (!codeQuality) return undefined;
    
    const updatedCodeQuality: CodeQuality = {
      ...codeQuality,
      ...updates,
    };
    this.codeQuality.set(id, updatedCodeQuality);
    return updatedCodeQuality;
  }

  // Component Dependencies operations
  async getComponentDependency(id: number): Promise<ComponentDependency | undefined> {
    return this.componentDependencies.get(id);
  }

  async getComponentDependencies(orgId: number, componentId: number): Promise<ComponentDependency[]> {
    return Array.from(this.componentDependencies.values()).filter(
      (dependency) => dependency.orgId === orgId && dependency.sourceComponentId === componentId
    );
  }

  async getReverseDependencies(orgId: number, componentId: number): Promise<ComponentDependency[]> {
    return Array.from(this.componentDependencies.values()).filter(
      (dependency) => dependency.orgId === orgId && dependency.targetComponentId === componentId
    );
  }

  async createComponentDependency(insertDependency: InsertComponentDependency): Promise<ComponentDependency> {
    const id = this.componentDependencyIdCounter++;
    const dependency: ComponentDependency = {
      ...insertDependency,
      id,
      lastUpdated: insertDependency.lastUpdated || new Date(),
    };
    this.componentDependencies.set(id, dependency);
    return dependency;
  }

  async updateComponentDependency(id: number, updates: Partial<InsertComponentDependency>): Promise<ComponentDependency | undefined> {
    const dependency = this.componentDependencies.get(id);
    if (!dependency) return undefined;
    
    const updatedDependency: ComponentDependency = {
      ...dependency,
      ...updates,
      lastUpdated: updates.lastUpdated || dependency.lastUpdated,
    };
    this.componentDependencies.set(id, updatedDependency);
    return updatedDependency;
  }

  // Compliance operations
  async getCompliance(id: number): Promise<Compliance | undefined> {
    return this.compliance.get(id);
  }

  async getOrgCompliance(orgId: number, frameworkName?: string): Promise<Compliance[]> {
    return Array.from(this.compliance.values()).filter(
      (compliance) => compliance.orgId === orgId && (!frameworkName || compliance.frameworkName === frameworkName)
    );
  }

  async createCompliance(insertCompliance: InsertCompliance): Promise<Compliance> {
    const id = this.complianceIdCounter++;
    const compliance: Compliance = {
      ...insertCompliance,
      id,
      lastScanned: insertCompliance.lastScanned || new Date(),
      nextScanDue: insertCompliance.nextScanDue || null,
    };
    this.compliance.set(id, compliance);
    return compliance;
  }

  async updateCompliance(id: number, updates: Partial<InsertCompliance>): Promise<Compliance | undefined> {
    const compliance = this.compliance.get(id);
    if (!compliance) return undefined;
    
    const updatedCompliance: Compliance = {
      ...compliance,
      ...updates,
    };
    this.compliance.set(id, updatedCompliance);
    return updatedCompliance;
  }

  // Technical Debt operations
  async getTechnicalDebtItem(id: number): Promise<TechnicalDebtItem | undefined> {
    return this.technicalDebtItems.get(id);
  }

  async getComponentTechnicalDebt(orgId: number, componentId: number): Promise<TechnicalDebtItem[]> {
    return Array.from(this.technicalDebtItems.values()).filter(
      (item) => item.orgId === orgId && item.componentId === componentId
    );
  }

  async getOrgTechnicalDebt(orgId: number, category?: string, status?: string): Promise<TechnicalDebtItem[]> {
    return Array.from(this.technicalDebtItems.values()).filter(
      (item) => {
        const orgMatch = item.orgId === orgId;
        const categoryMatch = !category || item.category === category;
        const statusMatch = !status || item.status === status;
        return orgMatch && categoryMatch && statusMatch;
      }
    );
  }

  async createTechnicalDebtItem(insertItem: InsertTechnicalDebtItem): Promise<TechnicalDebtItem> {
    const id = this.technicalDebtItemIdCounter++;
    const now = new Date();
    const item: TechnicalDebtItem = {
      ...insertItem,
      id,
      createdAt: insertItem.createdAt || now,
      updatedAt: insertItem.updatedAt || now,
      resolvedAt: insertItem.resolvedAt || null,
      tags: insertItem.tags || [],
    };
    this.technicalDebtItems.set(id, item);
    return item;
  }

  async updateTechnicalDebtItem(id: number, updates: Partial<InsertTechnicalDebtItem>): Promise<TechnicalDebtItem | undefined> {
    const item = this.technicalDebtItems.get(id);
    if (!item) return undefined;
    
    const updatedItem: TechnicalDebtItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    this.technicalDebtItems.set(id, updatedItem);
    return updatedItem;
  }

  // Release Impact operations
  async getReleaseImpact(id: number): Promise<ReleaseImpact | undefined> {
    return this.releaseImpacts.get(id);
  }

  async getOrgReleaseImpacts(orgId: number, status?: string): Promise<ReleaseImpact[]> {
    return Array.from(this.releaseImpacts.values()).filter(
      (impact) => impact.orgId === orgId && (!status || impact.status === status)
    );
  }

  async createReleaseImpact(insertImpact: InsertReleaseImpact): Promise<ReleaseImpact> {
    const id = this.releaseImpactIdCounter++;
    const now = new Date();
    const impact: ReleaseImpact = {
      ...insertImpact,
      id,
      createdAt: insertImpact.createdAt || now,
      updatedAt: insertImpact.updatedAt || now,
    };
    this.releaseImpacts.set(id, impact);
    return impact;
  }

  async updateReleaseImpact(id: number, updates: Partial<InsertReleaseImpact>): Promise<ReleaseImpact | undefined> {
    const impact = this.releaseImpacts.get(id);
    if (!impact) return undefined;
    
    const updatedImpact: ReleaseImpact = {
      ...impact,
      ...updates,
      updatedAt: new Date(),
    };
    this.releaseImpacts.set(id, updatedImpact);
    return updatedImpact;
  }
}

// PostgreSQL database implementation
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

class PostgresStorage implements IStorage {
  private db: any;
  sessionStore: any;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql, { schema });
    
    // Initialize session store
    const MemoryStore = connectPgSimple(session);
    this.sessionStore = new MemoryStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,  // This will create the session table if it doesn't exist
      tableName: 'session'         // Explicitly set the table name
    });
    
    console.log("PostgreSQL storage initialized");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where({ username }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(user).returning();
    return result[0];
  }

  // Salesforce org operations
  async getOrg(id: number): Promise<SalesforceOrg | undefined> {
    const result = await this.db.select().from(schema.salesforceOrgs).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserOrgs(userId: number): Promise<SalesforceOrg[]> {
    return await this.db.select().from(schema.salesforceOrgs).where({ userId });
  }

  async createOrg(org: InsertSalesforceOrg): Promise<SalesforceOrg> {
    const result = await this.db.insert(schema.salesforceOrgs).values(org).returning();
    return result[0];
  }

  async updateOrg(id: number, updates: Partial<InsertSalesforceOrg>): Promise<SalesforceOrg | undefined> {
    const result = await this.db.update(schema.salesforceOrgs).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteOrg(id: number): Promise<boolean> {
    await this.db.delete(schema.salesforceOrgs).where({ id });
    return true;
  }

  // Metadata operations
  async getMetadata(id: number): Promise<Metadata | undefined> {
    const result = await this.db.select().from(schema.metadata).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getOrgMetadata(orgId: number, type?: string): Promise<Metadata[]> {
    if (type) {
      return await this.db.select().from(schema.metadata).where({ orgId, type });
    }
    return await this.db.select().from(schema.metadata).where({ orgId });
  }

  async createMetadata(metadata: InsertMetadata): Promise<Metadata> {
    const result = await this.db.insert(schema.metadata).values(metadata).returning();
    return result[0];
  }

  async updateMetadata(id: number, updates: Partial<InsertMetadata>): Promise<Metadata | undefined> {
    const result = await this.db.update(schema.metadata).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteMetadata(id: number): Promise<boolean> {
    await this.db.delete(schema.metadata).where({ id });
    return true;
  }

  // Health score operations
  async getHealthScore(id: number): Promise<HealthScore | undefined> {
    const result = await this.db.select().from(schema.healthScores).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getLatestHealthScore(orgId: number): Promise<HealthScore | undefined> {
    const result = await this.db.select().from(schema.healthScores)
      .where({ orgId })
      .orderBy({ lastAnalyzed: 'desc' })
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createHealthScore(score: InsertHealthScore): Promise<HealthScore> {
    const result = await this.db.insert(schema.healthScores).values(score).returning();
    return result[0];
  }

  // Code Quality operations
  async getCodeQuality(id: number): Promise<CodeQuality | undefined> {
    const result = await this.db.select().from(schema.codeQuality).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getComponentCodeQuality(orgId: number, componentId: number): Promise<CodeQuality | undefined> {
    const result = await this.db.select().from(schema.codeQuality)
      .where({ orgId, componentId })
      .orderBy({ lastAnalyzed: 'desc' })
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getOrgCodeQuality(orgId: number, componentType?: string): Promise<CodeQuality[]> {
    if (componentType) {
      return await this.db.select().from(schema.codeQuality).where({ orgId, componentType });
    }
    return await this.db.select().from(schema.codeQuality).where({ orgId });
  }

  async createCodeQuality(codeQuality: InsertCodeQuality): Promise<CodeQuality> {
    const result = await this.db.insert(schema.codeQuality).values(codeQuality).returning();
    return result[0];
  }

  async updateCodeQuality(id: number, updates: Partial<InsertCodeQuality>): Promise<CodeQuality | undefined> {
    const result = await this.db.update(schema.codeQuality).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Component Dependencies operations
  async getComponentDependency(id: number): Promise<ComponentDependency | undefined> {
    const result = await this.db.select().from(schema.componentDependencies).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  // Implement the methods required by the interface
  async getComponentDependencies(orgId: number, componentId: number): Promise<ComponentDependency[]> {
    return await this.db.select().from(schema.componentDependencies)
      .where({ orgId, sourceComponentId: componentId });
  }
  
  async getReverseDependencies(orgId: number, componentId: number): Promise<ComponentDependency[]> {
    return await this.db.select().from(schema.componentDependencies)
      .where({ orgId, targetComponentId: componentId });
  }

  // Keep the existing implementation too
  async getOrgComponentDependencies(orgId: number, componentId?: number): Promise<ComponentDependency[]> {
    if (componentId) {
      return await this.db.select().from(schema.componentDependencies)
        .where({ orgId })
        .where(({ or }) => or(
          { sourceComponentId: componentId },
          { targetComponentId: componentId }
        ));
    }
    return await this.db.select().from(schema.componentDependencies).where({ orgId });
  }

  async createComponentDependency(dependency: InsertComponentDependency): Promise<ComponentDependency> {
    const result = await this.db.insert(schema.componentDependencies).values(dependency).returning();
    return result[0];
  }

  async updateComponentDependency(id: number, updates: Partial<InsertComponentDependency>): Promise<ComponentDependency | undefined> {
    const result = await this.db.update(schema.componentDependencies).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Compliance operations
  async getCompliance(id: number): Promise<Compliance | undefined> {
    const result = await this.db.select().from(schema.compliance).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getOrgCompliance(orgId: number, frameworkName?: string): Promise<Compliance[]> {
    if (frameworkName) {
      return await this.db.select().from(schema.compliance).where({ orgId, frameworkName });
    }
    return await this.db.select().from(schema.compliance).where({ orgId });
  }

  async createCompliance(compliance: InsertCompliance): Promise<Compliance> {
    const result = await this.db.insert(schema.compliance).values(compliance).returning();
    return result[0];
  }

  async updateCompliance(id: number, updates: Partial<InsertCompliance>): Promise<Compliance | undefined> {
    const result = await this.db.update(schema.compliance).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Technical Debt operations
  async getTechnicalDebtItem(id: number): Promise<TechnicalDebtItem | undefined> {
    const result = await this.db.select().from(schema.technicalDebtItems).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getComponentTechnicalDebt(orgId: number, componentId: number): Promise<TechnicalDebtItem[]> {
    return await this.db.select().from(schema.technicalDebtItems).where({ orgId, componentId });
  }
  
  async getOrgTechnicalDebt(orgId: number, category?: string, status?: string): Promise<TechnicalDebtItem[]> {
    let query = this.db.select().from(schema.technicalDebtItems).where({ orgId });
    
    if (category) {
      query = query.where({ category });
    }
    
    if (status) {
      query = query.where({ status });
    }
    
    return await query;
  }

  async createTechnicalDebtItem(item: InsertTechnicalDebtItem): Promise<TechnicalDebtItem> {
    const result = await this.db.insert(schema.technicalDebtItems).values(item).returning();
    return result[0];
  }

  async updateTechnicalDebtItem(id: number, updates: Partial<InsertTechnicalDebtItem>): Promise<TechnicalDebtItem | undefined> {
    const result = await this.db.update(schema.technicalDebtItems).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Release Impact operations
  async getReleaseImpact(id: number): Promise<ReleaseImpact | undefined> {
    const result = await this.db.select().from(schema.releaseImpact).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getOrgReleaseImpacts(orgId: number, status?: string): Promise<ReleaseImpact[]> {
    if (status) {
      return await this.db.select().from(schema.releaseImpact).where({ orgId, status });
    }
    return await this.db.select().from(schema.releaseImpact).where({ orgId });
  }

  async createReleaseImpact(impact: InsertReleaseImpact): Promise<ReleaseImpact> {
    const result = await this.db.insert(schema.releaseImpact).values(impact).returning();
    return result[0];
  }

  async updateReleaseImpact(id: number, updates: Partial<InsertReleaseImpact>): Promise<ReleaseImpact | undefined> {
    const result = await this.db.update(schema.releaseImpact).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }
}

// Check if we have a DATABASE_URL environment variable and use Postgres if available, otherwise use MemStorage
const usePostgres = !!process.env.DATABASE_URL;
console.log(`Using ${usePostgres ? 'PostgreSQL' : 'In-Memory'} storage`);

export const storage = usePostgres ? new PostgresStorage() : new MemStorage();
