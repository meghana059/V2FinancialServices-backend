import mongoose from 'mongoose';
import connectDB from '../config/database';
import Workflow from '../models/Workflow';

const updateInvoiceWorkflow = async (): Promise<void> => {
  try {
    await connectDB();
    
    // Find and update the invoice generation workflow
    const result = await Workflow.updateOne(
      { label: 'Invoice Generation' },
      { 
        frontendRoute: '/admin/invoice-generation',
        description: 'Generate performance fee invoices from Excel data'
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Invoice Generation workflow route updated successfully');
    } else {
      console.log('ℹ️ No workflow found to update or already up to date');
    }
    
    // Verify the update
    const updatedWorkflow = await Workflow.findOne({ label: 'Invoice Generation' });
    if (updatedWorkflow) {
      console.log('Updated workflow:', {
        label: updatedWorkflow.label,
        frontendRoute: updatedWorkflow.frontendRoute,
        description: updatedWorkflow.description
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating workflow:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly
if (require.main === module) {
  updateInvoiceWorkflow();
}

export default updateInvoiceWorkflow;
