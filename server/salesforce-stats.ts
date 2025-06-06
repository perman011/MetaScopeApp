import * as jsforce from 'jsforce';
import { SalesforceOrg } from '@shared/schema';

/**
 * Interface for license details
 */
export interface LicenseDetail {
  name: string;
  used: number;
  total: number;
}

/**
 * Interface for general organizational statistics
 */
export interface OrgStat {
  key: string;
  label: string;
  value: number;
  limit: number;
  unit?: string;
  category?: 'storage' | 'metadata' | 'api' | 'users' | 'automation';
  details?: LicenseDetail[]; // For license breakdown and other detailed stats
}

/**
 * Service for retrieving Salesforce org general statistics
 */
export class SalesforceStatsService {
  /**
   * Retrieves general statistics for a Salesforce org
   */
  async getGeneralStats(org: SalesforceOrg): Promise<OrgStat[]> {
    console.log(`Fetching general stats for org: ${org.name}`);
    const conn = new jsforce.Connection({
      instanceUrl: org.instanceUrl || undefined,
      accessToken: org.accessToken || undefined,
      refreshToken: org.refreshToken || undefined,
      oauth2: {
        clientId: process.env.SALESFORCE_CLIENT_ID || '',
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
        redirectUri: process.env.SALESFORCE_CALLBACK_URL || ''
      }
    });

    // Skip username/password authentication, rely on accessToken
    // The SalesforceOrg schema doesn't include username/password fields anymore

    try {
      const [
        limitsData,
        activeUsers,
        licenseUsage,
        customObjects,
        apexClasses,
        visualforcePages,
        lightningComponents,
        auraComponents,
        flows,
        platformEvents
      ] = await Promise.all([
        this.getLimitsData(conn),
        this.getActiveUsersCount(conn),
        this.getLicenseUsage(conn),
        this.getCustomObjectsCount(conn),
        this.getApexClassesCount(conn),
        this.getVisualforcePagesCount(conn),
        this.getLightningComponentsCount(conn),
        this.getAuraComponentsCount(conn),
        this.getFlowsCount(conn),
        this.getPlatformEventsCount(conn)
      ]);

      // Compile all stats
      const stats: OrgStat[] = [
        // API usage
        {
          key: 'dailyApiRequests',
          label: 'Daily API Calls',
          value: limitsData.DailyApiRequests?.Max ? limitsData.DailyApiRequests.Remaining : 0,
          limit: limitsData.DailyApiRequests?.Max || 100000,
          category: 'api'
        },
        
        // Storage
        {
          key: 'dataStorage',
          label: 'Data Storage',
          value: limitsData.DataStorageMB?.Remaining || 0,
          limit: limitsData.DataStorageMB?.Max || 1000,
          unit: 'MB',
          category: 'storage'
        },
        {
          key: 'fileStorage',
          label: 'File Storage',
          value: limitsData.FileStorageMB?.Remaining || 0,
          limit: limitsData.FileStorageMB?.Max || 1000,
          unit: 'MB',
          category: 'storage'
        },
        
        // Users
        {
          key: 'activeUsers',
          label: 'Active User Accounts',
          value: activeUsers.value,
          limit: activeUsers.limit,
          category: 'users'
        },
        {
          key: 'licenseUsage',
          label: 'Salesforce Licenses',
          value: licenseUsage.value,
          limit: licenseUsage.limit,
          unit: 'seats',
          category: 'users',
          details: licenseUsage.details
        },
        
        // Metadata objects
        {
          key: 'customObjects',
          label: 'Custom Objects',
          value: customObjects.value,
          limit: customObjects.limit,
          category: 'metadata'
        },
        {
          key: 'apexClasses',
          label: 'Apex Classes',
          value: apexClasses.value,
          limit: apexClasses.limit,
          category: 'metadata'
        },
        {
          key: 'visualforcePages',
          label: 'Visualforce Pages',
          value: visualforcePages.value,
          limit: visualforcePages.limit,
          category: 'metadata'
        },
        {
          key: 'lightningComponents',
          label: 'Lightning Web Components',
          value: lightningComponents.value,
          limit: lightningComponents.limit,
          category: 'metadata'
        },
        {
          key: 'auraComponents',
          label: 'Aura Components',
          value: auraComponents.value,
          limit: auraComponents.limit,
          category: 'metadata'
        },
        
        // Automation
        {
          key: 'flows',
          label: 'Flows',
          value: flows.value,
          limit: flows.limit,
          category: 'automation'
        },
        {
          key: 'platformEvents',
          label: 'Platform Events',
          value: platformEvents.value,
          limit: platformEvents.limit,
          category: 'automation'
        }
      ];

      return stats;
    } catch (error: any) {
      console.error('Error fetching general stats:', error);
      throw new Error(`Failed to retrieve organization stats: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Fetches organization limits using JSForce
   */
  private async getLimitsData(conn: jsforce.Connection): Promise<any> {
    try {
      return await conn.limits();
    } catch (error) {
      console.error('Error fetching organization limits:', error);
      return {};
    }
  }

  /**
   * Counts active users in the organization
   */
  private async getActiveUsersCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      const result = await conn.query('SELECT COUNT(Id) total FROM User WHERE IsActive = true');
      const orgLimits = await conn.query('SELECT ActiveUserCount, ActiveUserLicenseCount FROM LimitInfo LIMIT 1');
      
      // If LimitInfo is available, use its values
      if (orgLimits.records.length > 0) {
        return {
          value: orgLimits.records[0].ActiveUserCount || result.totalSize,
          limit: orgLimits.records[0].ActiveUserLicenseCount || 100
        };
      }
      
      // Otherwise return query result with default limit
      return {
        value: result.totalSize,
        limit: 100 // Default limit if LimitInfo not available
      };
    } catch (error) {
      console.error('Error counting active users:', error);
      return { value: 0, limit: 100 };
    }
  }
  
  /**
   * Gets license usage in the organization
   * Focuses on the primary Salesforce licenses (not including feature licenses)
   * Returns both aggregate counts and detailed breakdown by license type
   */
  private async getLicenseUsage(conn: jsforce.Connection): Promise<{ value: number, limit: number, details?: LicenseDetail[] }> {
    try {
      // Try to fetch license usage from UserLicense object for the main Salesforce licenses
      const licensesResult = await conn.query(`
        SELECT Id, LicenseDefinitionKey, Name, TotalLicenses, UsedLicenses 
        FROM UserLicense 
        WHERE Name LIKE '%Salesforce%' 
        OR Name LIKE '%Platform%' 
        OR Name LIKE '%CRM%'
        OR Name LIKE '%Enterprise%'
        OR Name = 'Force.com - Free'
        OR Name = 'Chatter Free'
        OR Name = 'Guest User License'
        ORDER BY UsedLicenses DESC
      `);
      
      if (licensesResult.records && licensesResult.records.length > 0) {
        // Sum up all licenses and their usage
        let totalLicenses = 0;
        let usedLicenses = 0;
        const licenseDetails: LicenseDetail[] = [];
        
        // Focus on main licenses only and build details array
        licensesResult.records.forEach((license: any) => {
          const total = license.TotalLicenses || 0;
          const used = license.UsedLicenses || 0;
          
          totalLicenses += total;
          usedLicenses += used;
          
          // Skip licenses with zero total (these are often feature licenses or temporary licenses)
          if (total > 0) {
            licenseDetails.push({
              name: license.Name || 'Unknown License Type',
              used: used,
              total: total
            });
          }
        });
        
        return {
          value: usedLicenses,
          limit: totalLicenses,
          details: licenseDetails
        };
      }
      
      // If no specific license types found, get all licenses
      const allLicensesResult = await conn.query(`
        SELECT Id, LicenseDefinitionKey, Name, TotalLicenses, UsedLicenses 
        FROM UserLicense
        ORDER BY UsedLicenses DESC
      `);
      
      if (allLicensesResult.records && allLicensesResult.records.length > 0) {
        let totalLicenses = 0;
        let usedLicenses = 0;
        const licenseDetails: LicenseDetail[] = [];
        
        allLicensesResult.records.forEach((license: any) => {
          const total = license.TotalLicenses || 0;
          const used = license.UsedLicenses || 0;
          
          totalLicenses += total;
          usedLicenses += used;
          
          // Only include licenses that have allocations
          if (total > 0) {
            licenseDetails.push({
              name: license.Name || 'Unknown License Type',
              used: used,
              total: total
            });
          }
        });
        
        return {
          value: usedLicenses,
          limit: totalLicenses,
          details: licenseDetails
        };
      }
      
      // Fallback to counting all users if UserLicense query fails
      const usersResult = await conn.query('SELECT COUNT(Id) total FROM User');
      return {
        value: usersResult.records[0].total,
        limit: 100 // Default value if actual license count can't be determined
      };
    } catch (error) {
      console.error('Error getting license usage:', error);
      return { value: 0, limit: 100 };
    }
  }

  /**
   * Counts custom objects in the organization
   */
  private async getCustomObjectsCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      const result = await conn.query('SELECT COUNT(Id) total FROM EntityDefinition WHERE IsCustomizable = true');
      return {
        value: result.records[0].total,
        limit: 3000 // Typical limit, but varies by edition
      };
    } catch (error) {
      console.error('Error counting custom objects:', error);
      return { value: 0, limit: 3000 };
    }
  }

  /**
   * Counts Apex classes in the organization
   */
  private async getApexClassesCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      const result = await conn.query('SELECT COUNT(Id) total FROM ApexClass');
      return {
        value: result.records[0].total,
        limit: 5000 // Typical limit, but varies by edition
      };
    } catch (error) {
      console.error('Error counting Apex classes:', error);
      return { value: 0, limit: 5000 };
    }
  }

  /**
   * Counts Visualforce pages in the organization
   */
  private async getVisualforcePagesCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      const result = await conn.query('SELECT COUNT(Id) total FROM ApexPage');
      return {
        value: result.records[0].total,
        limit: 5000 // Typical limit, but varies by edition
      };
    } catch (error) {
      console.error('Error counting Visualforce pages:', error);
      return { value: 0, limit: 5000 };
    }
  }

  /**
   * Counts Lightning web components in the organization
   */
  private async getLightningComponentsCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      // LightningComponentBundle represents LWC components
      const result = await conn.query('SELECT COUNT(Id) total FROM LightningComponentBundle');
      return {
        value: result.records[0].total,
        limit: 2000 // Approximate limit
      };
    } catch (error) {
      console.error('Error counting Lightning components:', error);
      return { value: 0, limit: 2000 };
    }
  }

  /**
   * Counts Aura components in the organization
   */
  private async getAuraComponentsCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      // AuraDefinitionBundle represents Aura components
      const result = await conn.query('SELECT COUNT(Id) total FROM AuraDefinitionBundle');
      return {
        value: result.records[0].total,
        limit: 5000 // Approximate limit
      };
    } catch (error) {
      console.error('Error counting Aura components:', error);
      return { value: 0, limit: 5000 };
    }
  }

  /**
   * Counts flows in the organization
   */
  private async getFlowsCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      const result = await conn.query('SELECT COUNT(Id) total FROM FlowDefinition');
      return {
        value: result.records[0].total,
        limit: 2000 // Typical limit, but varies by edition
      };
    } catch (error) {
      console.error('Error counting flows:', error);
      return { value: 0, limit: 2000 };
    }
  }

  /**
   * Counts platform events in the organization
   */
  private async getPlatformEventsCount(conn: jsforce.Connection): Promise<{ value: number, limit: number }> {
    try {
      const result = await conn.query("SELECT COUNT(Id) total FROM EntityDefinition WHERE IsCustomizable = true AND PublishBehavior = 'PublishAfterCommit'");
      return {
        value: result.records[0].total,
        limit: 250 // Typical limit
      };
    } catch (error) {
      console.error('Error counting platform events:', error);
      return { value: 0, limit: 250 };
    }
  }
}

export const salesforceStatsService = new SalesforceStatsService();