import {
  User, InsertUser,
  SalesforceOrg, InsertSalesforceOrg,
  Metadata, InsertMetadata,
  HealthScore, InsertHealthScore, HealthScoreIssue,
  CodeQuality, InsertCodeQuality,
  ComponentDependency, InsertComponentDependency,
  Compliance, InsertCompliance,
  TechnicalDebtItem, InsertTechnicalDebtItem,
  ReleaseImpact, InsertReleaseImpact,
  DataDictionaryField, InsertDataDictionaryField,
  DataDictionaryChange, InsertDataDictionaryChange,
  DataDictionaryAuditLog, InsertDataDictionaryAuditLog
} from "@shared/schema";
import crypto from "crypto";
import expressSession from 'express-session';
import createMemoryStore from 'memorystore';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, or } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";

// Initialize memory store for session
const MemoryStore = createMemoryStore(expressSession);

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
  
  // Data Dictionary Field operations
  getDataDictionaryField(id: number): Promise<DataDictionaryField | undefined>;
  getDataDictionaryFields(orgId: number, objectNames?: string[]): Promise<DataDictionaryField[]>;
  saveDataDictionaryField(field: InsertDataDictionaryField): Promise<DataDictionaryField>;
  updateDataDictionaryField(id: number, updates: Partial<InsertDataDictionaryField>): Promise<DataDictionaryField | undefined>;
  
  // Data Dictionary Change operations
  getDataDictionaryChanges(orgId: number, changeIds?: number[], status?: string): Promise<DataDictionaryChange[]>;
  createDataDictionaryChange(change: InsertDataDictionaryChange): Promise<DataDictionaryChange>;
  updateDataDictionaryChangeStatus(id: number, status: string, approvedBy?: number, errorMessage?: string): Promise<DataDictionaryChange | undefined>;
  
  // Data Dictionary Audit Log operations
  getDataDictionaryAuditLogs(orgId: number): Promise<DataDictionaryAuditLog[]>;
  createDataDictionaryAuditLog(log: InsertDataDictionaryAuditLog): Promise<DataDictionaryAuditLog>;
  
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
      try {
        // Use the imported bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('admin123', saltRounds);
        
        // Create an admin user with preset credentials
        await this.createUser({
          username: '4980005@gmail.com',
          password: hashedPassword,
          fullName: 'System Administrator',
          email: '4980005@gmail.com',
          isAdmin: true
        });
        console.log('Admin user created successfully');
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
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
    
    // Ensure componentId is not undefined
    const componentId = insertCodeQuality.componentId === undefined 
      ? null 
      : insertCodeQuality.componentId;
    
    const codeQuality: CodeQuality = {
      ...insertCodeQuality,
      id,
      componentId,
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
    
    // Ensure source and target component IDs are not undefined
    const sourceComponentId = insertDependency.sourceComponentId === undefined 
      ? null 
      : insertDependency.sourceComponentId;
    
    const targetComponentId = insertDependency.targetComponentId === undefined 
      ? null 
      : insertDependency.targetComponentId;
    
    const notes = insertDependency.notes === undefined 
      ? null 
      : insertDependency.notes;
    
    const dependency: ComponentDependency = {
      ...insertDependency,
      id,
      sourceComponentId,
      targetComponentId,
      notes,
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
    
    // Handle nextScanDue to prevent undefined values
    const nextScanDue = insertCompliance.nextScanDue === undefined 
      ? null 
      : insertCompliance.nextScanDue;
    
    const compliance: Compliance = {
      ...insertCompliance,
      id,
      nextScanDue,
      lastScanned: insertCompliance.lastScanned || new Date(),
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
        return item.orgId === orgId && 
          (!category || item.category === category) && 
          (!status || item.status === status);
      }
    );
  }

  async createTechnicalDebtItem(insertItem: InsertTechnicalDebtItem): Promise<TechnicalDebtItem> {
    const id = this.technicalDebtItemIdCounter++;
    
    // Ensure componentId is not undefined
    const componentId = insertItem.componentId === undefined 
      ? null 
      : insertItem.componentId;
    
    // Ensure tags is not undefined
    const tags = insertItem.tags === undefined 
      ? null 
      : insertItem.tags;
    
    // Ensure estimatedHours and estimatedCost are not undefined
    const estimatedHours = insertItem.estimatedHours === undefined 
      ? null 
      : insertItem.estimatedHours;
    
    const estimatedCost = insertItem.estimatedCost === undefined 
      ? null 
      : insertItem.estimatedCost;
    
    const item: TechnicalDebtItem = {
      ...insertItem,
      id,
      componentId,
      tags,
      estimatedHours,
      estimatedCost,
      createdAt: insertItem.createdAt || new Date(),
      updatedAt: insertItem.updatedAt || new Date(),
      resolvedAt: insertItem.resolvedAt || null,
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
    
    // Ensure optional fields are not undefined
    const testCoverage = insertImpact.testCoverage === undefined 
      ? null 
      : insertImpact.testCoverage;
    
    const deploymentEstimate = insertImpact.deploymentEstimate === undefined 
      ? null 
      : insertImpact.deploymentEstimate;
    
    const impact: ReleaseImpact = {
      ...insertImpact,
      id,
      testCoverage,
      deploymentEstimate,
      createdAt: insertImpact.createdAt || new Date(),
      updatedAt: insertImpact.updatedAt || new Date(),
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

  // Data Dictionary Field storage
  private dataDictionaryFields: Map<number, DataDictionaryField> = new Map();
  private dataDictionaryFieldIdCounter: number = 1;
  
  async getDataDictionaryField(id: number): Promise<DataDictionaryField | undefined> {
    return this.dataDictionaryFields.get(id);
  }
  
  async getDataDictionaryFields(orgId: number, objectNames?: string[]): Promise<DataDictionaryField[]> {
    const fields = Array.from(this.dataDictionaryFields.values()).filter(
      (field) => field.orgId === orgId
    );
    
    if (objectNames && objectNames.length > 0) {
      return fields.filter(field => objectNames.includes(field.objectApiName));
    }
    
    return fields;
  }
  
  async saveDataDictionaryField(field: InsertDataDictionaryField): Promise<DataDictionaryField> {
    // Check if the field already exists
    const existingField = Array.from(this.dataDictionaryFields.values()).find(
      (f) => 
        f.orgId === field.orgId && 
        f.objectApiName === field.objectApiName && 
        f.fieldApiName === field.fieldApiName
    );
    
    if (existingField) {
      // Update the existing field
      const updatedField: DataDictionaryField = {
        ...existingField,
        ...field,
        lastSyncedAt: field.lastSyncedAt || new Date()
      };
      this.dataDictionaryFields.set(existingField.id, updatedField);
      return updatedField;
    }
    
    // Create a new field
    const id = this.dataDictionaryFieldIdCounter++;
    const newField: DataDictionaryField = {
      ...field,
      id,
      lastSyncedAt: field.lastSyncedAt || new Date()
    };
    this.dataDictionaryFields.set(id, newField);
    return newField;
  }
  
  async updateDataDictionaryField(id: number, updates: Partial<InsertDataDictionaryField>): Promise<DataDictionaryField | undefined> {
    const field = this.dataDictionaryFields.get(id);
    if (!field) return undefined;
    
    const updatedField: DataDictionaryField = {
      ...field,
      ...updates,
    };
    this.dataDictionaryFields.set(id, updatedField);
    return updatedField;
  }
  
  // Data Dictionary Change storage
  private dataDictionaryChanges: Map<number, DataDictionaryChange> = new Map();
  private dataDictionaryChangeIdCounter: number = 1;
  
  async getDataDictionaryChanges(orgId: number, changeIds?: number[], status?: string): Promise<DataDictionaryChange[]> {
    let changes = Array.from(this.dataDictionaryChanges.values()).filter(
      (change) => change.orgId === orgId
    );
    
    if (changeIds && changeIds.length > 0) {
      changes = changes.filter(change => changeIds.includes(change.id));
    }
    
    if (status) {
      changes = changes.filter(change => change.status === status);
    }
    
    return changes;
  }
  
  async createDataDictionaryChange(change: InsertDataDictionaryChange): Promise<DataDictionaryChange> {
    const id = this.dataDictionaryChangeIdCounter++;
    const newChange: DataDictionaryChange = {
      ...change,
      id,
      updatedAt: change.updatedAt || null,
      updatedBy: change.updatedBy || null,
      deployedAt: change.deployedAt || null,
      errorMessage: change.errorMessage || null
    };
    this.dataDictionaryChanges.set(id, newChange);
    return newChange;
  }
  
  async updateDataDictionaryChangeStatus(id: number, status: string, approvedBy?: number, errorMessage?: string): Promise<DataDictionaryChange | undefined> {
    const change = this.dataDictionaryChanges.get(id);
    if (!change) return undefined;
    
    const updatedChange: DataDictionaryChange = {
      ...change,
      status,
      updatedAt: new Date(),
      updatedBy: approvedBy || null,
      deployedAt: status === 'deployed' ? new Date() : change.deployedAt,
      errorMessage: errorMessage || null
    };
    this.dataDictionaryChanges.set(id, updatedChange);
    return updatedChange;
  }
  
  // Data Dictionary Audit Log storage
  private dataDictionaryAuditLogs: Map<number, DataDictionaryAuditLog> = new Map();
  private dataDictionaryAuditLogIdCounter: number = 1;
  
  async getDataDictionaryAuditLogs(orgId: number): Promise<DataDictionaryAuditLog[]> {
    return Array.from(this.dataDictionaryAuditLogs.values()).filter(
      (log) => log.orgId === orgId
    ).sort((a, b) => (b.timestamp as any) - (a.timestamp as any)); // Sort newest first
  }
  
  async createDataDictionaryAuditLog(log: InsertDataDictionaryAuditLog): Promise<DataDictionaryAuditLog> {
    const id = this.dataDictionaryAuditLogIdCounter++;
    const newLog: DataDictionaryAuditLog = {
      ...log,
      id,
      timestamp: log.timestamp || new Date()
    };
    this.dataDictionaryAuditLogs.set(id, newLog);
    return newLog;
  }
}

// PostgreSQL Storage Implementation
class PostgresStorage implements IStorage {
  private db: any;
  sessionStore: any;

  constructor() {
    try {
      // Create a connection to the database with the correct client configuration
      const client = neon(process.env.DATABASE_URL!);
      
      // Initialize drizzle with the schema
      this.db = drizzle(client, { schema });
      
      // Use in-memory session store since we're having issues with PostgreSQL session store
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
      
      console.log("PostgreSQL storage initialized with in-memory session store");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL storage:", error);
      throw error;
    }
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
    // Ensure componentId is not undefined
    const values: any = { ...codeQuality };
    if (values.componentId === undefined) {
      values.componentId = null;
    }
    
    const result = await this.db.insert(schema.codeQuality).values(values).returning();
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

  // Additional utility method for getting all dependencies related to a component
  async getOrgComponentDependencies(orgId: number, componentId?: number): Promise<ComponentDependency[]> {
    if (componentId) {
      // Using the eq and or operators from drizzle
      const { eq, or } = this.db._.schema.componentDependencies;
      
      return await this.db.select()
        .from(schema.componentDependencies)
        .where(
          or(
            eq(schema.componentDependencies.sourceComponentId, componentId),
            eq(schema.componentDependencies.targetComponentId, componentId)
          )
        )
        .where(eq(schema.componentDependencies.orgId, orgId));
    }
    return await this.db.select().from(schema.componentDependencies).where({ orgId });
  }

  async createComponentDependency(dependency: InsertComponentDependency): Promise<ComponentDependency> {
    // Ensure source and target component IDs are not undefined
    const values: any = { ...dependency };
    if (values.sourceComponentId === undefined) {
      values.sourceComponentId = null;
    }
    if (values.targetComponentId === undefined) {
      values.targetComponentId = null;
    }
    if (values.notes === undefined) {
      values.notes = null;
    }
    
    const result = await this.db.insert(schema.componentDependencies).values(values).returning();
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
    // Using the eq operator from drizzle
    const { eq } = this.db._.schema.technicalDebtItems;
    
    let query = this.db.select()
      .from(schema.technicalDebtItems)
      .where(eq(schema.technicalDebtItems.orgId, orgId));
    
    if (category) {
      query = query.where(eq(schema.technicalDebtItems.category, category));
    }
    
    if (status) {
      query = query.where(eq(schema.technicalDebtItems.status, status));
    }
    
    return await query;
  }

  async createTechnicalDebtItem(item: InsertTechnicalDebtItem): Promise<TechnicalDebtItem> {
    // Ensure componentId and tags are not undefined
    const values: any = { ...item };
    if (values.componentId === undefined) {
      values.componentId = null;
    }
    if (values.tags === undefined) {
      values.tags = null;
    }
    
    const result = await this.db.insert(schema.technicalDebtItems).values(values).returning();
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
    // Using the eq operator from drizzle
    const { eq } = this.db._.schema.releaseImpact;
    
    let query = this.db.select()
      .from(schema.releaseImpact)
      .where(eq(schema.releaseImpact.orgId, orgId));
    
    if (status) {
      query = query.where(eq(schema.releaseImpact.status, status));
    }
    
    return await query;
  }

  async createReleaseImpact(impact: InsertReleaseImpact): Promise<ReleaseImpact> {
    // Ensure optional fields are not undefined
    const values: any = { ...impact };
    if (values.testCoverage === undefined) {
      values.testCoverage = null;
    }
    if (values.deploymentEstimate === undefined) {
      values.deploymentEstimate = null;
    }
    
    const result = await this.db.insert(schema.releaseImpact).values(values).returning();
    return result[0];
  }

  async updateReleaseImpact(id: number, updates: Partial<InsertReleaseImpact>): Promise<ReleaseImpact | undefined> {
    const result = await this.db.update(schema.releaseImpact).set(updates).where({ id }).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Data Dictionary Field operations
  async getDataDictionaryField(id: number): Promise<DataDictionaryField | undefined> {
    const result = await this.db.select().from(schema.dataDictionaryFields).where({ id }).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getDataDictionaryFields(orgId: number, objectNames?: string[]): Promise<DataDictionaryField[]> {
    if (objectNames && objectNames.length > 0) {
      return await this.db.select()
        .from(schema.dataDictionaryFields)
        .where({ orgId })
        .where(
          or(
            ...objectNames.map(name => 
              eq(schema.dataDictionaryFields.objectApiName, name)
            )
          )
        );
    }
    return await this.db.select().from(schema.dataDictionaryFields).where({ orgId });
  }
  
  async saveDataDictionaryField(field: InsertDataDictionaryField): Promise<DataDictionaryField> {
    // Check if the field already exists
    const existingField = await this.db.select()
      .from(schema.dataDictionaryFields)
      .where({ 
        orgId: field.orgId,
        objectApiName: field.objectApiName,
        fieldApiName: field.fieldApiName
      })
      .limit(1);
    
    if (existingField.length > 0) {
      // Update the existing field
      const result = await this.db.update(schema.dataDictionaryFields)
        .set({
          ...field,
          lastSyncedAt: field.lastSyncedAt || new Date()
        })
        .where({ id: existingField[0].id })
        .returning();
      return result[0];
    }
    
    // Create a new field
    const result = await this.db.insert(schema.dataDictionaryFields)
      .values({
        ...field,
        lastSyncedAt: field.lastSyncedAt || new Date()
      })
      .returning();
    return result[0];
  }
  
  async updateDataDictionaryField(id: number, updates: Partial<InsertDataDictionaryField>): Promise<DataDictionaryField | undefined> {
    const result = await this.db.update(schema.dataDictionaryFields)
      .set(updates)
      .where({ id })
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Data Dictionary Change operations
  async getDataDictionaryChanges(orgId: number, changeIds?: number[], status?: string): Promise<DataDictionaryChange[]> {
    let query = this.db.select()
      .from(schema.dataDictionaryChanges)
      .where({ orgId });
    
    if (changeIds && changeIds.length > 0) {
      query = query.where(
        or(
          ...changeIds.map(id => 
            eq(schema.dataDictionaryChanges.id, id)
          )
        )
      );
    }
    
    if (status) {
      query = query.where({ status });
    }
    
    return await query;
  }
  
  async createDataDictionaryChange(change: InsertDataDictionaryChange): Promise<DataDictionaryChange> {
    const result = await this.db.insert(schema.dataDictionaryChanges)
      .values({
        ...change,
        updatedAt: change.updatedAt || null,
        updatedBy: change.updatedBy || null,
        deployedAt: change.deployedAt || null,
        errorMessage: change.errorMessage || null
      })
      .returning();
    return result[0];
  }
  
  async updateDataDictionaryChangeStatus(id: number, status: string, approvedBy?: number, errorMessage?: string): Promise<DataDictionaryChange | undefined> {
    const updates = {
      status,
      updatedAt: new Date(),
      updatedBy: approvedBy || null,
      deployedAt: status === 'deployed' ? new Date() : undefined,
      errorMessage: errorMessage || null
    };
    
    const result = await this.db.update(schema.dataDictionaryChanges)
      .set(updates)
      .where({ id })
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Data Dictionary Audit Log operations
  async getDataDictionaryAuditLogs(orgId: number): Promise<DataDictionaryAuditLog[]> {
    return await this.db.select()
      .from(schema.dataDictionaryAuditLog)
      .where({ orgId })
      .orderBy({ timestamp: 'desc' });
  }
  
  async createDataDictionaryAuditLog(log: InsertDataDictionaryAuditLog): Promise<DataDictionaryAuditLog> {
    const result = await this.db.insert(schema.dataDictionaryAuditLog)
      .values({
        ...log,
        timestamp: log.timestamp || new Date()
      })
      .returning();
    return result[0];
  }
}

// Check if we have a DATABASE_URL environment variable, but temporarily force in-memory storage
// until we fully resolve the PostgreSQL issues
const usePostgres = false; // !!process.env.DATABASE_URL;
console.log(`Using ${usePostgres ? 'PostgreSQL' : 'In-Memory'} storage (PostgreSQL temporarily disabled)`);

export const storage = usePostgres ? new PostgresStorage() : new MemStorage();