import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';

// Seed advanced data for code quality, dependencies, compliance, and technical debt
export async function seedAdvancedData(orgId: number) {
  console.log(`Seeding advanced data for org ${orgId}...`);
  
  // Get existing metadata to reference
  const metadata = await storage.getOrgMetadata(orgId);
  
  if (metadata.length === 0) {
    console.log('No metadata found. Please fetch metadata first.');
    return;
  }

  // Create component metadata map for reference
  const components: Map<string, { id: number, name: string, type: string }> = new Map();
  
  // Filter for Apex, LWC and VF components
  metadata.forEach(item => {
    if (['ApexClass', 'ApexTrigger', 'LightningComponent', 'VisualForce', 'CustomObject'].includes(item.type)) {
      components.set(item.name, { 
        id: item.id,
        name: item.name,
        type: item.type
      });
    }
  });
  
  const componentArray = Array.from(components.values());
  
  // If there are not enough components, create some sample ones
  if (componentArray.length < 5) {
    console.log('Not enough components found, creating sample components...');
    
    const sampleComponents = [
      { name: 'AccountService', type: 'ApexClass' },
      { name: 'OpportunityTrigger', type: 'ApexTrigger' },
      { name: 'ContactDetail', type: 'LightningComponent' },
      { name: 'ProductCatalog', type: 'VisualForce' },
      { name: 'CustomOrder', type: 'CustomObject' },
      { name: 'LeadProcessor', type: 'ApexClass' },
      { name: 'CaseTrigger', type: 'ApexTrigger' },
      { name: 'DashboardComponent', type: 'LightningComponent' }
    ];
    
    for (const comp of sampleComponents) {
      if (!components.has(comp.name)) {
        const newMetadata = await storage.createMetadata({
          orgId,
          name: comp.name,
          type: comp.type,
          data: JSON.stringify({ name: comp.name, description: `Sample ${comp.type}` })
        });
        
        components.set(comp.name, {
          id: newMetadata.id,
          name: newMetadata.name,
          type: newMetadata.type
        });
      }
    }
  }
  
  // Refresh component array after possible additions
  const updatedComponentArray = Array.from(components.values());
  
  // Seed Code Quality data
  await seedCodeQualityData(orgId, updatedComponentArray);
  
  // Seed Component Dependencies
  await seedDependencyData(orgId, updatedComponentArray);
  
  // Seed Compliance data
  await seedComplianceData(orgId, updatedComponentArray);
  
  // Seed Technical Debt items
  await seedTechnicalDebtData(orgId, updatedComponentArray);
  
  console.log('Advanced data seeding completed!');
}

