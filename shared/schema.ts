import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  isAdmin: true,
});

export const salesforceOrgs = pgTable("salesforce_orgs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  instanceUrl: text("instance_url").notNull(),
  domain: text("domain"),
  type: text("type").default("production"), // "production", "sandbox", "developer"
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenType: text("token_type"),
  isActive: boolean("is_active").default(true),
  lastMetadataSync: timestamp("last_metadata_sync"),
  lastSyncedAt: timestamp("last_synced_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const insertSalesforceOrgSchema = createInsertSchema(salesforceOrgs).pick({
  userId: true,
  name: true,
  instanceUrl: true,
  domain: true,
  type: true,
  accessToken: true,
  refreshToken: true,
  tokenType: true,
  isActive: true,
});

export const metadata = pgTable("metadata", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  data: json("data").notNull(),
  lastUpdated: timestamp("last_updated").notNull(),
});

export const insertMetadataSchema = createInsertSchema(metadata).pick({
  orgId: true,
  type: true,
  name: true,
  data: true,
  lastUpdated: true,
});

export const healthScores = pgTable("health_scores", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  overallScore: integer("overall_score").notNull(),
  securityScore: integer("security_score").notNull(),
  dataModelScore: integer("data_model_score").notNull(),
  automationScore: integer("automation_score").notNull(),
  apexScore: integer("apex_score").notNull(),
  uiComponentScore: integer("ui_component_score").notNull(),
  // New complexity metrics for Mood Ring
  complexityScore: integer("complexity_score").notNull().default(50),
  performanceRisk: integer("performance_risk").notNull().default(50),
  technicalDebt: integer("technical_debt").notNull().default(50),
  metadataVolume: integer("metadata_volume").notNull().default(50),
  customizationLevel: integer("customization_level").notNull().default(50),
  issues: json("issues").notNull(),
  lastAnalyzed: timestamp("last_analyzed").notNull(),
});

export const insertHealthScoreSchema = createInsertSchema(healthScores).pick({
  orgId: true,
  overallScore: true,
  securityScore: true,
  dataModelScore: true,
  automationScore: true,
  apexScore: true,
  uiComponentScore: true,
  // New complexity metrics for Mood Ring
  complexityScore: true,
  performanceRisk: true,
  technicalDebt: true,
  metadataVolume: true,
  customizationLevel: true,
  issues: true,
  lastAnalyzed: true,
});

// -------- NEW TABLES FOR ADVANCED FEATURES --------

// Code Quality Assessment Table
export const codeQuality = pgTable("code_quality", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  componentId: integer("component_id").references(() => metadata.id),
  componentType: text("component_type").notNull(), // Apex, Lightning, Visualforce, etc.
  componentName: text("component_name").notNull(),
  overallScore: integer("overall_score").notNull(),
  maintainabilityScore: integer("maintainability_score").notNull(),
  performanceScore: integer("performance_score").notNull(),
  reliabilityScore: integer("reliability_score").notNull(),
  securityScore: integer("security_score").notNull(),
  complexityMetrics: json("complexity_metrics").notNull(), // Cyclomatic complexity, etc.
  issues: json("issues").notNull(), // Code quality issues
  bestPractices: json("best_practices").notNull(), // Best practices analysis
  lastAnalyzed: timestamp("last_analyzed").notNull(),
});

export const insertCodeQualitySchema = createInsertSchema(codeQuality).pick({
  orgId: true,
  componentId: true,
  componentType: true,
  componentName: true,
  overallScore: true,
  maintainabilityScore: true,
  performanceScore: true,
  reliabilityScore: true,
  securityScore: true,
  complexityMetrics: true,
  issues: true,
  bestPractices: true,
  lastAnalyzed: true,
});

// Component Dependencies Table
export const componentDependencies = pgTable("component_dependencies", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  sourceComponentId: integer("source_component_id").references(() => metadata.id),
  sourceComponentType: text("source_component_type").notNull(),
  sourceComponentName: text("source_component_name").notNull(),
  targetComponentId: integer("target_component_id").references(() => metadata.id),
  targetComponentType: text("target_component_type").notNull(),
  targetComponentName: text("target_component_name").notNull(),
  dependencyType: text("dependency_type").notNull(), // Direct, Indirect, Circular
  dependencyStrength: integer("dependency_strength").notNull(), // 1-100 scale
  impact: text("impact").notNull(), // High, Medium, Low
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").notNull(),
});

export const insertComponentDependenciesSchema = createInsertSchema(componentDependencies).pick({
  orgId: true,
  sourceComponentId: true,
  sourceComponentType: true,
  sourceComponentName: true,
  targetComponentId: true,
  targetComponentType: true,
  targetComponentName: true,
  dependencyType: true,
  dependencyStrength: true,
  impact: true,
  notes: true,
  lastUpdated: true,
});

