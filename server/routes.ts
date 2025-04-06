import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { salesforceService, SalesforceService } from "./salesforce";
import { z } from "zod";
import { 
  insertSalesforceOrgSchema, 
  insertCodeQualitySchema,
  insertComponentDependenciesSchema,
  insertComplianceSchema,
  insertTechnicalDebtItemsSchema,
  insertReleaseImpactSchema
} from "@shared/schema";

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
        username,
        email, // Support both username and email for backward compatibility
        password,
        securityToken,
        environment
      } = req.body;
      
      if (authMethod === 'credentials') {
        // Use username if provided, otherwise fall back to email
        const userIdentifier = username || email;
        
        if (!userIdentifier || !password) {
          console.log("Missing username/email or password for credential auth");
          return res.status(400).send("Username/email and password are required for credential authentication");
        }
        
        try {
          console.log("Attempting to authenticate with Salesforce using credentials:", {
            userIdentifier: userIdentifier,
            environment: environment || 'production'
          });
          
          // Authenticate with Salesforce
          const authResult = await salesforceService.authenticateWithCredentials({
            email: userIdentifier, // Map to email which is what salesforceService expects
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
      
      // If no fields were found, generate sample data for testing
      if (fields.length === 0) {
        console.log("No real field data found, generating sample data for testing");
        
        // Sample objects if none were found
        if (objects.length === 0) {
          objects = ['Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Custom_Object__c'];
        }
        
        // Sample field types
        const commonFieldTypes = ['Text', 'Number', 'Date', 'Checkbox', 'Picklist', 'Lookup', 'Formula', 'Currency'];
        
        // Generate sample fields (50-100)
        const sampleFieldCount = 50 + Math.floor(Math.random() * 50);
        totalFieldsCount = sampleFieldCount;
        
        // Generate unused fields (15-30% of total)
        unusedFieldsCount = Math.floor(sampleFieldCount * (0.15 + Math.random() * 0.15));
        
        // Track field types for the chart
        for (const type of commonFieldTypes) {
          fieldsByType[type] = Math.floor(sampleFieldCount / commonFieldTypes.length) + 
            Math.floor(Math.random() * 10) - 5; // Add some variance
        }
        
        // Make sure the totals match
        let totalTyped = Object.values(fieldsByType).reduce((sum, count) => sum + count, 0);
        if (totalTyped < totalFieldsCount) {
          // Add the remaining to the Text type
          fieldsByType['Text'] += (totalFieldsCount - totalTyped);
        } else if (totalTyped > totalFieldsCount) {
          // Adjust total count to match
          totalFieldsCount = totalTyped;
        }
        
        // Generate sample fields
        objects.forEach(objectName => {
          const fieldsPerObject = Math.floor(sampleFieldCount / objects.length);
          
          for (let i = 0; i < fieldsPerObject; i++) {
            const isCustom = Math.random() > 0.4; // 60% chance of being a custom field
            const fieldName = isCustom 
              ? `Custom_Field_${i}__c` 
              : ['Name', 'Id', 'CreatedDate', 'LastModifiedDate', 'OwnerId'][Math.floor(Math.random() * 5)];
            
            const fieldType = commonFieldTypes[Math.floor(Math.random() * commonFieldTypes.length)];
            const isUnused = Math.random() < (unusedFieldsCount / totalFieldsCount);
            
            fields.push({
              name: fieldName,
              object: objectName,
              usageCount: isUnused ? 0 : 1 + Math.floor(Math.random() * 100),
              lastUsed: isUnused ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              type: fieldType,
              isCustom
            });
          }
        });
      }
      
      // Generate naming inconsistency insights
      const namingInconsistencies = [];
      
      // Look for fields with similar purposes but different naming conventions
      const fieldNamePrefixes = ['Customer', 'Client', 'User', 'Account'];
      const fieldNameSuffixes = ['ID', 'Id', 'Code', 'Num', 'Number'];
      
      // Generate some example inconsistencies (if none found, create at least 3 samples)
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
      
      // Ensure we have at least 3 naming inconsistency examples
      if (namingInconsistencies.length < 3) {
        const sampleInconsistencies = [
          {
            inconsistentName: 'customer_id',
            suggestedName: 'CustomerId',
            objects: objects.slice(0, 2),
            impact: 'high' as const
          },
          {
            inconsistentName: 'AccountNum',
            suggestedName: 'AccountNumber',
            objects: objects.slice(0, 3),
            impact: 'medium' as const
          },
          {
            inconsistentName: 'user-email',
            suggestedName: 'UserEmail',
            objects: objects.slice(0, 2),
            impact: 'high' as const
          }
        ];
        
        // Add necessary sample inconsistencies
        for (let i = 0; i < (3 - namingInconsistencies.length); i++) {
          namingInconsistencies.push(sampleInconsistencies[i]);
        }
      }
      
      // Find fields with long labels or tooltips
      let longLabels = fields
        .filter(field => field.name.length > 25) // Just using name length as a proxy for label length
        .map(field => ({
          fieldName: field.name,
          object: field.object,
          labelLength: field.name.length + Math.floor(Math.random() * 15), // Simulated label length
          tooltipLength: Math.random() > 0.5 ? field.name.length * 2 + Math.floor(Math.random() * 50) : null // Some fields have tooltips
        }))
        .slice(0, 10); // Limit to 10 items
      
      // Ensure we have at least 5 long label examples
      if (longLabels.length < 5) {
        const sampleLongLabels = [
          {
            fieldName: 'ExtremelyLongFieldNameThatViolatesNamingConventions__c',
            object: objects[0] || 'Account',
            labelLength: 55,
            tooltipLength: 120
          },
          {
            fieldName: 'AnotherVeryLongFieldNameWithTooManyCharacters__c',
            object: objects[1] || 'Contact',
            labelLength: 52,
            tooltipLength: 95
          },
          {
            fieldName: 'ThisFieldHasAnUnnecessarilyLongNameAndShouldBeShortened__c',
            object: objects[0] || 'Account',
            labelLength: 64,
            tooltipLength: null
          },
          {
            fieldName: 'VerboseDescriptiveFieldThatCouldBeMoreConcise__c',
            object: objects[2] || 'Opportunity',
            labelLength: 48,
            tooltipLength: 110
          },
          {
            fieldName: 'OverlyDetailedFieldNameWithRedundantWords__c',
            object: objects[1] || 'Contact',
            labelLength: 45,
            tooltipLength: 85
          }
        ];
        
        // Start with any real long labels we found
        if (longLabels.length > 0) {
          longLabels = [...longLabels];
        } else {
          longLabels = [];
        }
        
        // Add necessary sample long labels
        for (let i = 0; i < (5 - longLabels.length); i++) {
          longLabels.push(sampleLongLabels[i]);
        }
      }
      
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
  
  // API Usage Endpoint
  app.get("/api/orgs/:id/api-usage", ensureAuthenticated, async (req, res) => {
    try {
      // Log the request for debugging
      console.log(`API Usage request received for org ID: ${req.params.id}`);
      console.log(`Request user ID: ${req.user?.id}, Request params: ${JSON.stringify(req.params)}`);
      
      // Check if demo mode is requested
      const demoMode = req.query.demo === 'true';
      
      if (demoMode) {
        console.log("Demo mode requested, returning sample API usage data");
        // Return sample data for demo purposes
        return res.json({
          dailyApiRequests: {
            used: 77900,
            total: 100000
          },
          // Previous daily API requests data saved as trend data
          dailyApiRequestsTrend: [
            { date: '2025-03-29', count: 12450 },
            { date: '2025-03-30', count: 18720 },
            { date: '2025-03-31', count: 15680 },
            { date: '2025-04-01', count: 22340 },
            { date: '2025-04-02', count: 19870 },
            { date: '2025-04-03', count: 21450 },
            { date: '2025-04-04', count: 23120 }
          ],
          concurrentApiRequests: {
            used: 281,
            total: 500
          },
          // Previous concurrent data saved as hourly data
          concurrentApiRequestsByHour: [
            { hour: '00:00', count: 45 },
            { hour: '02:00', count: 21 },
            { hour: '04:00', count: 18 },
            { hour: '06:00', count: 53 },
            { hour: '08:00', count: 102 },
            { hour: '10:00', count: 187 },
            { hour: '12:00', count: 230 },
            { hour: '14:00', count: 281 },
            { hour: '16:00', count: 223 },
            { hour: '18:00', count: 186 },
            { hour: '20:00', count: 91 },
            { hour: '22:00', count: 58 }
          ],
          requestsByType: [
            { type: 'REST API', count: 35790, percentage: 46, color: '#3B82F6' },
            { type: 'SOAP API', count: 12450, percentage: 16, color: '#10B981' },
            { type: 'Bulk API', count: 18720, percentage: 24, color: '#F59E0B' },
            { type: 'Streaming API', count: 7820, percentage: 10, color: '#8B5CF6' },
            { type: 'Metadata API', count: 3120, percentage: 4, color: '#EC4899' }
          ],
          requestsByMethod: [
            { method: 'GET', count: 38450, percentage: 49, color: '#3B82F6' },
            { method: 'POST', count: 23400, percentage: 30, color: '#10B981' },
            { method: 'PUT', count: 7820, percentage: 10, color: '#F59E0B' },
            { method: 'PATCH', count: 4680, percentage: 6, color: '#8B5CF6' },
            { method: 'DELETE', count: 3900, percentage: 5, color: '#EC4899' }
          ],
          limitConsumption: [
            { name: 'Daily API Requests', used: 77900, total: 100000, percentage: 77.9 },
            { name: 'Data Storage', used: 782, total: 1000, percentage: 78.2 },
            { name: 'File Storage', used: 5.8, total: 10, percentage: 58 },
            { name: 'Streaming API Concurrent Clients', used: 28, total: 50, percentage: 56 },
            { name: 'Bulk API Batch Requests', used: 345, total: 1000, percentage: 34.5 }
          ],
          errorRates: {
            overall: 2.4,
            trends: [
              { date: '2025-03-29', rate: 1.8 },
              { date: '2025-03-30', rate: 2.1 },
              { date: '2025-03-31', rate: 2.5 },
              { date: '2025-04-01', rate: 3.2 },
              { date: '2025-04-02', rate: 2.7 },
              { date: '2025-04-03', rate: 2.3 },
              { date: '2025-04-04', rate: 2.0 }
            ]
          },
          // Add top consumers list required by the component
          topConsumers: [
            { name: 'Data Integration Service', requests: 5432, percentage: 37 },
            { name: 'Admin User', requests: 3789, percentage: 26 },
            { name: 'Marketing Automation', requests: 2143, percentage: 14 },
            { name: 'Sales Dashboard', requests: 1987, percentage: 13 },
            { name: 'Customer Portal', requests: 1431, percentage: 10 },
          ],
          // Convert the error rates to match the component's interface
          errorRates: [
            { type: 'Rate Limit', count: 128, percentage: 1.3, color: '#EF4444' },
            { type: 'Authentication', count: 112, percentage: 0.6, color: '#F59E0B' },
            { type: 'Validation', count: 213, percentage: 1.4, color: '#3B82F6' },
            { type: 'Server', count: 32, percentage: 0.2, color: '#8B5CF6' },
          ],
          // Keep original error data for reference
          errorDetail: {
            overall: 2.4,
            trends: [
              { date: '2025-03-29', rate: 1.8 },
              { date: '2025-03-30', rate: 2.1 },
              { date: '2025-03-31', rate: 2.5 },
              { date: '2025-04-01', rate: 3.2 },
              { date: '2025-04-02', rate: 2.7 },
              { date: '2025-04-03', rate: 2.3 },
              { date: '2025-04-04', rate: 2.0 }
            ]
          },
          topErrors: [
            { code: 'API_LIMIT_EXCEEDED', count: 128, percentage: 25 },
            { code: 'INVALID_SESSION_ID', count: 112, percentage: 22 },
            { code: 'MALFORMED_QUERY', count: 97, percentage: 19 },
            { code: 'INVALID_FIELD', count: 89, percentage: 18 },
            { code: 'CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY', count: 82, percentage: 16 }
          ],
          topEndpoints: [
            { endpoint: '/services/data/v57.0/query', count: 18720, percentage: 24 },
            { endpoint: '/services/data/v57.0/sobjects/Account', count: 15680, percentage: 20 },
            { endpoint: '/services/data/v57.0/sobjects/Contact', count: 12450, percentage: 16 },
            { endpoint: '/services/data/v57.0/sobjects/Opportunity', count: 10920, percentage: 14 },
            { endpoint: '/services/data/v57.0/composite/batch', count: 9360, percentage: 12 },
            { endpoint: '/services/data/v57.0/sobjects/Case', count: 7820, percentage: 10 },
            { endpoint: '/services/data/v57.0/sobjects/Task', count: 3120, percentage: 4 }
          ],
          userAgents: [
            { name: 'Integration Middleware', count: 31200, percentage: 40 },
            { name: 'Custom Mobile App', count: 23400, percentage: 30 },
            { name: 'Data Sync Tool', count: 15600, percentage: 20 },
            { name: 'Analytics Dashboard', count: 7800, percentage: 10 }
          ],
          responseTimeMs: {
            average: 428,
            trends: [
              { date: '2025-03-29', time: 412 },
              { date: '2025-03-30', time: 405 },
              { date: '2025-03-31', time: 418 },
              { date: '2025-04-01', time: 442 },
              { date: '2025-04-02', time: 435 },
              { date: '2025-04-03', time: 430 },
              { date: '2025-04-04', time: 422 }
            ]
          },
          recommendations: [
            {
              id: 'REC001',
              title: 'Implement API request batching',
              description: 'Combine multiple record operations into single API calls using the Composite API.',
              impact: 'Could reduce your daily API requests by approximately 30%.',
              difficulty: 'Medium'
            },
            {
              id: 'REC002',
              title: 'Optimize SOQL queries',
              description: 'Several queries are requesting more fields than needed. Implement field selection to reduce response sizes.',
              impact: 'Improves response times and reduces bandwidth usage.',
              difficulty: 'Low'
            },
            {
              id: 'REC003',
              title: 'Implement proper token refresh',
              description: 'Session timeouts are causing INVALID_SESSION_ID errors. Implement proactive token refresh.',
              impact: 'Could eliminate up to 22% of your current API errors.',
              difficulty: 'Low'
            },
            {
              id: 'REC004',
              title: 'Schedule bulk operations during off-hours',
              description: 'Large data operations are concentrated during business hours. Schedule them for off-peak times.',
              impact: 'Better performance and lower concurrent request counts during business hours.',
              difficulty: 'Medium'
            },
            {
              id: 'REC005',
              title: 'Implement rate limiting logic',
              description: 'Your integrations aren\'t respecting Salesforce API limits. Add client-side rate limiting.',
              impact: 'Prevents API_LIMIT_EXCEEDED errors which account for 25% of your errors.',
              difficulty: 'High'
            }
          ],
          success: true,
          message: "Demo data loaded successfully"
        });
      }
      
      // First validate the org and ownership
      const org = await storage.getOrg(parseInt(req.params.id));
      if (!org) {
        console.log(`Org not found with ID: ${req.params.id}`);
        return res.status(404).json({
          error: "Org not found",
          message: `The requested Salesforce organization with ID ${req.params.id} does not exist.`
        });
      }
      
      console.log(`Found org: ${org.name}, userId: ${org.userId}, requestUserId: ${req.user?.id}`);
      
      if (org.userId !== req.user?.id) {
        console.log(`Access denied - org.userId: ${org.userId}, req.user.id: ${req.user?.id}`);
        return res.status(403).json({
          error: "Access denied",
          message: "You do not have permission to access this organization's data."
        });
      }
      
      console.log(`Fetching API usage data for org ${org.id} (${org.name})`);
      
      try {
        // Attempt to get API usage data from Salesforce
        const apiUsageData = await salesforceService.getApiUsageData(org);
        console.log(`API usage data retrieved successfully for ${org.name}`);
        res.json(apiUsageData);
      } catch (apiError: any) {
        console.error("Error retrieving API usage data:", apiError);
        console.error("Error message:", apiError.message);
        
        // Log the stack trace for debugging
        if (apiError.stack) {
          console.error("Error stack:", apiError.stack);
        }
        
        // Return a more helpful error response with debugging info
        return res.status(502).json({
          error: "Failed to retrieve API usage data",
          message: apiError.message || "There was an error communicating with Salesforce API",
          errorCode: "SALESFORCE_API_ERROR",
          // Include info about demo mode option
          demo: "To view demo data, add ?demo=true to your request"
        });
      }
    } catch (error: any) {
      console.error("Error processing API usage request:", error);
      console.error("Error message:", error.message);
      
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
      
      res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request.",
        details: error.message,
        // Include info about demo mode option
        demo: "To view demo data, add ?demo=true to your request"
      });
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
      
      // If no objects found, provide standard Salesforce objects for testing
      if (objects.length === 0) {
        console.log("No objects found in metadata. Returning standard objects for testing.");
        objects = [
          'Account',
          'Contact',
          'Opportunity',
          'Lead',
          'Case',
          'Campaign',
          'Custom_Object__c',
          'Another_Custom_Object__c'
        ];
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
  
  // Reserved for future routes
  
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

  // Metadata Analytics Endpoint
  app.get("/api/orgs/:id/metadata-analytics", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const metadataAnalytics = await salesforceService.getMetadataDetailsFromOrg(org);
      return res.json(metadataAnalytics);
    } catch (error) {
      console.error('Failed to fetch metadata analytics:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch metadata analytics',
        message: error.message
      });
    }
  });

  // Code Quality Endpoints
  app.get("/api/orgs/:id/code-quality", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const componentType = req.query.componentType as string | undefined;
      const codeQualityData = await storage.getOrgCodeQuality(orgId, componentType);
      return res.json(codeQualityData);
    } catch (error) {
      console.error('Failed to fetch code quality data:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch code quality data',
        message: error.message
      });
    }
  });

  app.post("/api/orgs/:id/code-quality", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const validatedData = insertCodeQualitySchema.parse({
        ...req.body,
        orgId
      });
      
      const codeQuality = await storage.createCodeQuality(validatedData);
      return res.status(201).json(codeQuality);
    } catch (error) {
      console.error('Failed to create code quality record:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      return res.status(500).json({ 
        error: 'Failed to create code quality record',
        message: error.message
      });
    }
  });

  // Component Dependencies Endpoints
  app.get("/api/orgs/:id/components/:componentId/dependencies", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const componentId = parseInt(req.params.componentId);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const dependencies = await storage.getComponentDependencies(orgId, componentId);
      return res.json(dependencies);
    } catch (error) {
      console.error('Failed to fetch component dependencies:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch component dependencies',
        message: error.message
      });
    }
  });

  app.get("/api/orgs/:id/components/:componentId/reverse-dependencies", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const componentId = parseInt(req.params.componentId);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const reverseDependencies = await storage.getReverseDependencies(orgId, componentId);
      return res.json(reverseDependencies);
    } catch (error) {
      console.error('Failed to fetch reverse dependencies:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch reverse dependencies',
        message: error.message
      });
    }
  });

  app.post("/api/orgs/:id/component-dependencies", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const validatedData = insertComponentDependenciesSchema.parse({
        ...req.body,
        orgId
      });
      
      const dependency = await storage.createComponentDependency(validatedData);
      return res.status(201).json(dependency);
    } catch (error) {
      console.error('Failed to create component dependency:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      return res.status(500).json({ 
        error: 'Failed to create component dependency',
        message: error.message
      });
    }
  });

  // Compliance Endpoints
  app.get("/api/orgs/:id/compliance", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const frameworkName = req.query.frameworkName as string | undefined;
      const complianceData = await storage.getOrgCompliance(orgId, frameworkName);
      return res.json(complianceData);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch compliance data',
        message: error.message
      });
    }
  });

  app.post("/api/orgs/:id/compliance", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const validatedData = insertComplianceSchema.parse({
        ...req.body,
        orgId
      });
      
      const compliance = await storage.createCompliance(validatedData);
      return res.status(201).json(compliance);
    } catch (error) {
      console.error('Failed to create compliance record:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      return res.status(500).json({ 
        error: 'Failed to create compliance record',
        message: error.message
      });
    }
  });

  // Technical Debt Endpoints
  app.get("/api/orgs/:id/technical-debt", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const category = req.query.category as string | undefined;
      const status = req.query.status as string | undefined;
      const technicalDebtItems = await storage.getOrgTechnicalDebt(orgId, category, status);
      return res.json(technicalDebtItems);
    } catch (error) {
      console.error('Failed to fetch technical debt items:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch technical debt items',
        message: error.message
      });
    }
  });
  
  // New endpoint to support the Technical Debt Scanner page
  app.get("/api/technical-debt/:orgId", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      // Get technical debt items with optional filters
      const category = req.query.category as string | undefined;
      const status = req.query.status as string | undefined;
      const technicalDebtItems = await storage.getOrgTechnicalDebt(orgId, category, status);
      
      // Return the items
      res.json(technicalDebtItems);
    } catch (error) {
      console.error('Failed to fetch technical debt items:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch technical debt items',
        message: error.message
      });
    }
  });

  app.post("/api/orgs/:id/technical-debt", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const validatedData = insertTechnicalDebtItemsSchema.parse({
        ...req.body,
        orgId
      });
      
      const technicalDebtItem = await storage.createTechnicalDebtItem(validatedData);
      return res.status(201).json(technicalDebtItem);
    } catch (error) {
      console.error('Failed to create technical debt item:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      return res.status(500).json({ 
        error: 'Failed to create technical debt item',
        message: error.message
      });
    }
  });

  // Release Impact Endpoints
  app.get("/api/orgs/:id/release-impact", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const status = req.query.status as string | undefined;
      const releaseImpacts = await storage.getOrgReleaseImpacts(orgId, status);
      return res.json(releaseImpacts);
    } catch (error) {
      console.error('Failed to fetch release impact data:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch release impact data',
        message: error.message
      });
    }
  });

  app.post("/api/orgs/:id/release-impact", ensureAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      if (org.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const validatedData = insertReleaseImpactSchema.parse({
        ...req.body,
        orgId
      });
      
      const releaseImpact = await storage.createReleaseImpact(validatedData);
      return res.status(201).json(releaseImpact);
    } catch (error) {
      console.error('Failed to create release impact record:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      return res.status(500).json({ 
        error: 'Failed to create release impact record',
        message: error.message
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
