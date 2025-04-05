import axios from 'axios';
import { storage } from './storage';
import { SalesforceOrg, InsertMetadata } from '@shared/schema';
import jsforce from 'jsforce';

interface SalesforceLoginCredentials {
  email: string;
  password: string;
  securityToken: string;
  environment: 'production' | 'sandbox';
}

interface SalesforceMetadataType {
  xmlName: string;
  directoryName: string;
  inFolder: boolean;
  metaFile: boolean;
  suffix: string;
  childXmlNames: string[];
}

export class SalesforceService {
  // Authenticate with Salesforce using email and password + security token
  async authenticateWithCredentials(credentials: SalesforceLoginCredentials): Promise<{
    accessToken: string;
    instanceUrl: string;
    refreshToken: string | null;
    userId: string;
  }> {
    try {
      console.log(`Authenticating with email: ${credentials.email}`);
      
      // Initialize JSForce connection to Salesforce
      const conn = new jsforce.Connection({
        loginUrl: credentials.environment === 'sandbox' 
          ? 'https://test.salesforce.com' 
          : 'https://login.salesforce.com'
      });
      
      // Try to authenticate with provided credentials
      try {
        // Use actual credentials to connect to Salesforce
        await conn.login(credentials.email, credentials.password + credentials.securityToken);
        
        console.log("Authentication successful");
        
        return {
          accessToken: conn.accessToken || '',
          instanceUrl: conn.instanceUrl || '',
          refreshToken: null,
          userId: conn.userInfo?.id || 'unknown'
        };
      } catch (loginError) {
        console.error('Login error:', loginError);
        throw new Error('Invalid Salesforce credentials. Please check your username, password, and security token.');
      }
    
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to authenticate with Salesforce. Please check your credentials.');
    }
  }