// Compliance and Governance Table
export const compliance = pgTable("compliance", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  frameworkName: text("framework_name").notNull(), // GDPR, HIPAA, SOX, etc.
  complianceScore: integer("compliance_score").notNull(),
  status: text("status").notNull(), // Compliant, At Risk, Non-Compliant
  violations: json("violations").notNull(),
  recommendations: json("recommendations").notNull(),
  lastScanned: timestamp("last_scanned").notNull(),
  nextScanDue: timestamp("next_scan_due"),
});

export const insertComplianceSchema = createInsertSchema(compliance).pick({
  orgId: true,
  frameworkName: true,
  complianceScore: true,
  status: true,
  violations: true,
  recommendations: true,
  lastScanned: true,
  nextScanDue: true,
});

// Technical Debt Record Table
export const technicalDebtItems = pgTable("technical_debt_items", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  componentId: integer("component_id").references(() => metadata.id),
  componentType: text("component_type").notNull(),
  componentName: text("component_name").notNull(),
  category: text("category").notNull(), // Architecture, Code, Test Coverage, Documentation
  severity: text("severity").notNull(), // Critical, High, Medium, Low
  impact: text("impact").notNull(), // High, Medium, Low
  effortToFix: text("effort_to_fix").notNull(), // High, Medium, Low
  description: text("description").notNull(),
  recommendation: text("recommendation").notNull(),
  estimatedHours: integer("estimated_hours"),
  estimatedCost: integer("estimated_cost"),
  status: text("status").notNull(), // Open, In Progress, Resolved, Deferred
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  tags: text("tags").array(),
});

export const insertTechnicalDebtItemsSchema = createInsertSchema(technicalDebtItems).pick({
  orgId: true,
  componentId: true,
  componentType: true,
  componentName: true,
  category: true,
  severity: true,
  impact: true,
  effortToFix: true,
  description: true,
  recommendation: true,
  estimatedHours: true,
  estimatedCost: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  tags: true,
});