async function seedCodeQualityData(orgId: number, components: { id: number, name: string, type: string }[]) {
  console.log('Seeding code quality data...');
  
  for (const component of components) {
    // Check if we already have code quality data for this component
    const existing = await storage.getComponentCodeQuality(orgId, component.id);
    
    if (existing) {
      console.log(`Code quality data already exists for ${component.name}`);
      continue;
    }
    
    // Different quality profiles based on component type
    let qualityScore = 0;
    let complexityScore = 0;
    let testCoverage = 0;
    let bestPracticesScore = 0;
    let securityScore = 0;
    let performanceScore = 0;
    let issuesCount = 0;
    
    const issues = [];
    const ruleViolations = [
      {
        rule: 'AvoidSOQLInLoop',
        description: 'SOQL queries should not be executed inside loops',
        recommendation: 'Move the SOQL query outside the loop and filter results in memory',
        severity: 'high'
      },
      {
        rule: 'MethodTooLong',
        description: 'Method has too many lines',
        recommendation: 'Break the method into smaller methods with specific responsibilities',
        severity: 'medium'
      },
      {
        rule: 'HardcodedId',
        description: 'Hardcoded ID found in code',
        recommendation: 'Use Custom Settings, Custom Labels or Custom Metadata instead of hardcoded IDs',
        severity: 'medium'
      },
      {
        rule: 'UnusedVariable',
        description: 'Variable is declared but never used',
        recommendation: 'Remove unused variables to improve code readability',
        severity: 'low'
      },
      {
        rule: 'InsecureDML',
        description: 'DML operation without sharing context',
        recommendation: 'Ensure proper sharing rules are enforced by using with sharing',
        severity: 'critical'
      }
    ];
    
    // Simulation logic based on component type
    switch (component.type) {
      case 'ApexClass':
        qualityScore = Math.floor(60 + Math.random() * 35);
        complexityScore = Math.floor(50 + Math.random() * 45);
        testCoverage = Math.floor(50 + Math.random() * 50);
        bestPracticesScore = Math.floor(65 + Math.random() * 30);
        securityScore = Math.floor(70 + Math.random() * 30);
        performanceScore = Math.floor(60 + Math.random() * 35);
        
        // Generate some issues
        issuesCount = Math.floor(Math.random() * 4) + (qualityScore < 75 ? 2 : 0);
        for (let i = 0; i < issuesCount; i++) {
          const violation = ruleViolations[Math.floor(Math.random() * ruleViolations.length)];
          const lineNum = Math.floor(Math.random() * 100) + 1;
          
          issues.push({
            id: uuidv4(),
            line: lineNum,
            column: Math.floor(Math.random() * 50) + 1,
            rule: violation.rule,
            severity: violation.severity,
            message: `${violation.rule} - ${violation.description}`,
            description: violation.description,
            recommendation: violation.recommendation,
            codeSnippet: `Line ${lineNum}: public void processData(List<Account> accounts) {\n    for(Account acc : accounts) {\n        List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];\n    }\n}`
          });
        }
        break;
        
      case 'ApexTrigger':
        qualityScore = Math.floor(55 + Math.random() * 35);
        complexityScore = Math.floor(45 + Math.random() * 45);
        testCoverage = Math.floor(45 + Math.random() * 50);
        bestPracticesScore = Math.floor(60 + Math.random() * 30);
        securityScore = Math.floor(65 + Math.random() * 30);
        performanceScore = Math.floor(55 + Math.random() * 30);
        
        // Generate some issues
        issuesCount = Math.floor(Math.random() * 3) + (qualityScore < 70 ? 3 : 1);
        for (let i = 0; i < issuesCount; i++) {
          const violation = ruleViolations[Math.floor(Math.random() * ruleViolations.length)];
          const lineNum = Math.floor(Math.random() * 50) + 1;
          
          issues.push({
            id: uuidv4(),
            line: lineNum,
            column: Math.floor(Math.random() * 40) + 1,
            rule: violation.rule,
            severity: violation.severity,
            message: `${violation.rule} - ${violation.description}`,
            description: violation.description,
            recommendation: violation.recommendation,
            codeSnippet: `Line ${lineNum}: trigger AccountTrigger on Account (before insert) {\n    for(Account acc : Trigger.new) {\n        List<Opportunity> opps = [SELECT Id FROM Opportunity WHERE AccountId = :acc.Id];\n    }\n}`
          });
        }
        break;
        
      case 'LightningComponent':
        qualityScore = Math.floor(65 + Math.random() * 35);
        complexityScore = Math.floor(50 + Math.random() * 40);
        testCoverage = Math.floor(30 + Math.random() * 60);
        bestPracticesScore = Math.floor(70 + Math.random() * 30);
        securityScore = Math.floor(75 + Math.random() * 25);
        performanceScore = Math.floor(65 + Math.random() * 35);
        
        // Generate some issues
        issuesCount = Math.floor(Math.random() * 2) + (qualityScore < 80 ? 1 : 0);
        for (let i = 0; i < issuesCount; i++) {
          const lineNum = Math.floor(Math.random() * 80) + 1;
          
          issues.push({
            id: uuidv4(),
            line: lineNum,
            column: Math.floor(Math.random() * 30) + 1,
            rule: 'DeprecatedAPI',
            severity: 'medium',
            message: 'Using deprecated Lightning API',
            description: 'Component is using a deprecated Lightning API that may be removed in future releases',
            recommendation: 'Update to use the latest API version according to documentation',
            codeSnippet: `Line ${lineNum}: import { LightningElement } from 'lwc';\n\nexport default class ContactForm extends LightningElement {\n    @track formData = {}; // @track is deprecated\n}`
          });
        }
        break;
        
      case 'VisualForce':
        qualityScore = Math.floor(40 + Math.random() * 30);
        complexityScore = Math.floor(35 + Math.random() * 30);
        testCoverage = Math.floor(20 + Math.random() * 30);
        bestPracticesScore = Math.floor(50 + Math.random() * 25);
        securityScore = Math.floor(55 + Math.random() * 30);
        performanceScore = Math.floor(45 + Math.random() * 30);
        
        // Generate some issues
        issuesCount = Math.floor(Math.random() * 3) + (qualityScore < 60 ? 2 : 0);
        for (let i = 0; i < issuesCount; i++) {
          const lineNum = Math.floor(Math.random() * 60) + 1;
          
          issues.push({
            id: uuidv4(),
            line: lineNum,
            column: Math.floor(Math.random() * 20) + 1,
            rule: 'XSSVulnerability',
            severity: 'critical',
            message: 'Potential XSS vulnerability in VF page',
            description: 'Output is not properly escaped, creating a potential cross-site scripting vulnerability',
            recommendation: 'Use the escape=\"true\" attribute or apex:outputText with proper escaping',
            codeSnippet: `Line ${lineNum}: <apex:page controller="MyController">\n    <div>{!unsafeOutput}</div>\n</apex:page>`
          });
        }
        break;
        
      default:
        qualityScore = Math.floor(70 + Math.random() * 30);
        complexityScore = Math.floor(60 + Math.random() * 30);
        testCoverage = Math.floor(50 + Math.random() * 50);
        bestPracticesScore = Math.floor(70 + Math.random() * 30);
        securityScore = Math.floor(75 + Math.random() * 25);
        performanceScore = Math.floor(65 + Math.random() * 35);
        issuesCount = 0;
    }
    
    // Create complexity metrics
    const complexityMetrics = {
      cyclomaticComplexity: Math.floor(1 + Math.random() * 20),
      cognitiveComplexity: Math.floor(1 + Math.random() * 30),
      linesOfCode: Math.floor(50 + Math.random() * 950),
      commentRatio: Math.floor(1 + Math.random() * 30),
      methodCount: Math.floor(1 + Math.random() * 15),
      averageMethodLength: Math.floor(5 + Math.random() * 35),
      nestingDepth: Math.floor(1 + Math.random() * 5),
      duplicatedCode: Math.floor(Math.random() * 20)
    };
    
    // Insert the code quality record
    await storage.createCodeQuality({
      orgId,
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      qualityScore,
      complexityScore,
      testCoverage,
      bestPracticesScore,
      securityScore,
      performanceScore,
      issuesCount,
      issues: JSON.stringify(issues),
      complexityMetrics: JSON.stringify(complexityMetrics)
    });
    
    console.log(`Created code quality data for ${component.name}`);
  }
}

