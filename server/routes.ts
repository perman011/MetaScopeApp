import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { salesforceService, SalesforceService } from "./salesforce";
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
  
  // Middleware to check if user is an admin
  const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).send('Forbidden: Admin access required');
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
      const { 
        authMethod, 
        // Credential-based auth fields 
        email,
        password,
        securityToken,
        environment
      } = req.body;
      
      if (authMethod === 'credentials') {
        if (!email || !password) {
          return res.status(400).send("Email and password are required for credential authentication");
        }
        
        try {
          // Authenticate with Salesforce
          const authResult = await salesforceService.authenticateWithCredentials({
            email,
            password,
            securityToken: securityToken || '',
            environment: environment || 'production'
          });
          
          // Add the auth result to the org data
          const orgData = {
            ...req.body,
            userId: req.user!.id,
            instanceUrl: authResult.instanceUrl,
            accessToken: authResult.accessToken,
            refreshToken: authResult.refreshToken || undefined
          };
          
          // Validate and create the org
          const validatedData = insertSalesforceOrgSchema.parse(orgData);
          const org = await storage.createOrg(validatedData);
          res.status(201).json(org);
        } catch (authError) {
          console.error("Salesforce authentication error:", authError);
          return res.status(401).send("Failed to authenticate with Salesforce: " + authError.message);
        }
      } else {
        // Token-based authentication (original flow)
        const validatedData = insertSalesforceOrgSchema.parse({
          ...req.body,
          userId: req.user!.id
        });
        
        const org = await storage.createOrg(validatedData);
        res.status(201).json(org);
      }
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

  app.post("/api/orgs/:id/refresh", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      // If the org has a refresh token, use it to get a new access token
      if (!org.refreshToken) {
        return res.status(400).send("No refresh token available for this org");
      }
      
      // In a real implementation, this would make an OAuth call to Salesforce
      // For now, we'll just update the lastAccessedAt timestamp
      const updatedOrg = await storage.updateOrg(org.id, {
        // Use any field that's in the schema
        accessToken: org.accessToken, // Just reuse the existing token as a way to "refresh" it
        lastSyncedAt: new Date().toISOString() 
      });
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error refreshing token:", error);
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
  
  // Apex Debug Analyzer Routes
  
  // Get users for trace flag selection
  app.get("/api/orgs/:id/users", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const users = await salesforceService.getOrgUsers(org);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Get apex logs
  app.get("/api/orgs/:id/apex-logs", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const logs = await salesforceService.getApexLogs(org);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching apex logs:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Get specific apex log details
  app.get("/api/orgs/:id/apex-logs/:logId", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const logDetail = await salesforceService.getApexLogDetail(org, req.params.logId);
      res.json(logDetail);
    } catch (error) {
      console.error("Error fetching apex log detail:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Delete apex log
  app.delete("/api/orgs/:id/apex-logs/:logId", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      await salesforceService.deleteApexLog(org, req.params.logId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting apex log:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Get trace flags
  app.get("/api/orgs/:id/trace-flags", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const traceFlags = await salesforceService.getTraceFlags(org);
      res.json(traceFlags);
    } catch (error) {
      console.error("Error fetching trace flags:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Create trace flag
  app.post("/api/orgs/:id/trace-flags", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const { tracedEntityId, debugLevelId, debugLevel, expirationMinutes } = req.body;
      
      if (!tracedEntityId) {
        return res.status(400).send("Traced entity ID is required");
      }
      
      const traceFlag = await salesforceService.createTraceFlag(
        org, 
        tracedEntityId, 
        debugLevelId, 
        debugLevel, 
        expirationMinutes
      );
      
      res.status(201).json(traceFlag);
    } catch (error) {
      console.error("Error creating trace flag:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Delete trace flag
  app.delete("/api/orgs/:id/trace-flags/:flagId", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      await salesforceService.deleteTraceFlag(org, req.params.flagId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting trace flag:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Metadata Types Route
  app.get("/api/metadata-types", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.query.orgId as string);
      
      if (isNaN(orgId)) {
        // If no orgId was provided, return the default metadata types
        const types = SalesforceService.getMetadataTypes();
        return res.json(types);
      } 
      
      // Get the org from storage
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).send("Salesforce org not found");
      }
      
      // Use the org to fetch metadata types from Salesforce
      const types = await salesforceService.getMetadataTypes(org);
      res.json(types);
    } catch (error) {
      console.error("Error fetching metadata types:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Metadata Dependencies Routes
  app.get("/api/orgs/:id/metadata/dependencies", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const metadataType = req.query.type as string | undefined;
      const dependencies = await salesforceService.getMetadataDependencies(org, metadataType);
      res.json(dependencies);
    } catch (error) {
      console.error("Error fetching metadata dependencies:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  app.get("/api/orgs/:id/metadata/dependencies/reverse", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const componentName = req.query.name as string;
      if (!componentName) {
        return res.status(400).send("Component name is required");
      }
      
      const reverseDependencies = await salesforceService.getReverseDependencies(org, componentName);
      res.json(reverseDependencies);
    } catch (error) {
      console.error("Error fetching reverse dependencies:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Admin Routes - Protected by admin middleware
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      // Get all users but exclude password field
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  app.get("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  app.patch("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Update user fields except password (password change would need separate endpoint with more validation)
      const { password, ...updateData } = req.body;
      
      // Add method to storage.ts later: updateUser
      // For now placeholder response
      res.json({ ...user, ...updateData });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
