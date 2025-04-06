import { seedAdvancedData } from '../seed-advanced-data';
import { storage } from '../storage';

async function main() {
  try {
    // Get all orgs
    const orgs = await storage.getUserOrgs(1);  // Admin user ID is typically 1
    
    if (orgs.length === 0) {
      console.log('No orgs found. Please create an org first.');
      process.exit(1);
    }
    
    const orgId = orgs[0].id;
    console.log(`Seeding advanced data for org ${orgId} (${orgs[0].name})...`);
    
    await seedAdvancedData(orgId);
    
    console.log('Completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding advanced data:', error);
    process.exit(1);
  }
}

main();