async function seedDependencyData(orgId: number, components: { id: number, name: string, type: string }[]) {
  console.log('Seeding dependency data...');
  
  // Define logical dependency relationships based on component types
  const relationships = [
    { from: 'ApexClass', to: 'ApexClass', strength: ['weak', 'medium', 'strong'] },
    { from: 'ApexClass', to: 'CustomObject', strength: ['medium', 'strong'] },
    { from: 'ApexTrigger', to: 'ApexClass', strength: ['medium', 'strong'] },
    { from: 'ApexTrigger', to: 'CustomObject', strength: ['strong'] },
    { from: 'LightningComponent', to: 'ApexClass', strength: ['medium', 'strong'] },
    { from: 'LightningComponent', to: 'LightningComponent', strength: ['weak', 'medium'] },
    { from: 'VisualForce', to: 'ApexClass', strength: ['medium', 'strong'] },
    { from: 'VisualForce', to: 'CustomObject', strength: ['medium'] }
  ];
  
  // For each component, create some dependencies
  for (const sourceComponent of components) {
    // Find potential target component types based on source type
    const potentialRelationships = relationships.filter(r => r.from === sourceComponent.type);
    
    if (potentialRelationships.length === 0) continue;
    
    // For each potential relationship type
    for (const relationshipType of potentialRelationships) {
      // Find potential target components
      const potentialTargets = components.filter(c => 
        c.type === relationshipType.to && 
        c.id !== sourceComponent.id // Avoid self-dependencies
      );
      
      if (potentialTargets.length === 0) continue;
      
      // Decide how many dependencies to create (1-3)
      const dependencyCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < Math.min(dependencyCount, potentialTargets.length); i++) {
        // Randomly select a target component
        const targetIndex = Math.floor(Math.random() * potentialTargets.length);
        const targetComponent = potentialTargets[targetIndex];
        
        // Remove the selected target to avoid duplicates
        potentialTargets.splice(targetIndex, 1);
        
        // Check if dependency already exists
        const existingDeps = await storage.getComponentDependencies(orgId, sourceComponent.id);
        const dependencyExists = existingDeps.some(dep => 
          dep.sourceComponentId === sourceComponent.id && 
          dep.targetComponentId === targetComponent.id
        );
        
        if (dependencyExists) {
          console.log(`Dependency already exists from ${sourceComponent.name} to ${targetComponent.name}`);
          continue;
        }
        
        // Determine strength
        const strengthOptions = relationshipType.strength;
        const strength = strengthOptions[Math.floor(Math.random() * strengthOptions.length)];
        
        // Create the dependency
        const dependencyType = getDependencyType(sourceComponent.type, targetComponent.type);
        
        await storage.createComponentDependency({
          orgId,
          sourceComponentId: sourceComponent.id,
          sourceComponentName: sourceComponent.name,
          sourceComponentType: sourceComponent.type,
          targetComponentId: targetComponent.id,
          targetComponentName: targetComponent.name,
          targetComponentType: targetComponent.type,
          dependencyType,
          dependencyStrength: strength
        });
        
        console.log(`Created dependency: ${sourceComponent.name} -> ${targetComponent.name} (${strength})`);
      }
    }
  }
}