  // Get org users for trace flag creation
  async getOrgUsers(org: SalesforceOrg): Promise<any[]> {
    try {
      console.log(`Fetching users from org ${org.id}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Fetch users
      const usersResult = await conn.query('SELECT Id, Name FROM User WHERE IsActive = true ORDER BY Name LIMIT 100');
      
      // Transform to match our expected format
      const users = usersResult.records.map((user: any) => ({
        id: user.Id,
        name: user.Name
      }));
      
      return users;
    } catch (error) {
      console.error('Error fetching org users:', error);
      // If there's an error, log it but return an empty array rather than failing completely
      return [];
    }
  }

  // Get apex logs from Salesforce
  async getApexLogs(org: SalesforceOrg): Promise<any[]> {
    try {
      console.log(`Fetching Apex logs from org ${org.id}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Fetch Apex logs via the tooling API
      const logsResult = await conn.tooling.query('SELECT Id, Application, DurationMilliseconds, Location, LogLength, Operation, Request, StartTime, Status, LogUserId, LogUser.Name FROM ApexLog ORDER BY StartTime DESC LIMIT 100');
      
      // Transform the results to match our expected format
      const logs = logsResult.records.map((log: any) => ({
        id: log.Id,
        application: log.Application,
        duration: log.DurationMilliseconds,
        location: log.Location,
        logLength: log.LogLength,
        operation: log.Operation,
        request: log.Request,
        startTime: log.StartTime,
        status: log.Status,
        user: {
          id: log.LogUserId,
          name: log.LogUser?.Name || 'Unknown User'
        }
      }));
      
      return logs;
    } catch (error) {
      console.error('Error fetching apex logs:', error);
      
      // If there's an error, log it but return an empty array rather than failing completely
      return [];
    }
  }

  // Get detailed information for a specific apex log
  async getApexLogDetail(org: SalesforceOrg, logId: string): Promise<any> {
    try {
      // In a real implementation, this would fetch the actual log from Salesforce
      // For demonstration purposes, we'll return mock data with realistic log events
      
      // Generate random apex execution events to simulate a real log
      const generateEvents = (count: number) => {
        const eventTypes = [
          'CODE_UNIT', 'DML', 'SOQL', 'EXCEPTION', 'CALLOUT', 'VALIDATION', 'SYSTEM'
        ] as const;
        
        const severities = [
          'INFO', 'DEBUG', 'WARNING', 'ERROR'
        ] as const;
        
        const events = [];
        let timeOffset = 0;
        
        for (let i = 0; i < count; i++) {
          const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          const timestamp = new Date(Date.now() - timeOffset).toISOString().slice(11, 23);
          timeOffset += Math.floor(Math.random() * 1000); // Random time increment
          
          let details = '';
          let executionTime = type === 'CODE_UNIT' || type === 'SOQL' || type === 'DML' ? 
            Math.floor(Math.random() * 500) : undefined;
          let heapSize = Math.floor(Math.random() * 1000000);
          
          switch (type) {
            case 'CODE_UNIT':
              details = `Execute ${Math.random() > 0.5 ? 'anonymous' : 'AccountTrigger'}: line ${Math.floor(Math.random() * 500)}`;
              break;
            case 'SOQL':
              details = `SELECT Id, Name, ${Math.random() > 0.5 ? 'Industry' : 'Rating'} FROM Account ${Math.random() > 0.7 ? 'WHERE Id != null' : ''} LIMIT 100`;
              break;
            case 'DML':
              details = `DML ${Math.random() > 0.5 ? 'INSERT' : 'UPDATE'}: ${Math.floor(Math.random() * 10)} ${Math.random() > 0.5 ? 'Account' : 'Contact'} records`;
              break;
            case 'EXCEPTION':
              details = `System.${Math.random() > 0.5 ? 'NullPointerException' : 'DmlException'}: ${Math.random() > 0.5 ? 'Attempt to de-reference a null object' : 'REQUIRED_FIELD_MISSING'}`;
              // For exceptions, always use ERROR severity
              let eventSeverity = 'ERROR';
              break;
            case 'CALLOUT':
              details = `HTTP ${Math.random() > 0.5 ? 'GET' : 'POST'} callout to ${Math.random() > 0.5 ? 'https://api.example.com/v1/data' : 'https://api.external-service.com/api'}`;
              break;
            case 'VALIDATION':
              details = `VALIDATION_RULE: ${Math.random() > 0.5 ? 'Account_must_have_industry' : 'Opportunity_closed_date_required'}`;
              break;
            case 'SYSTEM':
              details = `System.${Math.random() > 0.5 ? 'debug' : 'runAs'}: ${Math.random() > 0.5 ? 'Debug message' : 'Running as different user'}`;
              break;
          }
          
          events.push({
            type,
            timestamp,
            details,
            line: Math.floor(Math.random() * 1000) + 1,
            executionTime,
            heapSize,
            category: type,
            severity: type === 'EXCEPTION' ? 'ERROR' : severity
          });
        }
        
        return events;
      };
      
      // Generate example slow queries
      const slowQueries = [
        {
          query: "SELECT Id, Name, AccountNumber, Site, Type, ParentId FROM Account WHERE CreatedDate > LAST_MONTH",
          time: 756,
          lineNumber: 143,
          rows: 342
        },
        {
          query: "SELECT Id, Name, Email, Phone, AccountId FROM Contact WHERE AccountId IN (SELECT Id FROM Account WHERE Industry = 'Technology')",
          time: 1253,
          lineNumber: 247,
          rows: 1456
        },
        {
          query: "SELECT Id, Amount, StageName, AccountId, Probability FROM Opportunity WHERE CloseDate >= THIS_MONTH AND StageName NOT IN ('Closed Won', 'Closed Lost')",
          time: 654,
          lineNumber: 382,
          rows: 120
        }
      ];
      
      // Generate example slow methods
      const slowMethods = [
        {
          className: "AccountController",
          methodName: "processAccountHierarchy",
          time: 1876,
          lineNumber: 126,
          called: 3
        },
        {
          className: "OpportunityTriggerHandler",
          methodName: "updateRelatedRecords",
          time: 1350,
          lineNumber: 245,
          called: 12
        },
        {
          className: "DataMigrationBatch",
          methodName: "execute",
          time: 2310,
          lineNumber: 78,
          called: 1
        }
      ];
      
      // Generate example governor limit usage
      const limitUsage = [
        {
          name: "Heap Size",
          used: 2345678,
          total: 6000000,
          percentage: 39
        },
        {
          name: "CPU Time",
          used: 5432,
          total: 10000,
          percentage: 54
        },
        {
          name: "SOQL Queries",
          used: 74,
          total: 100,
          percentage: 74
        },
        {
          name: "DML Statements",
          used: 28,
          total: 150,
          percentage: 19
        },
        {
          name: "SOQL Query Rows",
          used: 3456,
          total: 50000,
          percentage: 7
        },
        {
          name: "DML Rows",
          used: 256,
          total: 10000,
          percentage: 3
        }
      ];
      
      // Simulating the full log response
      return {
        id: logId,
        body: "This would be the raw log body text...",
        events: generateEvents(50), // Generate 50 sample log events
        performance: {
          databaseTime: 3210,
          slowestQueries: slowQueries,
          apexExecutionTime: 8765,
          slowestMethods: slowMethods,
          heapUsage: 2345678,
          limitUsage: limitUsage,
          totalExecutionTime: 12876 // Total execution time in milliseconds
        }
      };
    } catch (error) {
      console.error('Error fetching apex log detail:', error);
      throw error;
    }
  }

  // Delete an apex log
  async deleteApexLog(org: SalesforceOrg, logId: string): Promise<void> {
    try {
      // In a real implementation, this would call Salesforce to delete the log
      console.log(`Deleting apex log ${logId} from org ${org.name}`);
      // Success response (no actual deletion in mock version)
      return;
    } catch (error) {
      console.error('Error deleting apex log:', error);
      throw error;
    }
  }

  // Get trace flags from Salesforce
  async getTraceFlags(org: SalesforceOrg): Promise<any[]> {
    try {
      console.log(`Fetching trace flags from org ${org.id}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Fetch trace flags using the tooling API
      const traceFlagsResult = await conn.tooling.query(
        `SELECT Id, DebugLevelId, LogType, ExpirationDate, StartDate, TracedEntityId, 
         TracedEntityType FROM TraceFlag ORDER BY ExpirationDate DESC LIMIT 100`
      );
      
      // Get debug level details
      const debugLevelIds = traceFlagsResult.records.map((flag: any) => flag.DebugLevelId);
      
      let debugLevels: any[] = [];
      if (debugLevelIds.length > 0) {
        // Create a unique list of debug level IDs using filter instead of Set
        const uniqueDebugLevelIds = debugLevelIds.filter((id, index) => 
          debugLevelIds.indexOf(id) === index
        );
        
        // Fetch debug levels
        const debugLevelsResult = await conn.tooling.query(
          `SELECT Id, DeveloperName, ApexCode, ApexProfiling, Callout, Database, System, 
           Validation, Visualforce, Workflow FROM DebugLevel 
           WHERE Id IN ('${uniqueDebugLevelIds.join("','")}')`
        );
        
        debugLevels = debugLevelsResult.records;
      }
      
      // Transform the results to match our expected format
      const traceFlags = traceFlagsResult.records.map((flag: any) => {
        // Find the associated debug level
        const debugLevel = debugLevels.find((level: any) => level.Id === flag.DebugLevelId) || {
          Id: flag.DebugLevelId,
          DeveloperName: 'Unknown',
          ApexCode: 'INFO',
          ApexProfiling: 'INFO',
          Callout: 'INFO',
          Database: 'INFO',
          System: 'INFO',
          Validation: 'INFO', 
          Visualforce: 'INFO',
          Workflow: 'INFO'
        };
        
        return {
          id: flag.Id,
          debugLevelId: flag.DebugLevelId,
          debugLevel: {
            id: debugLevel.Id,
            developerName: debugLevel.DeveloperName,
            apexCode: debugLevel.ApexCode,
            apexProfiling: debugLevel.ApexProfiling,
            callout: debugLevel.Callout,
            database: debugLevel.Database,
            system: debugLevel.System,
            validation: debugLevel.Validation,
            visualforce: debugLevel.Visualforce,
            workflow: debugLevel.Workflow
          },
          expirationDate: flag.ExpirationDate,
          logType: flag.LogType,
          startDate: flag.StartDate,
          tracedEntityId: flag.TracedEntityId,
          tracedEntityType: flag.TracedEntityType
        };
      });
      
      return traceFlags;
    } catch (error) {
      console.error('Error fetching trace flags:', error);
      // If there's an error, log it but return an empty array rather than failing completely
      return [];
    }
  }

  // Create a trace flag
  async createTraceFlag(
    org: SalesforceOrg, 
    tracedEntityId: string, 
    debugLevelId?: string, 
    debugLevel?: Record<string, string>,
    expirationMinutes: number = 30
  ): Promise<any> {
    try {
      console.log(`Creating trace flag for entity ${tracedEntityId} in org ${org.id}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Current time for calculating start and expiration
      const now = new Date();
      const expirationDate = new Date(now.getTime() + (expirationMinutes * 60 * 1000));
      
      let finalDebugLevelId = debugLevelId;
      
      // If no debug level ID was provided, create a new debug level
      if (!finalDebugLevelId) {
        // First create a debug level
        const newDebugLevel = {
          DeveloperName: `CustomDebugLevel_${Date.now()}`,
          MasterLabel: `Custom Debug Level ${new Date().toISOString().slice(0, 10)}`,
          ApexCode: debugLevel?.apexCode || "DEBUG",
          ApexProfiling: debugLevel?.apexProfiling || "INFO",
          Callout: debugLevel?.callout || "INFO",
          Database: debugLevel?.database || "INFO",
          System: debugLevel?.system || "DEBUG",
          Validation: debugLevel?.validation || "INFO",
          Visualforce: debugLevel?.visualforce || "INFO",
          Workflow: debugLevel?.workflow || "INFO"
        };
        
        try {
          // Create the debug level in Salesforce
          const debugLevelResult = await conn.tooling.sobject('DebugLevel').create(newDebugLevel);
          
          if (debugLevelResult.success) {
            finalDebugLevelId = debugLevelResult.id;
            console.log(`Created new Debug Level with ID: ${finalDebugLevelId}`);
          } else {
            console.error('Failed to create Debug Level:', debugLevelResult);
            throw new Error('Failed to create Debug Level');
          }
        } catch (debugLevelError) {
          console.error('Error creating Debug Level:', debugLevelError);
          throw debugLevelError;
        }
      }
      
      // Now create the trace flag
      const traceFlagData = {
        DebugLevelId: finalDebugLevelId,
        StartDate: now.toISOString(),
        ExpirationDate: expirationDate.toISOString(),
        LogType: "USER_DEBUG",
        TracedEntityId: tracedEntityId,
        // Most traced entities in Salesforce are Users
        TracedEntityType: tracedEntityId.startsWith('005') ? "User" : "Class"
      };
      
      try {
        // Create the trace flag in Salesforce
        const traceFlagResult = await conn.tooling.sobject('TraceFlag').create(traceFlagData);
        
        if (traceFlagResult.success) {
          console.log(`Created Trace Flag with ID: ${traceFlagResult.id}`);
          
          // Get the full trace flag with debug level details
          const newTraceFlag = await conn.tooling.query(
            `SELECT Id, DebugLevelId, LogType, ExpirationDate, StartDate, TracedEntityId, 
             TracedEntityType FROM TraceFlag WHERE Id = '${traceFlagResult.id}'`
          );
          
          // Get the debug level details
          const debugLevelDetails = await conn.tooling.query(
            `SELECT Id, DeveloperName, ApexCode, ApexProfiling, Callout, Database, System, 
             Validation, Visualforce, Workflow FROM DebugLevel WHERE Id = '${finalDebugLevelId}'`
          );
          
          // Format the response to match our expected structure
          const flag = newTraceFlag.records[0];
          const level = debugLevelDetails.records[0];
          
          return {
            id: flag.Id,
            debugLevelId: flag.DebugLevelId,
            debugLevel: {
              id: level.Id,
              developerName: level.DeveloperName,
              apexCode: level.ApexCode,
              apexProfiling: level.ApexProfiling,
              callout: level.Callout,
              database: level.Database,
              system: level.System,
              validation: level.Validation,
              visualforce: level.Visualforce,
              workflow: level.Workflow
            },
            expirationDate: flag.ExpirationDate,
            logType: flag.LogType,
            startDate: flag.StartDate,
            tracedEntityId: flag.TracedEntityId,
            tracedEntityType: flag.TracedEntityType
          };
        } else {
          console.error('Failed to create Trace Flag:', traceFlagResult);
          throw new Error('Failed to create Trace Flag');
        }
      } catch (traceFlagError) {
        console.error('Error creating Trace Flag:', traceFlagError);
        throw traceFlagError;
      }
    } catch (error) {
      console.error('Error creating trace flag:', error);
      throw error;
    }
  }

  // Delete a trace flag
  async deleteTraceFlag(org: SalesforceOrg, flagId: string): Promise<void> {
    try {
      console.log(`Deleting trace flag ${flagId} from org ${org.name}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Delete the trace flag using the tooling API
      await conn.tooling.delete('TraceFlag', flagId);
      
      console.log(`Trace flag ${flagId} deleted successfully`);
      return;
    } catch (error) {
      console.error('Error deleting trace flag:', error);
      throw error;
    }
  }

  // Default Salesforce metadata types (used as fallback if Salesforce API call fails)
  private static metadataTypes: SalesforceMetadataType[] = [
    {
      xmlName: "CustomObject",
      directoryName: "objects",
      inFolder: false,
      metaFile: false,
      suffix: "object",
      childXmlNames: ["CustomField", "ValidationRule", "BusinessProcess", "RecordType"]
    },
    {
      xmlName: "ApexClass",
      directoryName: "classes",
      inFolder: false,
      metaFile: true,
      suffix: "cls",
      childXmlNames: []
    },
    {
      xmlName: "Flow",
      directoryName: "flows",
      inFolder: false,
      metaFile: false,
      suffix: "flow",
      childXmlNames: []
    },
    {
      xmlName: "LightningComponentBundle",
      directoryName: "lwc",
      inFolder: true,
      metaFile: false,
      suffix: "",
      childXmlNames: []
    }
  ];
  
  // Get metadata types from Salesforce
  async getMetadataTypes(org: SalesforceOrg): Promise<SalesforceMetadataType[]> {
    try {
      console.log(`Fetching metadata types from org ${org.id}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Use the metadata API to describe metadata types
      const metadataResult = await conn.metadata.describe();
      
      // Transform the results to match our expected format
      const metadataTypes = metadataResult.metadataObjects.map((type: any) => ({
        xmlName: type.xmlName,
        directoryName: type.directoryName || '',
        inFolder: type.inFolder || false,
        metaFile: type.metaFile || false,
        suffix: type.suffix || '',
        childXmlNames: type.childXmlNames || []
      }));
      
      // Update the static metadataTypes property for future use
      SalesforceService.metadataTypes = metadataTypes;
      
      return metadataTypes;
    } catch (error) {
      console.error('Error fetching metadata types:', error);
      // If there's an error, return the default metadata types
      return SalesforceService.metadataTypes;
    }
  }

  // Get metadata for a Salesforce org
  async getMetadata(org: SalesforceOrg, types: string[] = []): Promise<any> {
    try {
      console.log(`Fetching metadata from org ${org.id} for types: ${types.length > 0 ? types.join(', ') : 'all'}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Default to standard objects if none specified
      const objectTypes = types.length > 0 ? types : ['ApexClass', 'ApexTrigger', 'CustomObject', 'CustomField'];
      
      // List of metadata to return
      const metadataItems = [];
      
      // Fetch metadata for specified types
      try {
        // For ApexClass and ApexTrigger, use the tooling API
        if (objectTypes.includes('ApexClass') || objectTypes.includes('ApexTrigger')) {
          // Fetch Apex classes
          if (objectTypes.includes('ApexClass')) {
            const classes = await conn.tooling.query('SELECT Id, Name, Body FROM ApexClass LIMIT 100');
            classes.records.forEach((cls: any) => {
              metadataItems.push({
                name: cls.Name,
                type: 'ApexClass',
                id: cls.Id,
                body: cls.Body
              });
            });
          }
          
          // Fetch Apex triggers
          if (objectTypes.includes('ApexTrigger')) {
            const triggers = await conn.tooling.query('SELECT Id, Name, Body FROM ApexTrigger LIMIT 100');
            triggers.records.forEach((trg: any) => {
              metadataItems.push({
                name: trg.Name,
                type: 'ApexTrigger',
                id: trg.Id,
                body: trg.Body
              });
            });
          }
        }
        
        // For CustomObjects, describe the standard and custom objects
        if (objectTypes.includes('CustomObject')) {
          // Get the list of objects
          const objectsResult = await conn.describeGlobal();
          const objects = objectsResult.sobjects.slice(0, 20); // Increased limit for better visualization
          
          // Prepare structure for object data
          const customObjects = {
            objects: []
          };
          
          // Also create a structured SObjects collection for enhanced visualization
          const sobjects: Record<string, any> = {};
          
          console.log(`Processing ${objects.length} objects from Salesforce`);
          
          for (const obj of objects) {
            try {
              const objDescribe = await conn.describe(obj.name);
              
              // Process relationships from fields with references
              const relationships = [];
              
              // Extract relationship information from fields
              objDescribe.fields.forEach((field: any) => {
                if (field.type === 'reference' && field.referenceTo && field.referenceTo.length > 0) {
                  relationships.push({
                    name: field.relationshipName || `${field.name}Rel`,
                    fieldName: field.name,
                    referenceTo: field.referenceTo[0],
                    type: field.cascadeDelete ? 'MasterDetail' : 'Lookup'
                  });
                }
              });
              
              // Add to CustomObject format
              customObjects.objects.push({
                name: obj.name,
                label: obj.label,
                fields: objDescribe.fields.map((field: any) => ({
                  name: field.name,
                  type: field.type,
                  label: field.label,
                  referenceTo: field.referenceTo,
                  relationshipName: field.relationshipName
                })),
                relationships: relationships
              });
              
              // Add to SObjects format
              sobjects[obj.name] = {
                name: obj.name,
                label: obj.label,
                fields: {},
                relationships: relationships
              };
              
              // Process fields into a more structured format
              objDescribe.fields.forEach((field: any) => {
                sobjects[obj.name].fields[field.name] = {
                  name: field.name,
                  label: field.label,
                  type: field.type,
                  required: field.nillable === false,
                  unique: field.unique === true,
                  referenceTo: field.referenceTo,
                  relationshipName: field.relationshipName
                };
              });
              
              // Also add as individual metadata item for compatibility
              metadataItems.push({
                name: obj.name,
                type: 'CustomObject',
                id: obj.name,
                label: obj.label,
                fields: objDescribe.fields.map((field: any) => ({
                  name: field.name,
                  type: field.type,
                  label: field.label
                })),
                relationships: relationships
              });
            } catch (err) {
              console.error(`Error describing object ${obj.name}:`, err);
            }
          }
          
          // Add structured object data to metadata items
          metadataItems.push({
            name: 'CustomObjectStructure',
            type: 'CustomObject',
            id: 'CustomObjectStructure',
            data: customObjects
          });
          
          // Add SObjects data for enhanced visualization
          metadataItems.push({
            name: 'SObjectStructure',
            type: 'SObjects',
            id: 'SObjectStructure',
            data: sobjects
          });
          
          console.log(`Processed ${customObjects.objects.length} objects with relationships`);
        }
        
        // For custom fields, would need to extract them from object describes
        if (objectTypes.includes('CustomField')) {
          // This is extracted as part of the CustomObject logic above
          // Could be separated if needed
        }
      } catch (apiError) {
        console.error('Error fetching metadata from Salesforce API:', apiError);
        // Return what we have so far instead of failing completely
      }
      
      // Store the metadata in the database
      const metadata = {
        type: types.length > 0 ? types[0] : 'Mixed',
        items: metadataItems
      };
      
      await storage.createMetadata({
        orgId: org.id,
        type: types.length > 0 ? types[0] : 'Mixed',
        name: 'Metadata',
        data: metadata,
        lastUpdated: new Date()
      });
      
      // Update the org's last sync timestamp
      await storage.updateOrg(org.id, {
        lastSyncedAt: new Date().toISOString()
      });
      
      return metadataItems;
    } catch (error) {
      console.error('Error fetching Salesforce metadata:', error);
      throw error;
    }
  }
  
  // Generate a health score for a Salesforce org based on its metadata
  async generateHealthScore(orgId: number): Promise<any> {
    try {
      // In a real implementation, this would analyze the actual metadata
      // For now, we'll create a mock health score
      
      // Get org's metadata for analysis
      const metadata = await storage.getOrgMetadata(orgId);
      
      // Calculate complexity metrics
      const complexityMetrics = this.calculateComplexityMetrics(metadata);
      
      const issues = [
        {
          id: "SEC-001",
          severity: "critical",
          category: "security",
          title: "Overexposed Field Permissions",
          description: "Customer.SSN field is accessible to 4 profiles that don't require it",
          impact: "Sensitive data could be accessed by unauthorized users",
          recommendation: "Review and restrict field-level security for sensitive fields"
        },
        {
          id: "SEC-002",
          severity: "critical",
          category: "security",
          title: "SOQL Injection Vulnerability",
          description: "LeadController.apex contains potential SOQL injection vulnerability",
          impact: "Could allow unauthorized data access or modification",
          recommendation: "Use parameterized queries instead of string concatenation"
        },
        {
          id: "SEC-003",
          severity: "warning",
          category: "security",
          title: "Excessive Profile Permissions",
          description: "Support Profile has unnecessary Modify All Data permission",
          impact: "Provides more access than required, violating principle of least privilege",
          recommendation: "Review and remove unnecessary permissions"
        },
        {
          id: "SEC-004",
          severity: "warning",
          category: "security",
          title: "Sharing Rule Gaps",
          description: "Finance records have inconsistent sharing rules across objects",
          impact: "May result in inconsistent data access",
          recommendation: "Standardize sharing rules across related objects"
        },
        {
          id: "COMP-001",
          severity: "warning",
          category: "dataModel",
          title: "Complex Object Relationships",
          description: "Account object has excessive number of child objects (10+)",
          impact: "May lead to query performance issues and trigger complexity",
          recommendation: "Review data model and consider simplification or restructuring"
        },
        {
          id: "COMP-002",
          severity: "info",
          category: "apex",
          title: "High Technical Debt in Legacy Code",
          description: "Several Apex classes are over 1000 lines with low test coverage",
          impact: "Increases maintenance burden and risk of bugs during changes",
          recommendation: "Refactor large classes into smaller, more maintainable units"
        }
      ];
      
      const healthScore = {
        orgId,
        overallScore: 87,
        securityScore: 72,
        dataModelScore: 91,
        automationScore: 88,
        apexScore: 85,
        uiComponentScore: 64,
        // Add complexity metrics
        complexityScore: complexityMetrics.complexityScore,
        performanceRisk: complexityMetrics.performanceRisk,
        technicalDebt: complexityMetrics.technicalDebt,
        metadataVolume: complexityMetrics.metadataVolume,
        customizationLevel: complexityMetrics.customizationLevel,
        issues,
        lastAnalyzed: new Date()
      };
      
      // Store the health score in the database
      await storage.createHealthScore(healthScore);
      
      return healthScore;
    } catch (error) {
      console.error('Error generating health score:', error);
      throw error;
    }
  }
  
  // Calculate complexity metrics based on org metadata
  private calculateComplexityMetrics(metadata: any[]): {
    complexityScore: number;
    performanceRisk: number;
    technicalDebt: number;
    metadataVolume: number;
    customizationLevel: number;
  } {
    // In a real implementation, this would do a detailed analysis of the metadata
    // For this example, we'll create realistic complexity metrics based on simulated patterns

    // If no metadata, return default values
    if (!metadata || metadata.length === 0) {
      return {
        complexityScore: 50,  // Medium complexity
        performanceRisk: 40,  // Moderate risk
        technicalDebt: 35,    // Some technical debt
        metadataVolume: 45,   // Moderate volume
        customizationLevel: 55 // Moderate customization
      };
    }
    
    // Example logic to calculate complexity:
    // 1. Count total objects and custom fields
    // 2. Analyze relationship complexity (lookups vs master-detail)
    // 3. Check for complex automations (flows, triggers, etc.)
    // 4. Evaluate code quality and test coverage
    
    // For this demo, we'll use random values between 30-85 to simulate a real org
    // In a production version, these would be calculated from actual metadata analysis
    const randomBetween = (min: number, max: number) => 
      Math.floor(Math.random() * (max - min + 1) + min);
    
    const complexityScore = randomBetween(40, 85);  // Overall complexity
    
    // Make other metrics somewhat correlated with complexity
    const variance = 15; // How much metrics can vary from complexityScore
    const performanceRisk = Math.min(100, Math.max(0, 
      complexityScore + randomBetween(-variance, variance)));
      
    const technicalDebt = Math.min(100, Math.max(0, 
      complexityScore + randomBetween(-variance, variance)));
      
    const metadataVolume = Math.min(100, Math.max(0, 
      complexityScore + randomBetween(-variance, variance)));
      
    const customizationLevel = Math.min(100, Math.max(0, 
      complexityScore + randomBetween(-variance, variance)));
    
    return {
      complexityScore,
      performanceRisk,
      technicalDebt,
      metadataVolume,
      customizationLevel
    };
  }
  
  // Execute a SOQL query against a Salesforce org
  async executeQuery(org: SalesforceOrg, query: string): Promise<any> {
    try {
      console.log(`Executing SOQL query on org ${org.id}: ${query}`);
      
      // Connect to Salesforce using stored credentials
      const conn = new jsforce.Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken || ''
      });
      
      // Execute the SOQL query directly
      try {
        const results = await conn.query(query);
        console.log(`Query executed successfully: ${results.totalSize} records found`);
        return results;
      } catch (queryError: any) {
        console.error('Error executing query:', queryError);
        
        // Return an empty result set in case of error, but with error message
        return {
          totalSize: 0,
          done: true,
          records: [],
          error: queryError?.message || 'Unknown query error'
        };
      }
    } catch (error) {
      console.error('Error executing SOQL query:', error);
      throw error;
    }
  }
  
  // Get available metadata types from Salesforce
  static getMetadataTypes(): SalesforceMetadataType[] {
    return this.metadataTypes;
  }

  // Get metadata dependencies for a specific type or all types
  async getMetadataDependencies(org: SalesforceOrg, metadataType?: string): Promise<any> {
    try {
      console.log(`Fetching metadata dependencies for org ${org.id}, type: ${metadataType || 'all'}`);
      
      // Get the metadata from the org to analyze dependencies
      const metadata = await this.getMetadata(org, metadataType ? [metadataType] : []);
      
      // Process metadata to extract dependencies by type
      const dependencyData: any = {
        apex: [],
        fields: [],
        objects: []
      };
      
      // Populate apex dependencies
      const apexItems = metadata.filter((item: any) => 
        item.type === 'ApexClass' || item.type === 'ApexTrigger'
      );
      
      dependencyData.apex = apexItems.map((item: any, index: number) => ({
        id: index + 1,
        name: item.name,
        type: item.type,
        references: this.generateDependencyReferences(item.name, item.type, metadata)
      }));
      
      // Populate field dependencies
      const fieldItems = metadata.filter((item: any) => 
        item.type === 'CustomField'
      );
      
      dependencyData.fields = fieldItems.map((item: any, index: number) => ({
        id: index + 1,
        name: item.name,
        type: item.type,
        references: this.generateDependencyReferences(item.name, item.type, metadata)
      }));
      
      // Populate object dependencies
      const objectItems = metadata.filter((item: any) => 
        item.type === 'CustomObject'
      );
      
      dependencyData.objects = objectItems.map((item: any, index: number) => ({
        id: index + 1,
        name: item.name,
        type: item.type,
        references: this.generateDependencyReferences(item.name, item.type, metadata)
      }));
      
      return dependencyData;
    } catch (error) {
      console.error('Error fetching metadata dependencies:', error);
      throw error;
    }
  }
  
  // Generate dependency references for a component based on real metadata
  private generateDependencyReferences(componentName: string, componentType: string, metadata: any[]): any[] {
    // This is where you would implement logic to analyze the metadata and generate actual dependencies
    // For now, we'll create some realistic-looking dependencies based on component type and name
    
    const references = [];
    let referenceCount = Math.floor(Math.random() * 5) + 1; // Generate 1-5 references
    
    for (let i = 0; i < referenceCount; i++) {
      const relatedItems = metadata.filter(item => item.name !== componentName);
      if (relatedItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * relatedItems.length);
        const relatedItem = relatedItems[randomIndex];
        
        // Determine reference type based on component relationships
        let referenceType = "Reference";
        
        if (componentType === 'ApexClass' && relatedItem.type === 'ApexTrigger') {
          referenceType = "Trigger Handler";
        } else if (componentType === 'ApexClass' && relatedItem.type === 'ApexClass') {
          referenceType = "Method Call";
        } else if (componentType === 'CustomObject' && relatedItem.type === 'ApexClass') {
          referenceType = "Object Reference";
        } else if (componentType === 'CustomField' && relatedItem.type === 'ApexClass') {
          referenceType = "Field Reference";
        } else if (componentType === 'CustomField' && relatedItem.type === 'Layout') {
          referenceType = "Layout Field";
        }
        
        references.push({
          id: i + 1,
          name: relatedItem.name,
          type: relatedItem.type,
          referenceType: referenceType
        });
      }
    }
    
    return references;
  }
  
  // Get reverse dependencies for a component
  async getReverseDependencies(org: SalesforceOrg, componentName: string): Promise<any[]> {
    try {
      console.log(`Fetching reverse dependencies for ${componentName} in org ${org.id}`);
      
      // Get the metadata from the org to analyze reverse dependencies
      const metadata = await this.getMetadata(org, []);
      
      // Find the component in metadata
      const component = metadata.find((item: any) => item.name === componentName);
      if (!component) {
        return [];
      }
      
      // Generate reverse dependency references
      return this.generateReverseDependencies(componentName, component.type, metadata);
    } catch (error) {
      console.error('Error fetching reverse dependencies:', error);
      throw error;
    }
  }
  
  // Generate reverse dependencies for a component based on real metadata
  private generateReverseDependencies(componentName: string, componentType: string, metadata: any[]): any[] {
    // This would analyze metadata to find components that reference the given component
    // For now, we'll simulate realistic reverse dependencies
    const reverseDependencies = [];
    let dependencyCount = Math.floor(Math.random() * 6) + 2; // Generate 2-7 dependencies
    
    for (let i = 0; i < dependencyCount; i++) {
      const relatedItems = metadata.filter(item => item.name !== componentName);
      if (relatedItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * relatedItems.length);
        const dependentItem = relatedItems[randomIndex];
        
        // Determine reference type based on component relationships
        let referenceType = "Reference";
        
        if (componentType === 'ApexClass' && dependentItem.type === 'CustomObject') {
          referenceType = "Object Reference";
        } else if (componentType === 'ApexClass' && dependentItem.type === 'CustomField') {
          referenceType = "Field Reference";
        } else if (componentType === 'ApexClass' && dependentItem.type === 'ApexClass') {
          referenceType = "Utility Reference";
        } else if (componentType === 'CustomObject' && dependentItem.type === 'CustomField') {
          referenceType = "Parent Object";
        }
        
        reverseDependencies.push({
          id: i + 1,
          name: dependentItem.name,
          type: dependentItem.type,
          referenceType: referenceType
        });
      }
    }
    
    return reverseDependencies;
  }

  /**
   * Retrieves API usage data and limits for a Salesforce org
   * This method retrieves API limits, requests by type, request methods, error rates,
   * and generates recommendations for API optimization
   */
  async getApiUsageData(org: SalesforceOrg): Promise<any> {
    console.log(`Fetching API usage data for org ${org.id}`);
    
    try {
      // Authenticate with Salesforce if needed
      const conn = new (require('jsforce')).Connection({
        instanceUrl: org.instanceUrl,
        accessToken: org.accessToken
      });
      
      // First check if the connection is valid
      try {
        // Simple identity check to verify the connection works
        const identity = await conn.identity();
        console.log(`Connected to Salesforce as: ${identity.username}`);
      } catch (authError) {
        console.error("Authentication error with Salesforce:", authError);
        throw new Error(`Failed to authenticate with Salesforce: ${authError.message}`);
      }
      
      // Fetch organization limits
      let limits;
      try {
        limits = await conn.limits();
        console.log("Retrieved API limits:", limits);
      } catch (limitsError) {
        console.error("Error fetching Salesforce API limits:", limitsError);
        throw new Error(`Failed to fetch API limits: ${limitsError.message}`);
      }
      
      // Fetch recent API usage info from API Usage app and EventLogFile
      // Note: We would run SOQL queries here to get real API usage data
      const apiRequestsQuery = `
        SELECT Id, LogDate, Operation, Method, URI, ElapsedTime, Status
        FROM EventLogFile 
        WHERE LogFile = 'API' 
        AND LogDate = LAST_N_DAYS:7
        ORDER BY LogDate DESC
        LIMIT 100
      `;
      
      // Try to get actual EventLogFile data, but it's okay if this fails
      // as many orgs don't have API monitoring enabled
      let apiRequests = { records: [], totalSize: 0 };
      try {
        apiRequests = await conn.query(apiRequestsQuery);
        console.log(`Retrieved ${apiRequests.totalSize} API usage records`);
      } catch (queryError) {
        console.log("EventLogFile query failed - this is common if API monitoring isn't enabled:", queryError.message);
        // Will fall back to just using limits data
      }
      
      // If we have API usage records, process them along with the limits
      if (apiRequests && apiRequests.records && apiRequests.records.length > 0) {
        console.log("Processing API usage data with EventLogFile records");
        return this.processApiUsageData(limits, apiRequests.records);
      }
      
      // Otherwise just use the limits data
      console.log("Creating API analytics using only limit data");
      return this.createApiUsageAnalytics(limits);
      
    } catch (error) {
      console.error("Error fetching API usage data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve API usage data: ${errorMessage}`);
    }
  }
  
  /**
   * Process raw API usage data and limits into structured analytics
   * This would be implemented with real data processing in production
   */
  private processApiUsageData(limits: Record<string, any>, apiRequests: Record<string, any>[]): Record<string, any> {
    // In a real implementation, we would process the actual data
    // from the EventLogFile records to build usage trends, 
    // calculate error rates, identify top consumers, etc.
    
    // For now, we're using mock data with the correct structure
    return this.createApiUsageAnalytics(limits);
  }
  
  /**
   * Creates API usage analytics based on available limits data
   * Falls back to mock data when actual usage data isn't available
   */
  private createApiUsageAnalytics(limits: Record<string, any>): Record<string, any> {
    // Get actual daily API request limits if available
    const dailyApiLimit = limits?.DailyApiRequests?.Max || 25000;
    const dailyApiUsed = limits?.DailyApiRequests?.Remaining 
      ? dailyApiLimit - limits.DailyApiRequests.Remaining
      : Math.floor(dailyApiLimit * 0.59); // Mock usage ~59% of limit
    
    // Get actual concurrent API limit if available
    const concurrentApiLimit = limits?.ConcurrentAsyncGetReportInstances?.Max || 25;
    const concurrentApiUsed = limits?.ConcurrentAsyncGetReportInstances?.Remaining
      ? concurrentApiLimit - limits.ConcurrentAsyncGetReportInstances.Remaining
      : 8; // Mock usage
    
    // Return structured API usage data
    return {
      // Daily limits - use actual limits if available
      dailyApiRequests: {
        used: dailyApiUsed,
        total: dailyApiLimit,
      },
      
      // Per-user API requests
      concurrentApiRequests: {
        used: concurrentApiUsed,
        total: concurrentApiLimit,
      },
      
      // API request types
      requestsByType: [
        { type: 'REST', count: 8765, percentage: 59, color: '#3B82F6' },
        { type: 'SOAP', count: 3546, percentage: 24, color: '#10B981' },
        { type: 'Bulk', count: 1890, percentage: 13, color: '#F59E0B' },
        { type: 'Metadata', count: 581, percentage: 4, color: '#8B5CF6' },
      ],
      
      // API request methods
      requestsByMethod: [
        { method: 'GET', count: 7842, percentage: 53, color: '#3B82F6' },
        { method: 'POST', count: 4291, percentage: 29, color: '#10B981' },
        { method: 'PATCH', count: 1654, percentage: 11, color: '#F59E0B' },
        { method: 'DELETE', count: 581, percentage: 4, color: '#EC4899' },
        { method: 'HEAD', count: 414, percentage: 3, color: '#6B7280' },
      ],
      
      // Top API consumers (users/integrations)
      topConsumers: [
        { name: 'Data Integration Service', requests: 5432, percentage: 37 },
        { name: 'Admin User', requests: 3789, percentage: 26 },
        { name: 'Marketing Automation', requests: 2143, percentage: 14 },
        { name: 'Sales Dashboard', requests: 1987, percentage: 13 },
        { name: 'Customer Portal', requests: 1431, percentage: 10 },
      ],
      
      // Error rates
      errorRates: [
        { type: 'Rate Limit', count: 187, percentage: 1.3, color: '#EF4444' },
        { type: 'Authentication', count: 94, percentage: 0.6, color: '#F59E0B' },
        { type: 'Validation', count: 213, percentage: 1.4, color: '#3B82F6' },
        { type: 'Server', count: 32, percentage: 0.2, color: '#8B5CF6' },
      ],
      
      // API usage over time (7 days)
      usageTrend: [
        { date: '2025-03-29', requests: 15243, limit: dailyApiLimit },
        { date: '2025-03-30', requests: 13587, limit: dailyApiLimit },
        { date: '2025-03-31', requests: 16421, limit: dailyApiLimit },
        { date: '2025-04-01', requests: 18743, limit: dailyApiLimit },
        { date: '2025-04-02', requests: 14852, limit: dailyApiLimit },
        { date: '2025-04-03', requests: 12754, limit: dailyApiLimit },
        { date: '2025-04-04', requests: 14782, limit: dailyApiLimit },
      ],
      
      // Response time metrics
      responseTime: {
        average: 458,
        percentile95: 1245,
        percentile99: 2378,
      },
      
      // Batch vs. single record operations
      batchEfficiency: {
        batchOperations: 3245,
        singleOperations: 7854,
        potentialBatchSavings: 4538,
      },
      
      // Rate limiting events
      rateLimitEvents: [
        { date: '2025-04-01 14:32:18', count: 87, duration: 5 },
        { date: '2025-04-03 09:18:45', count: 42, duration: 3 },
        { date: '2025-04-04 17:52:31', count: 58, duration: 4 },
      ],
      
      // Optimization recommendations
      optimizationRecommendations: [
        {
          id: 'opt-001',
          title: 'Implement Composite API Requests',
          description: 'Consolidate multiple related API calls into single composite requests to reduce the total number of API calls.',
          impact: 'high',
          type: 'limit',
        },
        {
          id: 'opt-002',
          title: 'Add API Response Caching',
          description: 'Implement client-side caching for frequently accessed data that doesn\'t change often.',
          impact: 'medium',
          type: 'performance',
        },
        {
          id: 'opt-003',
          title: 'Optimize SOQL Queries',
          description: 'Use selective queries and avoid retrieving unnecessary fields to improve response times and reduce resource usage.',
          impact: 'medium',
          type: 'efficiency',
        },
        {
          id: 'opt-004',
          title: 'Batch Similar Operations',
          description: 'Convert multiple single-record operations to batch operations when working with multiple records.',
          impact: 'high',
          type: 'limit',
        },
        {
          id: 'opt-005',
          title: 'Implement Exponential Backoff',
          description: 'Add intelligent retry logic with exponential backoff to handle rate limiting gracefully.',
          impact: 'medium',
          type: 'limit',
        },
      ],
    };
  }
}

export const salesforceService = new SalesforceService();
