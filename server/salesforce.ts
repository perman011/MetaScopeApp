import { type Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import axios from "axios";
import { SalesforceOrg, InsertSalesforceOrg, InsertMetadata, InsertHealthScore, InsertIssue } from "@shared/schema";

const SALESFORCE_API_VERSION = "56.0";

// Helper function to get the Salesforce instance URL
const getSalesforceInstanceUrl = (domain: string) => {
  if (domain.includes(".my.salesforce.com")) {
    return `https://${domain}`;
  }
  return `https://${domain}.my.salesforce.com`;
};

// Helper function to construct API URLs
const getApiUrl = (instanceUrl: string, path: string) => {
  return `${instanceUrl}/services/data/v${SALESFORCE_API_VERSION}${path}`;
};

// Create a new Salesforce connection
export const connectSalesforceOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, domain, type, accessToken, refreshToken } = req.body;
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Validate required fields
    if (!name || !domain || !type || !accessToken) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const instanceUrl = getSalesforceInstanceUrl(domain);
    
    // Check if the access token is valid by making a simple API call
    try {
      const apiUrl = getApiUrl(instanceUrl, "/sobjects");
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (response.status !== 200) {
        return res.status(400).json({ message: "Invalid Salesforce credentials" });
      }
    } catch (error) {
      return res.status(400).json({ message: "Failed to connect to Salesforce org" });
    }
    
    // Create the org record
    const org: InsertSalesforceOrg = {
      userId: req.user!.id,
      name,
      domain,
      instanceUrl,
      isActive: true,
      type,
      accessToken,
      refreshToken,
    };
    
    const createdOrg = await storage.createSalesforceOrg(org);
    
    res.status(201).json(createdOrg);
  } catch (error) {
    next(error);
  }
};

// Get all Salesforce orgs for the authenticated user
export const getSalesforceOrgs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgs = await storage.getSalesforceOrgsByUserId(req.user!.id);
    res.json(orgs);
  } catch (error) {
    next(error);
  }
};

// Get a specific Salesforce org
export const getSalesforceOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org ID" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    res.json(org);
  } catch (error) {
    next(error);
  }
};

// Sync metadata from Salesforce org
export const syncSalesforceMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org ID" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // In a real implementation, this would be a more complex and asynchronous process
    // For demonstration purposes, we'll simulate a simple sync of object metadata
    
    try {
      // Get objects metadata
      const objectsResponse = await axios.get(
        getApiUrl(org.instanceUrl, "/sobjects"),
        {
          headers: {
            Authorization: `Bearer ${org.accessToken}`,
          },
        }
      );
      
      // Store object metadata
      const objectsData = objectsResponse.data;
      
      for (const sobject of objectsData.sobjects) {
        const metadata: InsertMetadata = {
          orgId,
          type: "object",
          name: sobject.name,
          data: sobject,
        };
        
        await storage.createOrUpdateMetadata(metadata);
      }
      
      // Update last synced time
      await storage.updateSalesforceOrgSyncTime(orgId);
      
      // Generate a sample health score (in a real application, this would be calculated from actual data)
      const healthScore: InsertHealthScore = {
        orgId,
        overallScore: Math.floor(Math.random() * 20) + 80, // 80-100
        securityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        performanceScore: Math.floor(Math.random() * 25) + 75, // 75-100
        codeQualityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        bestPracticesScore: Math.floor(Math.random() * 30) + 70, // 70-100
      };
      
      await storage.createHealthScore(healthScore);
      
      // Create some sample issues (in a real application, these would be detected through analysis)
      const issues = [
        {
          orgId,
          title: "Sharing Model Configuration Risk",
          description: "External sharing model is set to Public Read/Write for Accounts. This may expose sensitive data.",
          severity: "critical",
          type: "security",
          status: "open",
          relatedMetadata: { objectName: "Account", sharingModel: "PublicReadWrite" },
        },
        {
          orgId,
          title: "SOQL Query Optimization Needed",
          description: "Found SOQL queries without proper filtering that may cause performance issues.",
          severity: "warning",
          type: "performance",
          status: "open",
          relatedMetadata: { affectedClasses: ["AccountController", "OpportunityService"] },
        },
      ];
      
      for (const issue of issues) {
        await storage.createIssue(issue as InsertIssue);
      }
      
      res.json({ success: true, message: "Sync completed successfully" });
    } catch (error: any) {
      console.error("Salesforce API error:", error.response?.data || error.message);
      return res.status(500).json({ message: "Failed to sync metadata from Salesforce" });
    }
  } catch (error) {
    next(error);
  }
};

// Execute a SOQL query
export const executeSoqlQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    const { query } = req.body;
    
    if (isNaN(orgId) || !query) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      // Execute SOQL query
      const response = await axios.get(
        getApiUrl(org.instanceUrl, `/query?q=${encodeURIComponent(query)}`),
        {
          headers: {
            Authorization: `Bearer ${org.accessToken}`,
          },
        }
      );
      
      res.json(response.data);
    } catch (error: any) {
      console.error("SOQL query error:", error.response?.data || error.message);
      return res.status(400).json({ 
        message: "Failed to execute SOQL query",
        error: error.response?.data || { message: error.message }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Save a SOQL query
export const saveSoqlQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    const { name, query } = req.body;
    
    if (isNaN(orgId) || !name || !query) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const savedQuery = await storage.createSavedQuery({
      userId: req.user!.id,
      orgId,
      name,
      query,
    });
    
    res.status(201).json(savedQuery);
  } catch (error) {
    next(error);
  }
};

// Get saved SOQL queries
export const getSavedQueries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org ID" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const savedQueries = await storage.getSavedQueriesByOrgId(orgId);
    res.json(savedQueries);
  } catch (error) {
    next(error);
  }
};

// Get metadata for an org
export const getMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    const type = req.query.type as string;
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org ID" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const filter = type ? { type } : undefined;
    const metadata = await storage.getMetadataByOrgId(orgId, filter);
    
    res.json(metadata);
  } catch (error) {
    next(error);
  }
};

// Get health scores for an org
export const getHealthScores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org ID" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const latestHealthScore = await storage.getLatestHealthScoreByOrgId(orgId);
    
    if (!latestHealthScore) {
      return res.status(404).json({ message: "No health score available" });
    }
    
    res.json(latestHealthScore);
  } catch (error) {
    next(error);
  }
};

// Get issues for an org
export const getIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orgId = parseInt(req.params.id);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid org ID" });
    }
    
    const org = await storage.getSalesforceOrg(orgId);
    
    if (!org) {
      return res.status(404).json({ message: "Org not found" });
    }
    
    if (org.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const issues = await storage.getIssuesByOrgId(orgId);
    res.json(issues);
  } catch (error) {
    next(error);
  }
};

// Update issue status
export const updateIssueStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const issueId = parseInt(req.params.issueId);
    const { status } = req.body;
    
    if (isNaN(issueId) || !status) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    
    if (!["open", "ignored", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    const issue = await storage.getIssue(issueId);
    
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    
    const org = await storage.getSalesforceOrg(issue.orgId);
    
    if (org?.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const updatedIssue = await storage.updateIssueStatus(issueId, status);
    
    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
};
