import Workflow from '../models/Workflow';

const defaultWorkflows = [
  // Dashboard - always first
  {
    imgPath: '/icons/dashboard.svg',
    label: 'Dashboard',
    frontendRoute: '/dashboard',
    accessibleTo: 'both' as const,
    isAvailable: true,
    description: 'View dashboard overview'
  },

    // Admin-only features
  {
    imgPath: '/icons/users.svg',
    label: 'User Management',
    frontendRoute: '/users',
    accessibleTo: 'admin' as const,
    isAvailable: true,
    description: 'Manage user accounts, roles, and permissions'
  },
  {
    imgPath: '/icons/invoice.svg',
    label: 'Invoice Generation',
    frontendRoute: '/invoice',
    accessibleTo: 'admin' as const,
    isAvailable: true,
    description: 'Create and manage client invoices'
  },
  {
    imgPath: '/icons/crm.svg',
    label: 'CRM System',
    frontendRoute: '/crm',
    accessibleTo: 'admin' as const,
    isAvailable: true,
    description: 'Customer relationship management'
  },
  {
    imgPath: '/icons/reports.svg',
    label: 'Report Generation',
    frontendRoute: '/reports',
    accessibleTo: 'admin' as const,
    isAvailable: true,
    description: 'Generate financial and business reports'
  },
  {
    imgPath: '/icons/settings.svg',
    label: 'System Settings',
    frontendRoute: '/settings',
    accessibleTo: 'admin' as const,
    isAvailable: true,
    description: 'Configure system settings and preferences'
  },
  {
    imgPath: '/icons/analytics.svg',
    label: 'Analytics Dashboard',
    frontendRoute: '/analytics',
    accessibleTo: 'admin' as const,
    isAvailable: true,
    description: 'View business analytics and insights'
  },
  
  // User-only features
  {
    imgPath: '/icons/portfolio.svg',
    label: 'My Portfolio',
    frontendRoute: '/portfolio',
    accessibleTo: 'user' as const,
    isAvailable: true,
    description: 'View your investment portfolio'
  },
  {
    imgPath: '/icons/transactions.svg',
    label: 'Transaction History',
    frontendRoute: '/transactions',
    accessibleTo: 'user' as const,
    isAvailable: true,
    description: 'View your transaction history'
  },
  {
    imgPath: '/icons/investments.svg',
    label: 'Investment Tools',
    frontendRoute: '/investments',
    accessibleTo: 'user' as const,
    isAvailable: true,
    description: 'Access investment tools and calculators'
  },
  
  // Features accessible to both
  {
    imgPath: '/icons/profile.svg',
    label: 'View Profile',
    frontendRoute: '/profile',
    accessibleTo: 'both' as const,
    isAvailable: true,
    description: 'View and edit your profile information'
  },
];

const seedWorkflows = async (): Promise<void> => {
  try {
    // Check if workflows already exist
    const existingWorkflows = await Workflow.countDocuments();
    
    if (existingWorkflows === 0) {
      console.log('🌱 Seeding workflows...');
      
      await Workflow.insertMany(defaultWorkflows);
      
      console.log(`✅ Seeded ${defaultWorkflows.length} workflows successfully`);
    } else {
      console.log(`📊 ${existingWorkflows} workflows already exist, skipping seed`);
    }
  } catch (error) {
    console.error('❌ Error seeding workflows:', error);
    throw error;
  }
};

export default seedWorkflows;
