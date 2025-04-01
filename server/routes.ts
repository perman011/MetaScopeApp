import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  connectSalesforceOrg,
  getSalesforceOrgs,
  getSalesforceOrg,
  syncSalesforceMetadata,
  executeSoqlQuery,
  saveSoqlQuery,
  getSavedQueries,
  getMetadata,
  getHealthScores,
  getIssues,
  updateIssueStatus
} from "./salesforce";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Salesforce org routes
  app.post("/api/orgs", connectSalesforceOrg);
  app.get("/api/orgs", getSalesforceOrgs);
  app.get("/api/orgs/:id", getSalesforceOrg);
  app.post("/api/orgs/:id/sync", syncSalesforceMetadata);

  // Query routes
  app.post("/api/orgs/:id/query", executeSoqlQuery);
  app.post("/api/orgs/:id/saved-queries", saveSoqlQuery);
  app.get("/api/orgs/:id/saved-queries", getSavedQueries);

  // Metadata routes
  app.get("/api/orgs/:id/metadata", getMetadata);

  // Health score routes
  app.get("/api/orgs/:id/health-scores", getHealthScores);

  // Issues routes
  app.get("/api/orgs/:id/issues", getIssues);
  app.patch("/api/issues/:issueId", updateIssueStatus);

  // Filter template routes
  app.post("/api/filter-templates", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const template = await storage.createFilterTemplate({
        ...req.body,
        userId: req.user!.id,
      });
      
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/filter-templates", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const templates = await storage.getFilterTemplatesByUserId(req.user!.id);
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
