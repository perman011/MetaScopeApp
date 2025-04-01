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
      // In a real implementation, this would make an API call to Salesforce
      // For demonstration purposes, we'll return mock data
      return [
        { id: "005xx000001X8zrAAC", name: "System Administrator" },
        { id: "005xx000001X8zsAAC", name: "Integration User" },
        { id: "005xx000001X8ztAAC", name: "Regular User" },
        { id: "005xx000001X8zuAAC", name: "API User" },
        { id: "005xx000001X8zvAAC", name: "Mekan Developer" }
      ];
    } catch (error) {
      console.error('Error fetching org users:', error);
      throw error;
    }
  }

  // Get apex logs from Salesforce
  async getApexLogs(org: SalesforceOrg): Promise<any[]> {
    try {
      // In a real implementation, this would make an API call to Salesforce
      // For demonstration purposes, we'll return mock data
      return [
        {
          id: "07Lxx000001X8zrAAC",
          application: "API",
          duration: 15482,
          location: "ProcessBuilder",
          logLength: 1245678,
          operation: "Opportunity Trigger",
          request: "Api",
          startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          status: "Success",
          user: {
            id: "005xx000001X8zrAAC",
            name: "System Administrator"
          }
        },
        {
          id: "07Lxx000001X8zsAAC",
          application: "Apex Class",
          duration: 8731,
          location: "OpportunityTriggerHandler",
          logLength: 785432,
          operation: "Bulk API Batch",
          request: "Apex",
          startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          status: "Success",
          user: {
            id: "005xx000001X8ztAAC",
            name: "Regular User"
          }
        },
        {
          id: "07Lxx000001X8ztAAC",
          application: "Visualforce Page",
          duration: 22145,
          location: "AccountController",
          logLength: 2134567,
          operation: "VF Page: /apex/AccountDetail",
          request: "Visualforce",
          startTime: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          status: "Success",
          user: {
            id: "005xx000001X8zvAAC",
            name: "Mekan Developer"
          }
        },
        {
          id: "07Lxx000001X8zuAAC",
          application: "Lightning",
          duration: 5623,
          location: "LightningController",
          logLength: 456789,
          operation: "Account Update",
          request: "Lightning",
          startTime: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          status: "Success",
          user: {
            id: "005xx000001X8zvAAC",
            name: "Mekan Developer"
          }
        },
        {
          id: "07Lxx000001X8zvAAC",
          application: "Flows",
          duration: 12876,
          location: "Flow_AutocreatedAPIName_1",
          logLength: 1654321,
          operation: "Flow Interview",
          request: "Flow",
          startTime: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
          status: "Success",
          user: {
            id: "005xx000001X8ztAAC",
            name: "Regular User"
          }
        }
      ];
    } catch (error) {
      console.error('Error fetching apex logs:', error);
      throw error;
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
      // In a real implementation, this would fetch trace flags from Salesforce
      // For demonstration purposes, we'll return mock data
      
      // Current time for calculating relative expiration times
      const now = new Date();
      
      return [
        {
          id: "7tfxx000000blTzAAI",
          debugLevelId: "7dlxx000000fDrSAAU",
          debugLevel: {
            id: "7dlxx000000fDrSAAU",
            developerName: "ApexDebug",
            apexCode: "DEBUG",
            apexProfiling: "FINEST",
            callout: "INFO",
            database: "FINE",
            system: "DEBUG",
            validation: "INFO",
            visualforce: "INFO",
            workflow: "INFO"
          },
          expirationDate: new Date(now.getTime() + 3600000).toISOString(), // 1 hour from now
          logType: "USER_DEBUG",
          startDate: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
          tracedEntityId: "005xx000001X8zvAAC",
          tracedEntityType: "User"
        },
        {
          id: "7tfxx000000blU0AAI",
          debugLevelId: "7dlxx000000fDrTAAU",
          debugLevel: {
            id: "7dlxx000000fDrTAAU",
            developerName: "DetailedLogging",
            apexCode: "FINEST",
            apexProfiling: "FINEST",
            callout: "FINEST",
            database: "FINEST",
            system: "DEBUG",
            validation: "INFO",
            visualforce: "INFO",
            workflow: "INFO"
          },
          expirationDate: new Date(now.getTime() - 1800000).toISOString(), // 30 minutes ago (expired)
          logType: "USER_DEBUG",
          startDate: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
          tracedEntityId: "005xx000001X8ztAAC",
          tracedEntityType: "User"
        }
      ];
    } catch (error) {
      console.error('Error fetching trace flags:', error);
      throw error;
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
      // In a real implementation, this would create a trace flag in Salesforce
      
      // Current time for calculating start and expiration
      const now = new Date();
      const expirationDate = new Date(now.getTime() + (expirationMinutes * 60 * 1000));
      
      // Create a debug level first if one wasn't specified
      const debugLevelInfo = debugLevelId ? { 
        id: debugLevelId,
        developerName: "ExistingDebugLevel" 
      } : {
        id: "7dlxx00000" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        developerName: "CustomDebugLevel_" + new Date().getTime()
      };
      
      // If debugLevel parameters were provided, use them
      const finalDebugLevel = {
        ...debugLevelInfo,
        apexCode: debugLevel?.apexCode || "DEBUG",
        apexProfiling: debugLevel?.apexProfiling || "INFO",
        callout: debugLevel?.callout || "INFO",
        database: debugLevel?.database || "INFO",
        system: debugLevel?.system || "DEBUG",
        validation: debugLevel?.validation || "INFO",
        visualforce: debugLevel?.visualforce || "INFO",
        workflow: debugLevel?.workflow || "INFO"
      };
      
      // Create the trace flag
      const traceFlag = {
        id: "7tfxx00000" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        debugLevelId: finalDebugLevel.id,
        debugLevel: finalDebugLevel,
        expirationDate: expirationDate.toISOString(),
        logType: "USER_DEBUG",
        startDate: now.toISOString(),
        tracedEntityId: tracedEntityId,
        tracedEntityType: "User" // Assuming we're only tracing users for now
      };
      
      console.log(`Created trace flag for entity ${tracedEntityId}, expires in ${expirationMinutes} minutes`);
      
      return traceFlag;
    } catch (error) {
      console.error('Error creating trace flag:', error);
      throw error;
    }
  }

  // Delete a trace flag
  async deleteTraceFlag(org: SalesforceOrg, flagId: string): Promise<void> {
    try {
      // In a real implementation, this would delete the trace flag in Salesforce
      console.log(`Deleting trace flag ${flagId} from org ${org.name}`);
      
      // Success response (no actual deletion in mock version)
      return;
    } catch (error) {
      console.error('Error deleting trace flag:', error);
      throw error;
    }
  }

  // Mock Salesforce metadata types (in a real implementation, this would be retrieved from Salesforce)
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
          const objects = objectsResult.sobjects.slice(0, 10); // Limit for demo purposes
          
          for (const obj of objects) {
            const objDescribe = await conn.describe(obj.name);
            metadataItems.push({
              name: obj.name,
              type: 'CustomObject',
              id: obj.name,
              label: obj.label,
              fields: objDescribe.fields.map((field: any) => ({
                name: field.name,
                type: field.type,
                label: field.label
              }))
            });
          }
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
}

export const salesforceService = new SalesforceService();
