import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { salesforceService } from "./salesforce";
import { z } from "zod";
import { insertSalesforceOrgSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send('Unauthorized');
  };

  // Salesforce Org Management Routes
  app.get("/api/orgs", ensureAuthenticated, async (req, res) => {
    try {
      const orgs = await storage.getUserOrgs(req.user.id);
      res.json(orgs);
    } catch (error) {
      console.error("Error fetching orgs:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/api/orgs/:id", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      res.json(org);
    } catch (error) {
      console.error("Error fetching org:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/api/orgs", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSalesforceOrgSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const org = await storage.createOrg(validatedData);
      res.status(201).json(org);
    } catch (error) {
      console.error("Error creating org:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      res.status(500).send("Internal Server Error");
    }
  });

  app.put("/api/orgs/:id", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const updatedOrg = await storage.updateOrg(parseInt(req.params.id), req.body);
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error updating org:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.delete("/api/orgs/:id", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      await storage.deleteOrg(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting org:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Metadata Routes
  app.get("/api/orgs/:id/metadata", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const type = req.query.type as string | undefined;
      const metadata = await storage.getOrgMetadata(org.id, type);
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/api/orgs/:id/sync", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const types = req.body.types || [];
      const metadata = await salesforceService.getMetadata(org, types);
      res.json(metadata);
    } catch (error) {
      console.error("Error syncing metadata:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Health Score Routes
  app.get("/api/orgs/:id/health", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const healthScore = await storage.getLatestHealthScore(org.id);
      res.json(healthScore);
    } catch (error) {
      console.error("Error fetching health score:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/api/orgs/:id/analyze", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const healthScore = await salesforceService.generateHealthScore(org.id);
      res.json(healthScore);
    } catch (error) {
      console.error("Error analyzing org:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // SOQL Query Route
  app.post("/api/orgs/:id/query", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const { query } = req.body;
      if (!query) {
        return res.status(400).send("Query is required");
      }
      
      const results = await salesforceService.executeQuery(org, query);
      res.json(results);
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Metadata Types Route
  app.get("/api/metadata-types", ensureAuthenticated, (req, res) => {
    try {
      const types = salesforceService.constructor.prototype.constructor.getMetadataTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching metadata types:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
