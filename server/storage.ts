import { users, type User, type InsertUser, salesforceOrgs, type SalesforceOrg, type InsertSalesforceOrg, metadata, type Metadata, type InsertMetadata, healthScores, type HealthScore, type InsertHealthScore, savedQueries, type SavedQuery, type InsertSavedQuery, issues, type Issue, type InsertIssue, filterTemplates, type FilterTemplate, type InsertFilterTemplate } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Export the interface for the storage
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Salesforce Org methods
  getSalesforceOrg(id: number): Promise<SalesforceOrg | undefined>;
  getSalesforceOrgsByUserId(userId: number): Promise<SalesforceOrg[]>;
  createSalesforceOrg(org: InsertSalesforceOrg): Promise<SalesforceOrg>;
  updateSalesforceOrgSyncTime(id: number): Promise<SalesforceOrg | undefined>;
  
  // Metadata methods
  getMetadata(id: number): Promise<Metadata | undefined>;
  getMetadataByOrgId(orgId: number, filter?: { type?: string }): Promise<Metadata[]>;
  createOrUpdateMetadata(metadata: InsertMetadata): Promise<Metadata>;
  
  // Health Score methods
  getHealthScore(id: number): Promise<HealthScore | undefined>;
  getLatestHealthScoreByOrgId(orgId: number): Promise<HealthScore | undefined>;
  createHealthScore(healthScore: InsertHealthScore): Promise<HealthScore>;
  
  // Saved Query methods
  getSavedQuery(id: number): Promise<SavedQuery | undefined>;
  getSavedQueriesByOrgId(orgId: number): Promise<SavedQuery[]>;
  createSavedQuery(query: InsertSavedQuery): Promise<SavedQuery>;
  
  // Issue methods
  getIssue(id: number): Promise<Issue | undefined>;
  getIssuesByOrgId(orgId: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssueStatus(id: number, status: string): Promise<Issue | undefined>;
  
  // Filter Template methods
  getFilterTemplate(id: number): Promise<FilterTemplate | undefined>;
  getFilterTemplatesByUserId(userId: number): Promise<FilterTemplate[]>;
  createFilterTemplate(template: InsertFilterTemplate): Promise<FilterTemplate>;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private salesforceOrgMap: Map<number, SalesforceOrg>;
  private metadataMap: Map<number, Metadata>;
  private healthScoreMap: Map<number, HealthScore>;
  private savedQueryMap: Map<number, SavedQuery>;
  private issueMap: Map<number, Issue>;
  private filterTemplateMap: Map<number, FilterTemplate>;
  
  private nextUserId: number;
  private nextOrgId: number;
  private nextMetadataId: number;
  private nextHealthScoreId: number;
  private nextSavedQueryId: number;
  private nextIssueId: number;
  private nextFilterTemplateId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.userMap = new Map();
    this.salesforceOrgMap = new Map();
    this.metadataMap = new Map();
    this.healthScoreMap = new Map();
    this.savedQueryMap = new Map();
    this.issueMap = new Map();
    this.filterTemplateMap = new Map();
    
    this.nextUserId = 1;
    this.nextOrgId = 1;
    this.nextMetadataId = 1;
    this.nextHealthScoreId = 1;
    this.nextSavedQueryId = 1;
    this.nextIssueId = 1;
    this.nextFilterTemplateId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      ...userData,
      id: this.nextUserId++,
      createdAt: now
    };
    this.userMap.set(user.id, user);
    return user;
  }
  
  // Salesforce Org methods
  async getSalesforceOrg(id: number): Promise<SalesforceOrg | undefined> {
    return this.salesforceOrgMap.get(id);
  }
  
  async getSalesforceOrgsByUserId(userId: number): Promise<SalesforceOrg[]> {
    return Array.from(this.salesforceOrgMap.values()).filter(
      (org) => org.userId === userId
    );
  }
  
  async createSalesforceOrg(orgData: InsertSalesforceOrg): Promise<SalesforceOrg> {
    const now = new Date();
    const org: SalesforceOrg = {
      ...orgData,
      id: this.nextOrgId++,
      createdAt: now,
      lastSyncedAt: null
    };
    this.salesforceOrgMap.set(org.id, org);
    return org;
  }
  
  async updateSalesforceOrgSyncTime(id: number): Promise<SalesforceOrg | undefined> {
    const org = this.salesforceOrgMap.get(id);
    if (!org) return undefined;
    
    const updatedOrg: SalesforceOrg = {
      ...org,
      lastSyncedAt: new Date()
    };
    
    this.salesforceOrgMap.set(id, updatedOrg);
    return updatedOrg;
  }
  
  // Metadata methods
  async getMetadata(id: number): Promise<Metadata | undefined> {
    return this.metadataMap.get(id);
  }
  
  async getMetadataByOrgId(orgId: number, filter?: { type?: string }): Promise<Metadata[]> {
    let metadata = Array.from(this.metadataMap.values()).filter(
      (md) => md.orgId === orgId
    );
    
    if (filter?.type) {
      metadata = metadata.filter((md) => md.type === filter.type);
    }
    
    return metadata;
  }
  
  async createOrUpdateMetadata(metadataData: InsertMetadata): Promise<Metadata> {
    // Check if metadata with same org, type, and name exists
    const existingMetadata = Array.from(this.metadataMap.values()).find(
      (md) => md.orgId === metadataData.orgId && md.type === metadataData.type && md.name === metadataData.name
    );
    
    const now = new Date();
    
    if (existingMetadata) {
      // Update existing metadata
      const updatedMetadata: Metadata = {
        ...existingMetadata,
        data: metadataData.data,
        updatedAt: now
      };
      
      this.metadataMap.set(existingMetadata.id, updatedMetadata);
      return updatedMetadata;
    } else {
      // Create new metadata
      const metadata: Metadata = {
        ...metadataData,
        id: this.nextMetadataId++,
        createdAt: now,
        updatedAt: now
      };
      
      this.metadataMap.set(metadata.id, metadata);
      return metadata;
    }
  }
  
  // Health Score methods
  async getHealthScore(id: number): Promise<HealthScore | undefined> {
    return this.healthScoreMap.get(id);
  }
  
  async getLatestHealthScoreByOrgId(orgId: number): Promise<HealthScore | undefined> {
    const orgScores = Array.from(this.healthScoreMap.values())
      .filter((score) => score.orgId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return orgScores.length > 0 ? orgScores[0] : undefined;
  }
  
  async createHealthScore(healthScoreData: InsertHealthScore): Promise<HealthScore> {
    const now = new Date();
    const healthScore: HealthScore = {
      ...healthScoreData,
      id: this.nextHealthScoreId++,
      createdAt: now
    };
    
    this.healthScoreMap.set(healthScore.id, healthScore);
    return healthScore;
  }
  
  // Saved Query methods
  async getSavedQuery(id: number): Promise<SavedQuery | undefined> {
    return this.savedQueryMap.get(id);
  }
  
  async getSavedQueriesByOrgId(orgId: number): Promise<SavedQuery[]> {
    return Array.from(this.savedQueryMap.values())
      .filter((query) => query.orgId === orgId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async createSavedQuery(queryData: InsertSavedQuery): Promise<SavedQuery> {
    const now = new Date();
    const savedQuery: SavedQuery = {
      ...queryData,
      id: this.nextSavedQueryId++,
      createdAt: now,
      updatedAt: now
    };
    
    this.savedQueryMap.set(savedQuery.id, savedQuery);
    return savedQuery;
  }
  
  // Issue methods
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issueMap.get(id);
  }
  
  async getIssuesByOrgId(orgId: number): Promise<Issue[]> {
    return Array.from(this.issueMap.values())
      .filter((issue) => issue.orgId === orgId)
      .sort((a, b) => {
        // Sort by severity (critical, warning, info)
        const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        
        if (severityDiff !== 0) return severityDiff;
        
        // Then by creation date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async createIssue(issueData: InsertIssue): Promise<Issue> {
    const now = new Date();
    const issue: Issue = {
      ...issueData,
      id: this.nextIssueId++,
      createdAt: now
    };
    
    this.issueMap.set(issue.id, issue);
    return issue;
  }
  
  async updateIssueStatus(id: number, status: string): Promise<Issue | undefined> {
    const issue = this.issueMap.get(id);
    if (!issue) return undefined;
    
    const updatedIssue: Issue = {
      ...issue,
      status
    };
    
    this.issueMap.set(id, updatedIssue);
    return updatedIssue;
  }
  
  // Filter Template methods
  async getFilterTemplate(id: number): Promise<FilterTemplate | undefined> {
    return this.filterTemplateMap.get(id);
  }
  
  async getFilterTemplatesByUserId(userId: number): Promise<FilterTemplate[]> {
    return Array.from(this.filterTemplateMap.values())
      .filter((template) => template.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createFilterTemplate(templateData: InsertFilterTemplate): Promise<FilterTemplate> {
    const now = new Date();
    const template: FilterTemplate = {
      ...templateData,
      id: this.nextFilterTemplateId++,
      createdAt: now
    };
    
    this.filterTemplateMap.set(template.id, template);
    return template;
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