function getDependencyType(sourceType: string, targetType: string): string {
  if (sourceType === 'ApexClass' && targetType === 'ApexClass') {
    return 'Class Reference';
  } else if (sourceType === 'ApexClass' && targetType === 'CustomObject') {
    return 'Data Access';
  } else if (sourceType === 'ApexTrigger' && targetType === 'ApexClass') {
    return 'Method Call';
  } else if (sourceType === 'ApexTrigger' && targetType === 'CustomObject') {
    return 'Trigger Definition';
  } else if (sourceType === 'LightningComponent' && targetType === 'ApexClass') {
    return 'Controller Reference';
  } else if (sourceType === 'LightningComponent' && targetType === 'LightningComponent') {
    return 'Component Reference';
  } else if (sourceType === 'VisualForce' && targetType === 'ApexClass') {
    return 'Controller Reference';
  } else if (sourceType === 'VisualForce' && targetType === 'CustomObject') {
    return 'Data Binding';
  } else {
    return 'Reference';
  }
}

async function seedComplianceData(orgId: number, components: { id: number, name: string, type: string }[]) {
  console.log('Seeding compliance data...');
  
  // Define compliance frameworks
  const frameworks = [
    { name: 'Salesforce Security', totalRules: 25 },
    { name: 'GDPR Compliance', totalRules: 18 },
    { name: 'HIPAA', totalRules: 22 },
    { name: 'Financial Services Cloud', totalRules: 15 }
  ];
  
  for (const framework of frameworks) {
    // Check if compliance data already exists for this framework
    const existingCompliance = await storage.getOrgCompliance(orgId, framework.name);
    
    if (existingCompliance.length > 0) {
      console.log(`Compliance data already exists for ${framework.name}`);
      continue;
    }
    
    // Generate random compliance scores
    const passedRules = Math.floor(Math.random() * (framework.totalRules * 0.4)) + Math.floor(framework.totalRules * 0.6);
    const score = Math.round((passedRules / framework.totalRules) * 100);
    
    // Generate some violations
    const totalViolations = framework.totalRules - passedRules;
    const violations = [];
    
    const violationTypes = [
      {
        rule: 'Secure Password Policies',
        description: 'Password policies do not meet minimum security requirements',
        impact: 'Increased risk of unauthorized access',
        severity: 'high'
      },
      {
        rule: 'Data Encryption',
        description: 'Sensitive data is not properly encrypted',
        impact: 'Potential data breach risks',
        severity: 'critical'
      },
      {
        rule: 'API Security',
        description: 'API endpoints lack proper authentication',
        impact: 'Vulnerable to unauthorized API access',
        severity: 'high'
      },
      {
        rule: 'Session Management',
        description: 'Session timeout settings are too permissive',
        impact: 'Extended session vulnerabilities',
        severity: 'medium'
      },
      {
        rule: 'Data Retention',
        description: 'No data retention policy is enforced',
        impact: 'Non-compliance with data privacy regulations',
        severity: 'high'
      },
      {
        rule: 'Audit Logging',
        description: 'Insufficient audit logging for sensitive operations',
        impact: 'Inability to track security incidents',
        severity: 'medium'
      }
    ];
    
    for (let i = 0; i < totalViolations; i++) {
      const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
      const randomComponent = components[Math.floor(Math.random() * components.length)];
      
      violations.push({
        id: uuidv4(),
        rule: violationType.rule,
        description: violationType.description,
        severity: violationType.severity,
        componentType: randomComponent.type,
        componentName: randomComponent.name,
        details: `Violation found in ${randomComponent.name}: ${violationType.description}`,
        recommendation: `Implement proper ${violationType.rule.toLowerCase()} according to best practices`,
        impact: violationType.impact
      });
    }
    
    // Create the compliance record
    await storage.createCompliance({
      orgId,
      frameworkName: framework.name,
      complianceScore: score,
      passedRules,
      totalRules: framework.totalRules,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      highViolations: violations.filter(v => v.severity === 'high').length,
      mediumViolations: violations.filter(v => v.severity === 'medium').length,
      lowViolations: violations.filter(v => v.severity === 'low').length,
      violations: JSON.stringify(violations),
      lastScanned: new Date().toISOString()
    });
    
    console.log(`Created compliance data for ${framework.name} with score ${score}%`);
  }
}