// Release Impact Analysis Table
export const releaseImpact = pgTable("release_impact", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  releaseName: text("release_name").notNull(),
  releaseDate: date("release_date").notNull(),
  components: json("components").notNull(), // List of component IDs affected
  impactScore: integer("impact_score").notNull(),
  riskScore: integer("risk_score").notNull(),
  testCoverage: integer("test_coverage"), // Percentage
  deploymentEstimate: integer("deployment_estimate"), // Minutes
  dependencies: json("dependencies").notNull(), // Dependent components
  recommendations: json("recommendations").notNull(),
  status: text("status").notNull(), // Planned, In Progress, Deployed, Failed
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const insertReleaseImpactSchema = createInsertSchema(releaseImpact).pick({
  orgId: true,
  releaseName: true,
  releaseDate: true,
  components: true,
  impactScore: true,
  riskScore: true,
  testCoverage: true,
  deploymentEstimate: true,
  dependencies: true,
  recommendations: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSalesforceOrg = z.infer<typeof insertSalesforceOrgSchema>;
export type SalesforceOrg = typeof salesforceOrgs.$inferSelect;

export type InsertMetadata = z.infer<typeof insertMetadataSchema>;
export type Metadata = typeof metadata.$inferSelect;

export type InsertHealthScore = z.infer<typeof insertHealthScoreSchema>;
export type HealthScore = typeof healthScores.$inferSelect & {
  issues?: HealthScoreIssue[];
};

// Health score issue types
export interface HealthScoreIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'security' | 'dataModel' | 'automation' | 'apex' | 'ui';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

// New type definitions for advanced features
export type InsertCodeQuality = z.infer<typeof insertCodeQualitySchema>;
export type CodeQuality = typeof codeQuality.$inferSelect;

export type InsertComponentDependency = z.infer<typeof insertComponentDependenciesSchema>;
export type ComponentDependency = typeof componentDependencies.$inferSelect;

export type InsertCompliance = z.infer<typeof insertComplianceSchema>;
export type Compliance = typeof compliance.$inferSelect;

export type InsertTechnicalDebtItem = z.infer<typeof insertTechnicalDebtItemsSchema>;
export type TechnicalDebtItem = typeof technicalDebtItems.$inferSelect;

export type InsertReleaseImpact = z.infer<typeof insertReleaseImpactSchema>;
export type ReleaseImpact = typeof releaseImpact.$inferSelect;

// CodeQualityIssue interface
export interface CodeQualityIssue {
  id: string;
  line: number;
  column: number;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  description: string;
  recommendation: string;
  codeSnippet?: string;
}

// ComplianceViolation interface
export interface ComplianceViolation {
  id: string;
  rule: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  componentType: string;
  componentName: string;
  details: string;
  recommendation: string;
  impact: string;
}

// ComplexityMetrics interface
export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  commentRatio: number;
  methodCount: number;
  averageMethodLength: number;
  nestingDepth: number;
  duplicatedCode: number;
}

// -------- DATA DICTIONARY TABLES --------

// Data Dictionary Field Records Table
export const dataDictionaryFields = pgTable("data_dictionary_fields", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  objectApiName: text("object_api_name").notNull(),
  objectLabel: text("object_label").notNull(),
  fieldApiName: text("field_api_name").notNull(), 
  fieldLabel: text("field_label").notNull(),
  dataType: text("data_type").notNull(),
  length: integer("length"),
  precision: integer("precision"),
  scale: integer("scale"),
  required: boolean("required").default(false),
  unique: boolean("unique").default(false),
  defaultValue: text("default_value"),
  formula: text("formula"),
  description: text("description"),
  helpText: text("help_text"),
  picklistValues: json("picklist_values"),
  createdBy: text("created_by"),
  lastModifiedBy: text("last_modified_by"),
  lastModifiedDate: timestamp("last_modified_date"),
  controllingField: text("controlling_field"),
  referenceTo: text("reference_to"),
  relationshipName: text("relationship_name"),
  inlineHelpText: text("inline_help_text"),
  searchable: boolean("searchable").default(false),
  filterable: boolean("filterable").default(false),
  sortable: boolean("sortable").default(false),
  visible: boolean("visible").default(true),
  lastSyncedAt: timestamp("last_synced_at").notNull(),
});

export const insertDataDictionaryFieldSchema = createInsertSchema(dataDictionaryFields).pick({
  orgId: true,
  objectApiName: true,
  objectLabel: true,
  fieldApiName: true,
  fieldLabel: true,
  dataType: true,
  length: true,
  precision: true,
  scale: true,
  required: true,
  unique: true,
  defaultValue: true,
  formula: true,
  description: true,
  helpText: true,
  picklistValues: true,
  createdBy: true,
  lastModifiedBy: true,
  lastModifiedDate: true,
  controllingField: true,
  referenceTo: true,
  relationshipName: true,
  inlineHelpText: true,
  searchable: true,
  filterable: true,
  sortable: true,
  visible: true,
  lastSyncedAt: true,
});

// Data Dictionary Pending Changes Table - tracks changes pending deployment back to Salesforce
export const dataDictionaryChanges = pgTable("data_dictionary_changes", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  fieldId: integer("field_id").notNull().references(() => dataDictionaryFields.id),
  fieldApiName: text("field_api_name").notNull(),
  objectApiName: text("object_api_name").notNull(),
  propertyName: text("property_name").notNull(), // Field property being changed (label, helpText, description)
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, deployed, rejected, failed
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  deployedAt: timestamp("deployed_at"),
  notes: text("notes"),
});

export const insertDataDictionaryChangeSchema = createInsertSchema(dataDictionaryChanges).pick({
  orgId: true,
  fieldId: true,
  fieldApiName: true,
  objectApiName: true,
  propertyName: true,
  oldValue: true,
  newValue: true,
  status: true,
  createdBy: true,
  createdAt: true,
  approvedBy: true,
  approvedAt: true,
  deployedAt: true,
  notes: true,
});

// Data Dictionary Audit Log - records all actions performed on data dictionary
export const dataDictionaryAuditLog = pgTable("data_dictionary_audit_log", {
  id: serial("id").primaryKey(), 
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // edit, deploy, sync, export, etc.
  details: json("details").notNull(),
  status: text("status").notNull(), // success, failure
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const insertDataDictionaryAuditLogSchema = createInsertSchema(dataDictionaryAuditLog).pick({
  orgId: true,
  userId: true,
  action: true,
  details: true,
  status: true,
  timestamp: true,
  ipAddress: true,
  userAgent: true,
});

// Type definitions for data dictionary tables
export type InsertDataDictionaryField = z.infer<typeof insertDataDictionaryFieldSchema>;
export type DataDictionaryField = typeof dataDictionaryFields.$inferSelect;

export type InsertDataDictionaryChange = z.infer<typeof insertDataDictionaryChangeSchema>;
export type DataDictionaryChange = typeof dataDictionaryChanges.$inferSelect;

export type InsertDataDictionaryAuditLog = z.infer<typeof insertDataDictionaryAuditLogSchema>;
export type DataDictionaryAuditLog = typeof dataDictionaryAuditLog.$inferSelect;
