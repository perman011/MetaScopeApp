import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Salesforce Org schema
export const salesforceOrgs = pgTable("salesforce_orgs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  instanceUrl: text("instance_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  type: text("type").notNull(), // 'production', 'sandbox', etc.
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const insertSalesforceOrgSchema = createInsertSchema(salesforceOrgs).pick({
  userId: true,
  name: true,
  domain: true,
  instanceUrl: true,
  isActive: true,
  type: true,
  accessToken: true,
  refreshToken: true,
});

// Metadata schema
export const metadata = pgTable("metadata", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  type: text("type").notNull(), // 'object', 'field', 'apex', etc.
  name: text("name").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMetadataSchema = createInsertSchema(metadata).pick({
  orgId: true,
  type: true,
  name: true,
  data: true,
});

// Health Score schema
export const healthScores = pgTable("health_scores", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  overallScore: integer("overall_score").notNull(),
  securityScore: integer("security_score").notNull(),
  performanceScore: integer("performance_score").notNull(),
  codeQualityScore: integer("code_quality_score").notNull(),
  bestPracticesScore: integer("best_practices_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHealthScoreSchema = createInsertSchema(healthScores).pick({
  orgId: true,
  overallScore: true,
  securityScore: true,
  performanceScore: true,
  codeQualityScore: true,
  bestPracticesScore: true,
});

// Saved Queries schema
export const savedQueries = pgTable("saved_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  name: text("name").notNull(),
  query: text("query").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSavedQuerySchema = createInsertSchema(savedQueries).pick({
  userId: true,
  orgId: true,
  name: true,
  query: true,
});

// Issues schema
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => salesforceOrgs.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // 'critical', 'warning', 'info'
  type: text("type").notNull(), // 'security', 'performance', etc.
  status: text("status").notNull().default('open'), // 'open', 'ignored', 'resolved'
  relatedMetadata: jsonb("related_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIssueSchema = createInsertSchema(issues).pick({
  orgId: true,
  title: true,
  description: true,
  severity: true,
  type: true,
  status: true,
  relatedMetadata: true,
});

// Filter Templates schema
export const filterTemplates = pgTable("filter_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  isShared: boolean("is_shared").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFilterTemplateSchema = createInsertSchema(filterTemplates).pick({
  userId: true,
  name: true,
  filters: true,
  isShared: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SalesforceOrg = typeof salesforceOrgs.$inferSelect;
export type InsertSalesforceOrg = z.infer<typeof insertSalesforceOrgSchema>;

export type Metadata = typeof metadata.$inferSelect;
export type InsertMetadata = z.infer<typeof insertMetadataSchema>;

export type HealthScore = typeof healthScores.$inferSelect;
export type InsertHealthScore = z.infer<typeof insertHealthScoreSchema>;

export type SavedQuery = typeof savedQueries.$inferSelect;
export type InsertSavedQuery = z.infer<typeof insertSavedQuerySchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type FilterTemplate = typeof filterTemplates.$inferSelect;
export type InsertFilterTemplate = z.infer<typeof insertFilterTemplateSchema>;