async function seedTechnicalDebtData(orgId: number, components: { id: number, name: string, type: string }[]) {
  console.log('Seeding technical debt data...');
  
  // Define technical debt categories
  const debtCategories = [
    'Legacy Code',
    'Technical Implementation',
    'Documentation',
    'Testing',
    'Architecture',
    'Performance'
  ];
  
  // Define debt status options
  const statusOptions = [
    'Identified',
    'Analyzed',
    'Prioritized',
    'In Progress',
    'Completed',
    'Deferred'
  ];
  
  // Define debt items by category
  const debtItemsByCategory = {
    'Legacy Code': [
      {
        title: 'Deprecated API Usage',
        description: 'Using deprecated Salesforce APIs that may be removed in future releases',
        impact: 'High risk of breaking functionality in future org upgrades',
        remediationTime: 16
      },
      {
        title: 'Outdated Trigger Framework',
        description: 'Using an old trigger framework without proper bulkification',
        impact: 'Performance issues with large data volumes',
        remediationTime: 24
      }
    ],
    'Technical Implementation': [
      {
        title: 'Hardcoded IDs',
        description: 'Multiple instances of hardcoded record IDs in Apex code',
        impact: 'Breaks during deployment between environments',
        remediationTime: 8
      },
      {
        title: 'Redundant Code',
        description: 'Duplicate business logic implemented across multiple classes',
        impact: 'Maintenance overhead and inconsistent behavior',
        remediationTime: 20
      }
    ],
    'Documentation': [
      {
        title: 'Missing Code Documentation',
        description: 'Apex classes lack proper documentation and comments',
        impact: 'Difficult for new developers to understand and maintain',
        remediationTime: 12
      },
      {
        title: 'Outdated Technical Specs',
        description: 'Technical specifications do not match current implementation',
        impact: 'Knowledge transfer and maintenance challenges',
        remediationTime: 16
      }
    ],
    'Testing': [
      {
        title: 'Insufficient Test Coverage',
        description: 'Several components have test coverage below 75%',
        impact: 'Risk of deployment failures and production bugs',
        remediationTime: 30
      },
      {
        title: 'Test Data Dependencies',
        description: 'Tests depend on existing data instead of creating test data',
        impact: 'Brittle tests that fail unpredictably',
        remediationTime: 20
      }
    ],
    'Architecture': [
      {
        title: 'Monolithic Design',
        description: 'Business logic not properly separated into service layers',
        impact: 'Difficult to maintain and extend functionality',
        remediationTime: 40
      },
      {
        title: 'Missing Domain Layer',
        description: 'No proper domain model encapsulating business rules',
        impact: 'Business logic scattered across controllers and triggers',
        remediationTime: 50
      }
    ],
    'Performance': [
      {
        title: 'Inefficient SOQL Queries',
        description: 'Multiple queries that could be consolidated',
        impact: 'Approaching governor limits with large data volumes',
        remediationTime: 16
      },
      {
        title: 'Excessive DML Operations',
        description: 'DML statements inside loops causing governor limit issues',
        impact: 'Operations fail with more than 100 records',
        remediationTime: 12
      }
    ]
  };
  
  // Create 10-15 technical debt items
  const totalDebtItems = Math.floor(Math.random() * 6) + 10;
  
  for (let i = 0; i < totalDebtItems; i++) {
    // Select a random category
    const category = debtCategories[Math.floor(Math.random() * debtCategories.length)];
    
    // Select a random debt item from this category
    const debtItems = debtItemsByCategory[category];
    const debtItem = debtItems[Math.floor(Math.random() * debtItems.length)];
    
    // Select a random status
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Select a random component or set to null for org-wide issues
    const useComponent = Math.random() > 0.3; // 70% chance to associate with a component
    const component = useComponent 
      ? components[Math.floor(Math.random() * components.length)] 
      : null;
    
    // Generate a priority (1-5)
    const priority = Math.floor(Math.random() * 5) + 1;
    
    // Create the technical debt item
    await storage.createTechnicalDebtItem({
      orgId,
      title: debtItem.title,
      description: debtItem.description,
      category,
      priority,
      status,
      impact: debtItem.impact,
      componentId: component?.id,
      componentName: component?.name,
      componentType: component?.type,
      estimatedRemediationTime: debtItem.remediationTime,
      createdDate: new Date().toISOString(),
      assignedTo: null,
      tags: JSON.stringify([category.toLowerCase(), 'technical-debt', priority <= 2 ? 'high-priority' : 'normal-priority'])
    });
    
    console.log(`Created technical debt item: ${debtItem.title} (${category}, Priority: ${priority})`);
  }
}

export default seedAdvancedData;