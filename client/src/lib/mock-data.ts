/**
 * Mock Salesforce metadata for development and testing
 * This provides consistent test data without requiring a Salesforce connection
 */

export const mockSalesforceMetadata = {
  objects: [
    {
      name: 'Account',
      label: 'Account',
      apiName: 'Account',
      custom: false,
      fields: [
        { name: 'Id', label: 'Account ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Account Name', type: 'string', required: true, unique: false },
        { name: 'Type', label: 'Account Type', type: 'picklist', required: false, unique: false },
        { name: 'Industry', label: 'Industry', type: 'picklist', required: false, unique: false },
        { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency', required: false, unique: false },
        { name: 'Website', label: 'Website', type: 'url', required: false, unique: false },
        { name: 'Phone', label: 'Phone', type: 'phone', required: false, unique: false },
        { name: 'BillingAddress', label: 'Billing Address', type: 'address', required: false, unique: false },
        { name: 'ShippingAddress', label: 'Shipping Address', type: 'address', required: false, unique: false },
        { name: 'ParentId', label: 'Parent Account', type: 'reference', required: false, unique: false, referenceTo: 'Account', relationshipName: 'Parent' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Contacts', field: 'AccountId', object: 'Contact', type: 'Master-Detail' },
        { name: 'Opportunities', field: 'AccountId', object: 'Opportunity', type: 'Master-Detail' },
        { name: 'Cases', field: 'AccountId', object: 'Case', type: 'Master-Detail' },
        { name: 'Parent', field: 'ParentId', object: 'Account', type: 'Self-Join' },
      ]
    },
    {
      name: 'Contact',
      label: 'Contact',
      apiName: 'Contact',
      custom: false,
      fields: [
        { name: 'Id', label: 'Contact ID', type: 'id', required: true, unique: true },
        { name: 'FirstName', label: 'First Name', type: 'string', required: false, unique: false },
        { name: 'LastName', label: 'Last Name', type: 'string', required: true, unique: false },
        { name: 'Email', label: 'Email', type: 'email', required: false, unique: false },
        { name: 'Phone', label: 'Phone', type: 'phone', required: false, unique: false },
        { name: 'Title', label: 'Title', type: 'string', required: false, unique: false },
        { name: 'Department', label: 'Department', type: 'string', required: false, unique: false },
        { name: 'AccountId', label: 'Account', type: 'reference', required: false, unique: false, referenceTo: 'Account', relationshipName: 'Account' },
        { name: 'ReportsToId', label: 'Reports To', type: 'reference', required: false, unique: false, referenceTo: 'Contact', relationshipName: 'ReportsTo' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Account', field: 'AccountId', object: 'Account', type: 'Lookup' },
        { name: 'ReportsTo', field: 'ReportsToId', object: 'Contact', type: 'Self-Join' },
        { name: 'Cases', field: 'ContactId', object: 'Case', type: 'Master-Detail' },
      ]
    },
    {
      name: 'Opportunity',
      label: 'Opportunity',
      apiName: 'Opportunity',
      custom: false,
      fields: [
        { name: 'Id', label: 'Opportunity ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Opportunity Name', type: 'string', required: true, unique: false },
        { name: 'StageName', label: 'Stage', type: 'picklist', required: true, unique: false },
        { name: 'Amount', label: 'Amount', type: 'currency', required: false, unique: false },
        { name: 'CloseDate', label: 'Close Date', type: 'date', required: true, unique: false },
        { name: 'Type', label: 'Type', type: 'picklist', required: false, unique: false },
        { name: 'AccountId', label: 'Account', type: 'reference', required: false, unique: false, referenceTo: 'Account', relationshipName: 'Account' },
        { name: 'ContactId', label: 'Primary Contact', type: 'reference', required: false, unique: false, referenceTo: 'Contact', relationshipName: 'Contact' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Account', field: 'AccountId', object: 'Account', type: 'Lookup' },
        { name: 'Contact', field: 'ContactId', object: 'Contact', type: 'Lookup' },
        { name: 'OpportunityLineItems', field: 'OpportunityId', object: 'OpportunityLineItem', type: 'Master-Detail' },
      ]
    },
    {
      name: 'Case',
      label: 'Case',
      apiName: 'Case',
      custom: false,
      fields: [
        { name: 'Id', label: 'Case ID', type: 'id', required: true, unique: true },
        { name: 'CaseNumber', label: 'Case Number', type: 'auto', required: true, unique: true },
        { name: 'Subject', label: 'Subject', type: 'string', required: true, unique: false },
        { name: 'Description', label: 'Description', type: 'textarea', required: false, unique: false },
        { name: 'Status', label: 'Status', type: 'picklist', required: true, unique: false },
        { name: 'Priority', label: 'Priority', type: 'picklist', required: true, unique: false },
        { name: 'Origin', label: 'Origin', type: 'picklist', required: false, unique: false },
        { name: 'AccountId', label: 'Account', type: 'reference', required: false, unique: false, referenceTo: 'Account', relationshipName: 'Account' },
        { name: 'ContactId', label: 'Contact', type: 'reference', required: false, unique: false, referenceTo: 'Contact', relationshipName: 'Contact' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Account', field: 'AccountId', object: 'Account', type: 'Lookup' },
        { name: 'Contact', field: 'ContactId', object: 'Contact', type: 'Lookup' },
      ]
    },
    {
      name: 'Product2',
      label: 'Product',
      apiName: 'Product2',
      custom: false,
      fields: [
        { name: 'Id', label: 'Product ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Product Name', type: 'string', required: true, unique: false },
        { name: 'ProductCode', label: 'Product Code', type: 'string', required: false, unique: false },
        { name: 'Description', label: 'Product Description', type: 'textarea', required: false, unique: false },
        { name: 'IsActive', label: 'Active', type: 'boolean', required: true, unique: false },
        { name: 'Family', label: 'Product Family', type: 'picklist', required: false, unique: false },
      ],
      relationships: [
        { name: 'PricebookEntries', field: 'Product2Id', object: 'PricebookEntry', type: 'Master-Detail' },
      ]
    },
    {
      name: 'OpportunityLineItem',
      label: 'Opportunity Product',
      apiName: 'OpportunityLineItem',
      custom: false,
      fields: [
        { name: 'Id', label: 'Line Item ID', type: 'id', required: true, unique: true },
        { name: 'OpportunityId', label: 'Opportunity', type: 'reference', required: true, unique: false, referenceTo: 'Opportunity', relationshipName: 'Opportunity' },
        { name: 'PricebookEntryId', label: 'Price Book Entry', type: 'reference', required: true, unique: false, referenceTo: 'PricebookEntry', relationshipName: 'PricebookEntry' },
        { name: 'Quantity', label: 'Quantity', type: 'number', required: true, unique: false },
        { name: 'UnitPrice', label: 'Sales Price', type: 'currency', required: true, unique: false },
        { name: 'TotalPrice', label: 'Total Price', type: 'currency', required: true, unique: false },
      ],
      relationships: [
        { name: 'Opportunity', field: 'OpportunityId', object: 'Opportunity', type: 'Lookup' },
        { name: 'PricebookEntry', field: 'PricebookEntryId', object: 'PricebookEntry', type: 'Lookup' },
      ]
    },
    {
      name: 'PricebookEntry',
      label: 'Price Book Entry',
      apiName: 'PricebookEntry',
      custom: false,
      fields: [
        { name: 'Id', label: 'Price Book Entry ID', type: 'id', required: true, unique: true },
        { name: 'Pricebook2Id', label: 'Price Book', type: 'reference', required: true, unique: false, referenceTo: 'Pricebook2', relationshipName: 'Pricebook2' },
        { name: 'Product2Id', label: 'Product', type: 'reference', required: true, unique: false, referenceTo: 'Product2', relationshipName: 'Product2' },
        { name: 'UnitPrice', label: 'List Price', type: 'currency', required: true, unique: false },
        { name: 'IsActive', label: 'Active', type: 'boolean', required: true, unique: false },
      ],
      relationships: [
        { name: 'Pricebook2', field: 'Pricebook2Id', object: 'Pricebook2', type: 'Lookup' },
        { name: 'Product2', field: 'Product2Id', object: 'Product2', type: 'Lookup' },
      ]
    },
    {
      name: 'Pricebook2',
      label: 'Price Book',
      apiName: 'Pricebook2',
      custom: false,
      fields: [
        { name: 'Id', label: 'Price Book ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Price Book Name', type: 'string', required: true, unique: false },
        { name: 'Description', label: 'Description', type: 'textarea', required: false, unique: false },
        { name: 'IsActive', label: 'Active', type: 'boolean', required: true, unique: false },
        { name: 'IsStandard', label: 'Is Standard Price Book', type: 'boolean', required: true, unique: false },
      ],
      relationships: [
        { name: 'PricebookEntries', field: 'Pricebook2Id', object: 'PricebookEntry', type: 'Master-Detail' },
      ]
    },
    {
      name: 'Campaign',
      label: 'Campaign',
      apiName: 'Campaign',
      custom: false,
      fields: [
        { name: 'Id', label: 'Campaign ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Campaign Name', type: 'string', required: true, unique: false },
        { name: 'Type', label: 'Type', type: 'picklist', required: false, unique: false },
        { name: 'Status', label: 'Status', type: 'picklist', required: false, unique: false },
        { name: 'StartDate', label: 'Start Date', type: 'date', required: false, unique: false },
        { name: 'EndDate', label: 'End Date', type: 'date', required: false, unique: false },
        { name: 'BudgetedCost', label: 'Budgeted Cost', type: 'currency', required: false, unique: false },
        { name: 'ActualCost', label: 'Actual Cost', type: 'currency', required: false, unique: false },
        { name: 'ParentId', label: 'Parent Campaign', type: 'reference', required: false, unique: false, referenceTo: 'Campaign', relationshipName: 'Parent' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'CampaignMembers', field: 'CampaignId', object: 'CampaignMember', type: 'Master-Detail' },
        { name: 'Parent', field: 'ParentId', object: 'Campaign', type: 'Self-Join' },
      ]
    },
    {
      name: 'CampaignMember',
      label: 'Campaign Member',
      apiName: 'CampaignMember',
      custom: false,
      fields: [
        { name: 'Id', label: 'Campaign Member ID', type: 'id', required: true, unique: true },
        { name: 'CampaignId', label: 'Campaign', type: 'reference', required: true, unique: false, referenceTo: 'Campaign', relationshipName: 'Campaign' },
        { name: 'LeadId', label: 'Lead', type: 'reference', required: false, unique: false, referenceTo: 'Lead', relationshipName: 'Lead' },
        { name: 'ContactId', label: 'Contact', type: 'reference', required: false, unique: false, referenceTo: 'Contact', relationshipName: 'Contact' },
        { name: 'Status', label: 'Status', type: 'picklist', required: false, unique: false },
      ],
      relationships: [
        { name: 'Campaign', field: 'CampaignId', object: 'Campaign', type: 'Lookup' },
        { name: 'Lead', field: 'LeadId', object: 'Lead', type: 'Lookup' },
        { name: 'Contact', field: 'ContactId', object: 'Contact', type: 'Lookup' },
      ]
    },
    {
      name: 'Lead',
      label: 'Lead',
      apiName: 'Lead',
      custom: false,
      fields: [
        { name: 'Id', label: 'Lead ID', type: 'id', required: true, unique: true },
        { name: 'FirstName', label: 'First Name', type: 'string', required: false, unique: false },
        { name: 'LastName', label: 'Last Name', type: 'string', required: true, unique: false },
        { name: 'Company', label: 'Company', type: 'string', required: true, unique: false },
        { name: 'Email', label: 'Email', type: 'email', required: false, unique: false },
        { name: 'Phone', label: 'Phone', type: 'phone', required: false, unique: false },
        { name: 'Status', label: 'Lead Status', type: 'picklist', required: true, unique: false },
        { name: 'Industry', label: 'Industry', type: 'picklist', required: false, unique: false },
        { name: 'Rating', label: 'Rating', type: 'picklist', required: false, unique: false },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'CampaignMembers', field: 'LeadId', object: 'CampaignMember', type: 'Master-Detail' },
      ]
    },
    {
      name: 'User',
      label: 'User',
      apiName: 'User',
      custom: false,
      fields: [
        { name: 'Id', label: 'User ID', type: 'id', required: true, unique: true },
        { name: 'Username', label: 'Username', type: 'string', required: true, unique: true },
        { name: 'Email', label: 'Email', type: 'email', required: true, unique: true },
        { name: 'FirstName', label: 'First Name', type: 'string', required: false, unique: false },
        { name: 'LastName', label: 'Last Name', type: 'string', required: true, unique: false },
        { name: 'IsActive', label: 'Active', type: 'boolean', required: true, unique: false },
        { name: 'ProfileId', label: 'Profile', type: 'reference', required: true, unique: false, referenceTo: 'Profile', relationshipName: 'Profile' },
        { name: 'ManagerId', label: 'Manager', type: 'reference', required: false, unique: false, referenceTo: 'User', relationshipName: 'Manager' },
      ],
      relationships: [
        { name: 'ManagedUsers', field: 'ManagerId', object: 'User', type: 'Self-Join' },
        { name: 'Profile', field: 'ProfileId', object: 'Profile', type: 'Lookup' },
      ]
    },
    {
      name: 'Profile',
      label: 'Profile',
      apiName: 'Profile',
      custom: false,
      fields: [
        { name: 'Id', label: 'Profile ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Profile Name', type: 'string', required: true, unique: true },
        { name: 'Description', label: 'Description', type: 'textarea', required: false, unique: false },
      ],
      relationships: [
        { name: 'Users', field: 'ProfileId', object: 'User', type: 'Master-Detail' },
      ]
    },
    // Custom objects
    {
      name: 'Project__c',
      label: 'Project',
      apiName: 'Project__c',
      custom: true,
      fields: [
        { name: 'Id', label: 'Project ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Project Name', type: 'string', required: true, unique: false },
        { name: 'Description__c', label: 'Description', type: 'textarea', required: false, unique: false },
        { name: 'Status__c', label: 'Status', type: 'picklist', required: true, unique: false },
        { name: 'Start_Date__c', label: 'Start Date', type: 'date', required: true, unique: false },
        { name: 'End_Date__c', label: 'End Date', type: 'date', required: false, unique: false },
        { name: 'Budget__c', label: 'Budget', type: 'currency', required: false, unique: false },
        { name: 'Account__c', label: 'Account', type: 'reference', required: false, unique: false, referenceTo: 'Account', relationshipName: 'Account__r' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Tasks', field: 'Project__c', object: 'Project_Task__c', type: 'Master-Detail' },
        { name: 'Account__r', field: 'Account__c', object: 'Account', type: 'Lookup' },
      ]
    },
    {
      name: 'Project_Task__c',
      label: 'Project Task',
      apiName: 'Project_Task__c',
      custom: true,
      fields: [
        { name: 'Id', label: 'Task ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Task Name', type: 'string', required: true, unique: false },
        { name: 'Description__c', label: 'Description', type: 'textarea', required: false, unique: false },
        { name: 'Status__c', label: 'Status', type: 'picklist', required: true, unique: false },
        { name: 'Due_Date__c', label: 'Due Date', type: 'date', required: true, unique: false },
        { name: 'Priority__c', label: 'Priority', type: 'picklist', required: true, unique: false },
        { name: 'Project__c', label: 'Project', type: 'reference', required: true, unique: false, referenceTo: 'Project__c', relationshipName: 'Project__r' },
        { name: 'Assigned_To__c', label: 'Assigned To', type: 'reference', required: false, unique: false, referenceTo: 'User', relationshipName: 'Assigned_To__r' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Project__r', field: 'Project__c', object: 'Project__c', type: 'Lookup' },
        { name: 'Assigned_To__r', field: 'Assigned_To__c', object: 'User', type: 'Lookup' },
      ]
    },
    {
      name: 'Customer_Feedback__c',
      label: 'Customer Feedback',
      apiName: 'Customer_Feedback__c',
      custom: true,
      fields: [
        { name: 'Id', label: 'Feedback ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Feedback Name', type: 'auto', required: true, unique: true },
        { name: 'Feedback_Text__c', label: 'Feedback', type: 'textarea', required: true, unique: false },
        { name: 'Rating__c', label: 'Rating', type: 'number', required: true, unique: false },
        { name: 'Category__c', label: 'Category', type: 'picklist', required: false, unique: false },
        { name: 'Date_Received__c', label: 'Date Received', type: 'datetime', required: true, unique: false },
        { name: 'Account__c', label: 'Account', type: 'reference', required: false, unique: false, referenceTo: 'Account', relationshipName: 'Account__r' },
        { name: 'Contact__c', label: 'Contact', type: 'reference', required: false, unique: false, referenceTo: 'Contact', relationshipName: 'Contact__r' },
        { name: 'Product__c', label: 'Product', type: 'reference', required: false, unique: false, referenceTo: 'Product2', relationshipName: 'Product__r' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Account__r', field: 'Account__c', object: 'Account', type: 'Lookup' },
        { name: 'Contact__r', field: 'Contact__c', object: 'Contact', type: 'Lookup' },
        { name: 'Product__r', field: 'Product__c', object: 'Product2', type: 'Lookup' },
      ]
    },
    {
      name: 'Subscription__c',
      label: 'Subscription',
      apiName: 'Subscription__c',
      custom: true,
      fields: [
        { name: 'Id', label: 'Subscription ID', type: 'id', required: true, unique: true },
        { name: 'Name', label: 'Subscription Name', type: 'string', required: true, unique: false },
        { name: 'Status__c', label: 'Status', type: 'picklist', required: true, unique: false },
        { name: 'Start_Date__c', label: 'Start Date', type: 'date', required: true, unique: false },
        { name: 'End_Date__c', label: 'End Date', type: 'date', required: false, unique: false },
        { name: 'Renewal_Date__c', label: 'Renewal Date', type: 'date', required: false, unique: false },
        { name: 'Monthly_Fee__c', label: 'Monthly Fee', type: 'currency', required: true, unique: false },
        { name: 'Billing_Cycle__c', label: 'Billing Cycle', type: 'picklist', required: true, unique: false },
        { name: 'Account__c', label: 'Account', type: 'reference', required: true, unique: false, referenceTo: 'Account', relationshipName: 'Account__r' },
        { name: 'Product__c', label: 'Product', type: 'reference', required: true, unique: false, referenceTo: 'Product2', relationshipName: 'Product__r' },
        { name: 'OwnerId', label: 'Owner', type: 'reference', required: true, unique: false, referenceTo: 'User', relationshipName: 'Owner' },
      ],
      relationships: [
        { name: 'Account__r', field: 'Account__c', object: 'Account', type: 'Lookup' },
        { name: 'Product__r', field: 'Product__c', object: 'Product2', type: 'Lookup' },
      ]
    }
  ]
};

/**
 * Mock Salesforce org for development and testing
 */
export const mockSalesforceOrg = {
  id: 1,
  name: 'Test Salesforce Org',
  instanceUrl: 'https://example.my.salesforce.com',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  environment: 'production',
  userId: 1,
  lastSyncedAt: new Date().toISOString(),
  isSandbox: false
};

/**
 * Mock SOQL query results
 */
export function executeMockSoqlQuery(query: string) {
  console.log('Executing mock SOQL query:', query);
  
  // Strip out any whitespace and convert to lowercase for easier parsing
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Parse the query to determine which object is being queried
  const fromMatch = normalizedQuery.match(/from\s+([a-z0-9_]+)/i);
  if (!fromMatch) {
    return { error: 'Invalid SOQL query: FROM clause is required' };
  }
  
  const objectName = fromMatch[1];
  
  // Generate mock results based on the object
  switch (objectName.toLowerCase()) {
    case 'account':
      return {
        records: [
          { 
            Id: 'a001000000XXXXX', 
            Name: 'Acme Corporation',
            Type: 'Customer - Direct',
            Industry: 'Technology',
            AnnualRevenue: 1500000,
            Website: 'https://www.acme.com',
            Phone: '(555) 123-4567'
          },
          { 
            Id: 'a001000000YYYYY', 
            Name: 'Universal Containers',
            Type: 'Customer - Channel',
            Industry: 'Manufacturing',
            AnnualRevenue: 5000000,
            Website: 'https://www.universalcontainers.com',
            Phone: '(555) 987-6543'
          },
          { 
            Id: 'a001000000ZZZZZ', 
            Name: 'Salesforce Inc.',
            Type: 'Partner',
            Industry: 'Technology',
            AnnualRevenue: 15000000000,
            Website: 'https://www.salesforce.com',
            Phone: '(415) 901-7000'
          }
        ],
        totalSize: 3,
        done: true
      };
      
    case 'contact':
      return {
        records: [
          {
            Id: 'c001000000AAAAA',
            FirstName: 'John',
            LastName: 'Smith',
            Email: 'john.smith@acme.com',
            Phone: '(555) 111-2222',
            Title: 'VP of Engineering',
            Department: 'Engineering',
            Account: { Name: 'Acme Corporation', Id: 'a001000000XXXXX' }
          },
          {
            Id: 'c001000000BBBBB',
            FirstName: 'Sarah',
            LastName: 'Jones',
            Email: 'sarah.jones@universalcontainers.com',
            Phone: '(555) 333-4444',
            Title: 'Director of Sales',
            Department: 'Sales',
            Account: { Name: 'Universal Containers', Id: 'a001000000YYYYY' }
          },
          {
            Id: 'c001000000CCCCC',
            FirstName: 'David',
            LastName: 'Wilson',
            Email: 'david.wilson@salesforce.com',
            Phone: '(555) 555-6666',
            Title: 'Solution Engineer',
            Department: 'Pre-Sales',
            Account: { Name: 'Salesforce Inc.', Id: 'a001000000ZZZZZ' }
          }
        ],
        totalSize: 3,
        done: true
      };
      
    case 'opportunity':
      return {
        records: [
          {
            Id: 'o001000000DDDDD',
            Name: 'New Data Center',
            StageName: 'Proposal',
            Amount: 500000,
            CloseDate: '2023-12-15',
            Type: 'New Business',
            Account: { Name: 'Acme Corporation', Id: 'a001000000XXXXX' }
          },
          {
            Id: 'o001000000EEEEE',
            Name: 'Renewal 2024',
            StageName: 'Closed Won',
            Amount: 250000,
            CloseDate: '2023-10-31',
            Type: 'Renewal',
            Account: { Name: 'Universal Containers', Id: 'a001000000YYYYY' }
          },
          {
            Id: 'o001000000FFFFF',
            Name: 'Cloud Migration',
            StageName: 'Needs Analysis',
            Amount: 750000,
            CloseDate: '2024-03-01',
            Type: 'New Business',
            Account: { Name: 'Salesforce Inc.', Id: 'a001000000ZZZZZ' }
          }
        ],
        totalSize: 3,
        done: true
      };
      
    case 'case':
      return {
        records: [
          {
            Id: 'cas001000000GGGGG',
            CaseNumber: '00001001',
            Subject: 'Server Down',
            Status: 'New',
            Priority: 'High',
            Origin: 'Web',
            Account: { Name: 'Acme Corporation', Id: 'a001000000XXXXX' },
            Contact: { Name: 'John Smith', Id: 'c001000000AAAAA' }
          },
          {
            Id: 'cas001000000HHHHH',
            CaseNumber: '00001002',
            Subject: 'Login Issue',
            Status: 'Working',
            Priority: 'Medium',
            Origin: 'Phone',
            Account: { Name: 'Universal Containers', Id: 'a001000000YYYYY' },
            Contact: { Name: 'Sarah Jones', Id: 'c001000000BBBBB' }
          },
          {
            Id: 'cas001000000IIIII',
            CaseNumber: '00001003',
            Subject: 'API Integration Help',
            Status: 'Closed',
            Priority: 'Low',
            Origin: 'Email',
            Account: { Name: 'Salesforce Inc.', Id: 'a001000000ZZZZZ' },
            Contact: { Name: 'David Wilson', Id: 'c001000000CCCCC' }
          }
        ],
        totalSize: 3,
        done: true
      };
      
    // Add more objects as needed
    
    case 'project__c':
      return {
        records: [
          {
            Id: 'a0E1000000JJJJJ',
            Name: 'Website Redesign',
            Status__c: 'In Progress',
            Start_Date__c: '2023-09-01',
            End_Date__c: '2023-12-31',
            Budget__c: 100000,
            Account__r: { Name: 'Acme Corporation', Id: 'a001000000XXXXX' }
          },
          {
            Id: 'a0E1000000KKKKK',
            Name: 'Mobile App Development',
            Status__c: 'Planning',
            Start_Date__c: '2024-01-15',
            End_Date__c: null,
            Budget__c: 250000,
            Account__r: { Name: 'Universal Containers', Id: 'a001000000YYYYY' }
          },
          {
            Id: 'a0E1000000LLLLL',
            Name: 'Data Migration',
            Status__c: 'Completed',
            Start_Date__c: '2023-06-01',
            End_Date__c: '2023-08-15',
            Budget__c: 75000,
            Account__r: { Name: 'Salesforce Inc.', Id: 'a001000000ZZZZZ' }
          }
        ],
        totalSize: 3,
        done: true
      };
      
    default:
      return {
        records: [],
        totalSize: 0,
        done: true,
        error: `No mock data available for object: ${objectName}`
      };
  }
}