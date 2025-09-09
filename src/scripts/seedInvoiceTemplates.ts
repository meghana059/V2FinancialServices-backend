import mongoose from 'mongoose';
import connectDB from '../config/database';
import InvoiceTemplate from '../models/InvoiceTemplate';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const createDefaultTemplate = async (): Promise<void> => {
  try {
    // Check if default template already exists
    const existingTemplate = await InvoiceTemplate.findOne({ isDefault: true });
    if (existingTemplate) {
      console.log('Default invoice template already exists');
      return;
    }

    // Create a simple default template
    const workbook = XLSX.utils.book_new();
    
    // Create a worksheet with placeholder data
    const worksheetData = [
      ['V2 Financial Group', '', '', ''],
      ['Performance Fee Invoice', '', '', ''],
      ['', '', '', ''],
      ['Entity Name:', '<entity_name>', '', ''],
      ['Inception Date:', '<inception_date>', '', ''],
      ['Invoice Year:', '<invoice_year>', '', ''],
      ['', '', '', ''],
      ['Performance Details:', '', '', ''],
      ['Period Ending Market Value:', '<period_ending_market_value>', '', ''],
      ['Inception Performance:', '<inception_performance>', '', ''],
      ['Inception Benchmark:', '<inception_benchmark>', '', ''],
      ['Period Performance:', '<period_performance>', '', ''],
      ['Year Benchmark:', '<year_benchmark>', '', ''],
      ['', '', '', ''],
      ['Fee Calculations:', '', '', ''],
      ['Excess Return:', '<excess_return>', '', ''],
      ['Performance Fee Rate:', '<performance_fee_rate>', '', ''],
      ['Performance Fee:', '<performance_fee>', '', ''],
      ['Total Fees:', '<total_fees>', '', ''],
      ['Fee Cap:', '<fee_cap>', '', ''],
      ['Adjusted Total Fees:', '<adjusted_total_fees>', '', ''],
      ['Adjusted Final Fees:', '<adjusted_final_fees>', '', ''],
      ['', '', '', ''],
      ['Accounts Paying Fees:', '', '', ''],
      ['<accounts_paying_fees>', '', '', ''],
      ['', '', '', ''],
      ['Quarterly Breakdown:', '', '', ''],
      ['Q1 Fees:', '<q1_fees>', '', ''],
      ['Q2 Fees:', '<q2_fees>', '', ''],
      ['Q3 Fees:', '<q3_fees>', '', ''],
      ['Q4 Fees:', '<q4_fees>', '', '']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');

    // Save the template file
    const templatePath = path.join(process.cwd(), 'uploads', 'templates', 'default-invoice-template.xlsx');
    XLSX.writeFile(workbook, templatePath);

    // Create template record in database
    const template = new InvoiceTemplate({
      name: 'Default Invoice Template',
      description: 'Default template for performance fee invoices',
      filePath: templatePath,
      fileName: 'default-invoice-template.xlsx',
      isDefault: true,
      createdBy: new mongoose.Types.ObjectId() // System user
    });

    await template.save();
    console.log('Default invoice template created successfully');
  } catch (error) {
    console.error('Error creating default template:', error);
  }
};

const seedInvoiceTemplates = async (): Promise<void> => {
  try {
    await connectDB();
    await createDefaultTemplate();
    console.log('Invoice templates seeding completed');
  } catch (error) {
    console.error('Error seeding invoice templates:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly
if (require.main === module) {
  seedInvoiceTemplates();
}

export default seedInvoiceTemplates;
