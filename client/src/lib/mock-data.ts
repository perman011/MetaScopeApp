/**
 * Mock metadata for Salesforce objects for development and testing
 * This allows the application to run without an active Salesforce connection
 */

export const mockSalesforceMetadata = {
  objects: [
    {
      name: 'Account',
      label: 'Account',
      fields: [
        { name: 'Id', label: 'Account ID', type: 'id' },
        { name: 'Name', label: 'Account Name', type: 'string' },
        { name: 'Type', label: 'Account Type', type: 'picklist' },
        { name: 'Industry', label: 'Industry', type: 'picklist' },
        { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency' },
        { name: 'Phone', label: 'Phone', type: 'phone' },
        { name: 'Website', label: 'Website', type: 'url' },
        { name: 'Description', label: 'Description', type: 'textarea' },
        { name: 'BillingStreet', label: 'Billing Street', type: 'textarea' },
        { name: 'BillingCity', label: 'Billing City', type: 'string' },
        { name: 'BillingState', label: 'Billing State/Province', type: 'string' },
        { name: 'BillingPostalCode', label: 'Billing Zip/Postal Code', type: 'string' },
        { name: 'BillingCountry', label: 'Billing Country', type: 'string' },
        { name: 'ShippingStreet', label: 'Shipping Street', type: 'textarea' },
        { name: 'ShippingCity', label: 'Shipping City', type: 'string' },
        { name: 'ShippingState', label: 'Shipping State/Province', type: 'string' },
        { name: 'ShippingPostalCode', label: 'Shipping Zip/Postal Code', type: 'string' },
        { name: 'ShippingCountry', label: 'Shipping Country', type: 'string' },
        { name: 'OwnerId', label: 'Owner ID', type: 'reference', referenceTo: ['User'], relationshipName: 'Owner' },
        { name: 'IsDeleted', label: 'Deleted', type: 'boolean' },
        { name: 'CreatedDate', label: 'Created Date', type: 'datetime' },
        { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime' },
      ],
      childRelationships: [
        { childSObject: 'Contact', field: 'AccountId', relationshipName: 'Contacts' },
        { childSObject: 'Opportunity', field: 'AccountId', relationshipName: 'Opportunities' },
        { childSObject: 'Case', field: 'AccountId', relationshipName: 'Cases' },
      ]
    },
    {
      name: 'Contact',
      label: 'Contact',
      fields: [
        { name: 'Id', label: 'Contact ID', type: 'id' },
        { name: 'FirstName', label: 'First Name', type: 'string' },
        { name: 'LastName', label: 'Last Name', type: 'string' },
        { name: 'Email', label: 'Email', type: 'email' },
        { name: 'Phone', label: 'Phone', type: 'phone' },
        { name: 'Title', label: 'Title', type: 'string' },
        { name: 'Department', label: 'Department', type: 'string' },
        { name: 'AccountId', label: 'Account ID', type: 'reference', referenceTo: ['Account'], relationshipName: 'Account' },
        { name: 'MailingStreet', label: 'Mailing Street', type: 'textarea' },
        { name: 'MailingCity', label: 'Mailing City', type: 'string' },
        { name: 'MailingState', label: 'Mailing State/Province', type: 'string' },
        { name: 'MailingPostalCode', label: 'Mailing Zip/Postal Code', type: 'string' },
        { name: 'MailingCountry', label: 'Mailing Country', type: 'string' },
        { name: 'OwnerId', label: 'Owner ID', type: 'reference', referenceTo: ['User'], relationshipName: 'Owner' },
        { name: 'IsDeleted', label: 'Deleted', type: 'boolean' },
        { name: 'CreatedDate', label: 'Created Date', type: 'datetime' },
        { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime' },
      ],
      childRelationships: [
        { childSObject: 'Case', field: 'ContactId', relationshipName: 'Cases' },
      ]
    },
    {
      name: 'Opportunity',
      label: 'Opportunity',
      fields: [
        { name: 'Id', label: 'Opportunity ID', type: 'id' },
        { name: 'Name', label: 'Opportunity Name', type: 'string' },
        { name: 'StageName', label: 'Stage', type: 'picklist' },
        { name: 'Amount', label: 'Amount', type: 'currency' },
        { name: 'CloseDate', label: 'Close Date', type: 'date' },
        { name: 'Type', label: 'Type', type: 'picklist' },
        { name: 'Probability', label: 'Probability (%)', type: 'percent' },
        { name: 'AccountId', label: 'Account ID', type: 'reference', referenceTo: ['Account'], relationshipName: 'Account' },
        { name: 'OwnerId', label: 'Owner ID', type: 'reference', referenceTo: ['User'], relationshipName: 'Owner' },
        { name: 'IsDeleted', label: 'Deleted', type: 'boolean' },
        { name: 'CreatedDate', label: 'Created Date', type: 'datetime' },
        { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime' },
      ],
      childRelationships: [
        { childSObject: 'OpportunityLineItem', field: 'OpportunityId', relationshipName: 'OpportunityLineItems' },
      ]
    },
    {
      name: 'Case',
      label: 'Case',
      fields: [
        { name: 'Id', label: 'Case ID', type: 'id' },
        { name: 'CaseNumber', label: 'Case Number', type: 'string' },
        { name: 'Subject', label: 'Subject', type: 'string' },
        { name: 'Description', label: 'Description', type: 'textarea' },
        { name: 'Status', label: 'Status', type: 'picklist' },
        { name: 'Priority', label: 'Priority', type: 'picklist' },
        { name: 'AccountId', label: 'Account ID', type: 'reference', referenceTo: ['Account'], relationshipName: 'Account' },
        { name: 'ContactId', label: 'Contact ID', type: 'reference', referenceTo: ['Contact'], relationshipName: 'Contact' },
        { name: 'OwnerId', label: 'Owner ID', type: 'reference', referenceTo: ['User', 'Group'], relationshipName: 'Owner' },
        { name: 'IsDeleted', label: 'Deleted', type: 'boolean' },
        { name: 'CreatedDate', label: 'Created Date', type: 'datetime' },
        { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime' },
      ],
      childRelationships: []
    },
    {
      name: 'OpportunityLineItem',
      label: 'Opportunity Product',
      fields: [
        { name: 'Id', label: 'Line Item ID', type: 'id' },
        { name: 'Name', label: 'Line Item Name', type: 'string' },
        { name: 'OpportunityId', label: 'Opportunity ID', type: 'reference', referenceTo: ['Opportunity'], relationshipName: 'Opportunity' },
        { name: 'PricebookEntryId', label: 'Price Book Entry ID', type: 'reference', referenceTo: ['PricebookEntry'] },
        { name: 'Quantity', label: 'Quantity', type: 'double' },
        { name: 'UnitPrice', label: 'Unit Price', type: 'currency' },
        { name: 'TotalPrice', label: 'Total Price', type: 'currency' },
        { name: 'IsDeleted', label: 'Deleted', type: 'boolean' },
        { name: 'CreatedDate', label: 'Created Date', type: 'datetime' },
        { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime' },
      ],
      childRelationships: []
    },
    {
      name: 'User',
      label: 'User',
      fields: [
        { name: 'Id', label: 'User ID', type: 'id' },
        { name: 'Username', label: 'Username', type: 'string' },
        { name: 'FirstName', label: 'First Name', type: 'string' },
        { name: 'LastName', label: 'Last Name', type: 'string' },
        { name: 'Email', label: 'Email', type: 'email' },
        { name: 'Phone', label: 'Phone', type: 'phone' },
        { name: 'IsActive', label: 'Active', type: 'boolean' },
        { name: 'CreatedDate', label: 'Created Date', type: 'datetime' },
        { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime' },
      ],
      childRelationships: []
    },
  ],
  
  // SOQL operators
  operators: [
    { value: '=', label: 'Equals', forTypes: ['*'] },
    { value: '!=', label: 'Not Equals', forTypes: ['*'] },
    { value: '>', label: 'Greater Than', forTypes: ['number', 'date', 'datetime'] },
    { value: '<', label: 'Less Than', forTypes: ['number', 'date', 'datetime'] },
    { value: '>=', label: 'Greater Than or Equal', forTypes: ['number', 'date', 'datetime'] },
    { value: '<=', label: 'Less Than or Equal', forTypes: ['number', 'date', 'datetime'] },
    { value: 'LIKE', label: 'Like', forTypes: ['string'] },
    { value: 'IN', label: 'In', forTypes: ['*'] },
    { value: 'NOT IN', label: 'Not In', forTypes: ['*'] },
    { value: 'INCLUDES', label: 'Includes', forTypes: ['multipicklist'] },
    { value: 'EXCLUDES', label: 'Excludes', forTypes: ['multipicklist'] },
  ],
};

// Mock response for salesforce object schema
export const mockObjectSchema = {
  fields: [
    { name: 'Id', label: 'Account ID', type: 'id' },
    { name: 'Name', label: 'Account Name', type: 'string' },
    { name: 'Type', label: 'Account Type', type: 'picklist' },
    { name: 'Industry', label: 'Industry', type: 'picklist' },
    { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency' },
    { name: 'Phone', label: 'Phone', type: 'phone' },
    { name: 'Website', label: 'Website', type: 'url' },
  ],
  childRelationships: [
    { childSObject: 'Contact', field: 'AccountId', relationshipName: 'Contacts' },
    { childSObject: 'Opportunity', field: 'AccountId', relationshipName: 'Opportunities' },
    { childSObject: 'Case', field: 'AccountId', relationshipName: 'Cases' },
  ]
};

// Mock response for SOQL query execution
export const mockQueryResults = [
  {
    Id: '001xx000003DGbIAAW',
    Name: 'Acme Inc.',
    Industry: 'Technology',
    Type: 'Customer',
    Website: 'https://acme.com',
    Contacts: {
      records: [
        { Id: '003xx000005DGdRAAW', FirstName: 'John', LastName: 'Smith', Email: 'john.smith@example.com' },
        { Id: '003xx000005DGdSAAW', FirstName: 'Jane', LastName: 'Doe', Email: 'jane.doe@example.com' },
      ]
    }
  },
  {
    Id: '001xx000003DGbJAAW',
    Name: 'Universal Services',
    Industry: 'Healthcare',
    Type: 'Customer',
    Website: 'https://universal.org',
    Contacts: {
      records: [
        { Id: '003xx000005DGdTAAW', FirstName: 'Robert', LastName: 'Johnson', Email: 'robert.johnson@example.com' },
      ]
    }
  },
  {
    Id: '001xx000003DGbKAAW',
    Name: 'Global Systems',
    Industry: 'Manufacturing',
    Type: 'Prospect',
    Website: 'https://globalsys.net',
    Contacts: {
      records: []
    }
  },
];