import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
