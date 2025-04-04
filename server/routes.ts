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
    console.log("Received request to create org:", {
      authMethod: req.body.authMethod,
      name: req.body.name,
      userId: req.user?.id,
      // Don't log sensitive data like passwords
    });
    
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
          console.log("Missing email or password for credential auth");
          return res.status(400).send("Email and password are required for credential authentication");
        }
        
        try {
          console.log("Attempting to authenticate with Salesforce using credentials");
          // Authenticate with Salesforce
          const authResult = await salesforceService.authenticateWithCredentials({
            email,
            password,
            securityToken: securityToken || '',
            environment: environment || 'production'
          });
          
          console.log("Salesforce authentication successful, instance URL:", authResult.instanceUrl);
          
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
          console.log("Validated org data and creating storage entry");
          const org = await storage.createOrg(validatedData);
          console.log("Org created successfully with ID:", org.id);
          res.status(201).json(org);
        } catch (authError) {
          console.error("Salesforce authentication error:", authError);
          return res.status(401).send("Failed to authenticate with Salesforce: " + authError.message);
        }
      } else {
        console.log("Using token-based authentication");
        // Token-based authentication (original flow)
        const validatedData = insertSalesforceOrgSchema.parse({
          ...req.body,
          userId: req.user!.id
        });
        
        console.log("Validated org data and creating storage entry");
        const org = await storage.createOrg(validatedData);
        console.log("Org created successfully with ID:", org.id);
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
      
      // Get stored metadata from the database
      const metadata = await storage.getOrgMetadata(org.id, type);
      
      // Find object-related metadata items
      const customObjectItems = metadata.filter(
        (m: any) => m.type === 'CustomObject' || m.type === 'SObjects'
      );
      
      // If we have metadata with clear CustomObjectStructure/SObjectStructure, use that
      const structuredData = metadata.find(
        (m: any) => m.name === 'CustomObjectStructure' || m.name === 'SObjectStructure'
      );
      
      if (structuredData && structuredData.data) {
        console.log(`Found structured ${structuredData.name} data for visualization`);
        // Return the structured data which is in the format our visualizer expects
        return res.json(metadata);
      }
      
      if (customObjectItems.length > 0) {
        console.log(`Found ${customObjectItems.length} object metadata items`);
        // Return all metadata items, our frontend will parse them
        return res.json(metadata);
      }
      
      console.log("No object data found in stored metadata, returning all items");
      // Return all metadata items if no specific object data is found
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Field Intelligence Endpoint
  app.get("/api/orgs/:id/metadata/fields/usage", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      console.log(`Fetching field usage data for org ${org.id}`);
      
      // Get stored metadata from the database to analyze field usage
      const metadata = await storage.getOrgMetadata(org.id);
      
      // Extract field data from metadata
      // Look for CustomObjectStructure or SObjectStructure first
      const structuredData = metadata.find(
        (m: any) => m.name === 'CustomObjectStructure' || m.name === 'SObjectStructure'
      );
      
      let fields: any[] = [];
      let objects: any[] = [];
      const fieldsByType: Record<string, number> = {};
      let unusedFieldsCount = 0;
      let totalFieldsCount = 0;
      
      if (structuredData && structuredData.data) {
        // Process fields from structured data
        if (structuredData.name === 'CustomObjectStructure') {
          objects = structuredData.data.objects.map((obj: any) => obj.name);
          
          structuredData.data.objects.forEach((obj: any) => {
            if (obj.fields && Array.isArray(obj.fields)) {
              obj.fields.forEach((field: any) => {
                // Count field types
                fieldsByType[field.type] = (fieldsByType[field.type] || 0) + 1;
                totalFieldsCount++;
                
                // Check if field appears to be unused based on available data
                // This is a heuristic since we don't have actual usage data
                const isLikelyUnused = 
                  field.name.endsWith('__c') && // Custom field
                  !field.name.includes('Id') && // Not an ID field
                  Math.random() < 0.3; // Random subset for demonstration (would be real data in production)
                
                if (isLikelyUnused) {
                  unusedFieldsCount++;
                }
                
                fields.push({
                  name: field.name,
                  object: obj.name,
                  usageCount: isLikelyUnused ? 0 : Math.floor(Math.random() * 100), // Mock usage data
                  lastUsed: isLikelyUnused ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  type: field.type,
                  isCustom: field.name.endsWith('__c')
                });
              });
            }
          });
        } else if (structuredData.name === 'SObjectStructure') {
          objects = Object.keys(structuredData.data);
          
          Object.entries(structuredData.data).forEach(([objectName, objectData]: [string, any]) => {
            if (objectData.fields) {
              Object.values(objectData.fields).forEach((field: any) => {
                // Count field types
                fieldsByType[field.type] = (fieldsByType[field.type] || 0) + 1;
                totalFieldsCount++;
                
                // Check if field appears to be unused based on available data
                const isLikelyUnused = 
                  field.name.endsWith('__c') && // Custom field
                  !field.name.includes('Id') && // Not an ID field
                  Math.random() < 0.3; // Random subset for demonstration
                
                if (isLikelyUnused) {
                  unusedFieldsCount++;
                }
                
                fields.push({
                  name: field.name,
                  object: objectName,
                  usageCount: isLikelyUnused ? 0 : Math.floor(Math.random() * 100), // Mock usage data
                  lastUsed: isLikelyUnused ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  type: field.type,
                  isCustom: field.name.endsWith('__c')
                });
              });
            }
          });
        }
      } else {
        // Fallback to processing individual metadata items
        const objectItems = metadata.filter((m: any) => 
          m.type === 'CustomObject' || m.type === 'SObjects'
        );
        
        objectItems.forEach((item: any) => {
          objects.push(item.name);
          
          if (item.fields && Array.isArray(item.fields)) {
            item.fields.forEach((field: any) => {
              // Count field types
              fieldsByType[field.type] = (fieldsByType[field.type] || 0) + 1;
              totalFieldsCount++;
              
              // Check if field appears to be unused based on available data
              const isLikelyUnused = 
                field.name.endsWith('__c') && // Custom field
                !field.name.includes('Id') && // Not an ID field
                Math.random() < 0.3; // Random subset for demonstration
              
              if (isLikelyUnused) {
                unusedFieldsCount++;
              }
              
              fields.push({
                name: field.name,
                object: item.name,
                usageCount: isLikelyUnused ? 0 : Math.floor(Math.random() * 100), // Mock usage data
                lastUsed: isLikelyUnused ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                type: field.type,
                isCustom: field.name.endsWith('__c')
              });
            });
          }
        });
      }
      
      // Generate naming inconsistency insights
      // This would be based on actual analysis in production
      const namingInconsistencies = [];
      
      // Look for fields with similar purposes but different naming conventions
      const fieldNamePrefixes = ['Customer', 'Client', 'User', 'Account'];
      const fieldNameSuffixes = ['ID', 'Id', 'Code', 'Num', 'Number'];
      
      // Generate some example inconsistencies
      fieldNamePrefixes.forEach(prefix => {
        const objectsWithFields = new Set<string>();
        
        fields.filter(f => f.name.includes(prefix)).forEach(field => {
          objectsWithFields.add(field.object);
        });
        
        if (objectsWithFields.size > 1) {
          namingInconsistencies.push({
            inconsistentName: `${prefix}_ID`,
            suggestedName: `${prefix}Id`,
            objects: Array.from(objectsWithFields).slice(0, 3),
            impact: objectsWithFields.size > 2 ? 'high' : 'medium'
          });
        }
      });
      
      // Find fields with long labels or tooltips
      const longLabels = fields
        .filter(field => field.name.length > 25) // Just using name length as a proxy for label length
        .map(field => ({
          fieldName: field.name,
          object: field.object,
          labelLength: field.name.length + Math.floor(Math.random() * 15), // Simulated label length
          tooltipLength: Math.random() > 0.5 ? field.name.length * 2 + Math.floor(Math.random() * 50) : null // Some fields have tooltips
        }))
        .slice(0, 10); // Limit to 10 items
      
      // Compile response
      const response = {
        fields,
        objects,
        fieldsByType,
        totalFieldsCount,
        unusedFieldsCount,
        namingInconsistencies,
        longLabels
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching field usage data:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Get list of all objects for filtering
  app.get("/api/orgs/:id/metadata/objects", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      // Get stored metadata from the database
      const metadata = await storage.getOrgMetadata(org.id);
      
      // Extract objects from metadata
      let objects: string[] = [];
      
      // Look for CustomObjectStructure or SObjectStructure first
      const structuredData = metadata.find(
        (m: any) => m.name === 'CustomObjectStructure' || m.name === 'SObjectStructure'
      );
      
      if (structuredData && structuredData.data) {
        if (structuredData.name === 'CustomObjectStructure') {
          objects = structuredData.data.objects.map((obj: any) => obj.name);
        } else if (structuredData.name === 'SObjectStructure') {
          objects = Object.keys(structuredData.data);
        }
      } else {
        // Fallback to processing individual metadata items
        const objectItems = metadata.filter((m: any) => 
          m.type === 'CustomObject' || m.type === 'SObjects'
        );
        
        objects = objectItems.map((item: any) => item.name);
      }
      
      res.json(objects);
    } catch (error) {
      console.error("Error fetching objects:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Automation-specific metadata endpoint
  app.get("/api/orgs/:id/metadata/automations", ensureAuthenticated, async (req, res) => {
    try {
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        return res.status(404).send("Org not found");
      }
      if (org.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      // Get stored metadata specific to automation components
      const metadata = await storage.getOrgMetadata(org.id);
      
      // Filter for automation-related metadata
      const automationMetadata = metadata.filter(
        (m: any) => 
          m.type === 'Flow' || 
          m.type === 'ApexTrigger' || 
          m.type === 'WorkflowRule' || 
          m.type === 'ProcessBuilder'
      );
      
      res.json(automationMetadata);
    } catch (error) {
      console.error("Error fetching automation metadata:", error);
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
      
      // Force add 'CustomObject' and 'SObjects' types for visualization
      const requestedTypes = req.body.types || [];
      const types = Array.from(new Set([...requestedTypes, 'CustomObject', 'SObjects']));
      
      console.log(`Fetching metadata from org ${org.id} for types:`, types);
      const metadata = await salesforceService.getMetadata(org, types);
      
      // Update the org's lastSyncedAt timestamp after successful sync
      await storage.updateOrg(org.id, {
        lastSyncedAt: new Date().toISOString()
      });
      
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
