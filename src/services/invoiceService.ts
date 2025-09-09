import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { IInvoiceData, IInvoiceCalculations } from '../types';
import { IInvoiceTemplate } from '../models/InvoiceTemplate';
import { IInvoiceJob } from '../models/InvoiceJob';

export class InvoiceService {
  private static readonly REQUIRED_COLUMNS = [
    'Entity ID', 'Entity Name', 'Group Name', 'Entity Path', 'Inception Date',
    'Inception Benchmark', 'Year Benchmark', 'Performance Fee Rate', 'Fee Cap',
    'Inception Performance', 'Period Ending Market Value', 'Period Performance',
    'Period Beginning Market Value'
  ];

  /**
   * Validates Excel file format and required columns
   */
  static validateExcelFile(filePath: string): { isValid: boolean; error?: string; data?: IInvoiceData[] } {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { isValid: false, error: 'File does not exist' };
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (!['.xlsx', '.xls'].includes(ext)) {
        return { isValid: false, error: 'File must be an Excel file (.xlsx or .xls)' };
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        return { isValid: false, error: 'Excel file must contain at least a header row and one data row' };
      }

      // Get headers
      const headers = data[0] as string[];
      const missingColumns = this.REQUIRED_COLUMNS.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        return { 
          isValid: false, 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        };
      }

      // Convert data to IInvoiceData format
      const invoiceData: IInvoiceData[] = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (row.length === 0 || !row[0]) continue; // Skip empty rows

        const invoiceRow: IInvoiceData = {
          entityId: row[headers.indexOf('Entity ID')]?.toString() || '',
          entityName: row[headers.indexOf('Entity Name')]?.toString() || '',
          groupName: row[headers.indexOf('Group Name')]?.toString() || '',
          entityPath: row[headers.indexOf('Entity Path')]?.toString() || '',
          inceptionDate: row[headers.indexOf('Inception Date')]?.toString() || '',
          inceptionBenchmark: parseFloat(row[headers.indexOf('Inception Benchmark')]) || 0,
          yearBenchmark: parseFloat(row[headers.indexOf('Year Benchmark')]) || 0,
          performanceFeeRate: parseFloat(row[headers.indexOf('Performance Fee Rate')]) || 0,
          feeCap: parseFloat(row[headers.indexOf('Fee Cap')]) || 0,
          inceptionPerformance: parseFloat(row[headers.indexOf('Inception Performance')]) || 0,
          periodEndingMarketValue: parseFloat(row[headers.indexOf('Period Ending Market Value')]) || 0,
          periodPerformance: parseFloat(row[headers.indexOf('Period Performance')]) || 0,
          periodBeginningMarketValue: parseFloat(row[headers.indexOf('Period Beginning Market Value')]) || 0,
          q1Fees: parseFloat(row[headers.indexOf('Q1 Fees')]) || 0,
          q2Fees: parseFloat(row[headers.indexOf('Q2 Fees')]) || 0,
          q3Fees: parseFloat(row[headers.indexOf('Q3 Fees')]) || 0,
          q4Fees: parseFloat(row[headers.indexOf('Q4 Fees')]) || 0,
          accountsPayingFees: row[headers.indexOf('AccountsPayingFees')]?.toString() || ''
        };

        invoiceData.push(invoiceRow);
      }

      return { isValid: true, data: invoiceData };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Error reading Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Calculates invoice values based on the Python logic
   */
  static calculateInvoiceValues(data: IInvoiceData): IInvoiceCalculations {
    // Calculate excess return (performance vs benchmark)
    const excessReturn = Math.max(
      (data.inceptionPerformance / 100) - (data.inceptionBenchmark / 100), 
      0
    );

    // Calculate performance fee
    let performanceFee = 0;
    if (data.inceptionPerformance > data.inceptionBenchmark) {
      performanceFee = ((excessReturn * data.performanceFeeRate * data.periodEndingMarketValue) / 100) / 100;
    }

    const totalFees = performanceFee;
    
    // Apply fee cap
    const adjustedTotalFees = Math.min(
      (data.feeCap * data.periodEndingMarketValue) / 100, 
      totalFees
    );

    const adjustedFinalFees = adjustedTotalFees;

    return {
      excessReturn,
      performanceFee,
      totalFees,
      adjustedTotalFees,
      adjustedFinalFees
    };
  }

  /**
   * Creates a properly formatted invoice Excel file matching the exact layout
   */
  static createFormattedInvoice(
    data: IInvoiceData,
    calculations: IInvoiceCalculations,
    invoiceYear: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const workbook = XLSX.utils.book_new();
        
         // Create the invoice data matching the exact layout from the image
         const invoiceData = [
           // Title rows (merged across columns)
           ['PERFORMANCE FEE CALCULATION', '', ''],
           [`Perf Based 7% Aggressive`, '', ''],
           [], // Empty row
           
           // Main calculation table - exactly matching the image layout
           ['Inception date of performance based billing', this.formatDate(data.inceptionDate), 'This is the date from which IRR will be measured'],
           ['2025 year end AUM', this.formatCurrency(data.periodEndingMarketValue), 'Excluding any staging accounts'],
           ['Since inception IRR (measured from inception date above) after fees', `${data.inceptionPerformance.toFixed(2)}%`, 'Needs to exceed "Since inception benchmark" for perf'],
           ['Since inception benchmark', `${data.inceptionBenchmark.toFixed(2)}%`, ''],
           ['2025 IRR after fees', `${data.periodPerformance.toFixed(2)}%`, ''],
           ['2025 benchmark', `${data.yearBenchmark.toFixed(2)}%`, ''],
           ['Excess return over benchmark - 2025', `${(calculations.excessReturn * 100).toFixed(2)}%`, ''],
           ['Performance fee rate', `${data.performanceFeeRate.toFixed(2)}%`, ''],
           ['Performance fee $', this.formatCurrency(calculations.performanceFee), ''],
           ['Performance fee %', `${((calculations.performanceFee / data.periodEndingMarketValue) * 100).toFixed(2)}%`, ''],
           ['Quarterly asset based Fees already billed during 2025', this.formatCurrency((data.q1Fees || 0) + (data.q2Fees || 0) + (data.q3Fees || 0) + (data.q4Fees || 0)), ''],
           ['Total fees (Asset based + Performance)', this.formatCurrency(calculations.totalFees), ''],
           ['Fees as % of year end AUM', `${((calculations.totalFees / data.periodEndingMarketValue) * 100).toFixed(2)}%`, ''],
           ['Fee cap', `${data.feeCap.toFixed(2)}%`, ''],
           ['Adjusted total fees (if cap exceeded)', this.formatCurrency(calculations.adjustedTotalFees), ''],
           ['Adjusted final performance fees', this.formatCurrency(calculations.adjustedFinalFees), ''],
           [], // Empty row
           
           // Quarterly fees section - starting from D11 (row 11, column D)
           ['', '', '', 'Quarterly Asset based fees during 2025', '', '', ''],
           ['', '', '', 'Q1', 'Q2', 'Q3', 'Q4'],
           ['', '', '', this.formatCurrency(data.q1Fees || 0), this.formatCurrency(data.q2Fees || 0), this.formatCurrency(data.q3Fees || 0), this.formatCurrency(data.q4Fees || 0)],
           ['', '', '', '1/21/2025', '4/27/2025', '7/21/2025', '10/21/2025'],
         ];

        const worksheet = XLSX.utils.aoa_to_sheet(invoiceData);
        
        // Apply clean formatting - no borders at all, completely clean
        this.applyCleanFormatting(worksheet, data, calculations);
        
        // Remove all grid lines
        worksheet['!margins'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
        
         // Set column widths to match the layout - no grid lines
         worksheet['!cols'] = [
           { wch: 45 }, // Column A - Labels
           { wch: 18 }, // Column B - Values
           { wch: 35 }, // Column C - Comments (auto-height)
           { wch: 8 },  // Column D - Spacing
           { wch: 12 }, // Column E - Q1
           { wch: 12 }, // Column F - Q2
           { wch: 12 }, // Column G - Q3
           { wch: 12 }, // Column H - Q4
         ];
         
         // Set row heights dynamically - auto-adjust for content
         worksheet['!rows'] = [
           { hpt: 20 }, // Row 1 - Title
           { hpt: 18 }, // Row 2 - Subtitle
           { hpt: 12 }, // Row 3 - Empty
           { hpt: 16 }, // Row 4 - Inception date
           { hpt: 16 }, // Row 5 - AUM
           { hpt: 20 }, // Row 6 - IRR (longer text)
           { hpt: 16 }, // Row 7 - Benchmark
           { hpt: 16 }, // Row 8 - 2025 IRR
           { hpt: 16 }, // Row 9 - 2025 benchmark
           { hpt: 20 }, // Row 10 - Excess return (longer text)
           { hpt: 16 }, // Row 11 - Performance fee rate
           { hpt: 16 }, // Row 12 - Performance fee $
           { hpt: 16 }, // Row 13 - Performance fee %
           { hpt: 20 }, // Row 14 - Quarterly fees (longer text)
           { hpt: 20 }, // Row 15 - Total fees (longer text)
           { hpt: 20 }, // Row 16 - Fees as % (longer text)
           { hpt: 16 }, // Row 17 - Fee cap
           { hpt: 20 }, // Row 18 - Adjusted total fees (longer text)
           { hpt: 20 }, // Row 19 - Adjusted final fees (longer text)
           { hpt: 12 }, // Row 20 - Empty
           { hpt: 18 }, // Row 21 - Quarterly title
           { hpt: 16 }, // Row 22 - Q1-Q4 headers
           { hpt: 16 }, // Row 23 - Quarterly values
           { hpt: 16 }, // Row 24 - Quarterly dates
         ];

        // Remove all grid lines from the worksheet
        this.removeAllGridLines(worksheet);
        
        // Add the worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');
        
        // Set workbook properties to remove grid lines
        workbook.Props = {
          Title: 'Performance Fee Calculation',
          Subject: 'Invoice',
          Author: 'V2 Financial Services',
          CreatedDate: new Date()
        };
        
        // Write the file with options to remove grid lines
        XLSX.writeFile(workbook, outputPath, { 
          bookType: 'xlsx',
          compression: true,
          Props: workbook.Props,
          cellStyles: true
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Apply clean cell formatting - no borders at all, completely clean layout
   */
  private static applyCleanFormatting(worksheet: XLSX.WorkSheet, data: IInvoiceData, calculations: IInvoiceCalculations): void {
    // Format title cells - bold and centered, no borders
    if (worksheet['A1']) {
      worksheet['A1'].s = { 
        font: { bold: true, size: 14 }, 
        alignment: { horizontal: 'center' }
      };
    }
    if (worksheet['A2']) {
      worksheet['A2'].s = { 
        font: { bold: true, size: 12 }, 
        alignment: { horizontal: 'center' }
      };
    }

    // Format specific cells for proper display - no borders
    this.formatSpecificCells(worksheet);
  }


  /**
   * Format specific cells for proper display
   */
  private static formatSpecificCells(worksheet: XLSX.WorkSheet): void {
    // Format currency cells in main table (Column B)
    const currencyRows = [5, 12, 14, 15, 18, 19]; // AUM, Performance fee $, Quarterly fees, Total fees, Adjusted fees, Final fees
    currencyRows.forEach(row => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 }); // Column B
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { 
          numFmt: '"$"#,##0',
          alignment: { horizontal: 'right' }
        };
      }
    });

    // Format percentage cells in main table (Column B)
    const percentageRows = [6, 7, 8, 9, 10, 11, 13, 16, 17]; // All percentage values
    percentageRows.forEach(row => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 }); // Column B
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { 
          numFmt: '0.00"%"',
          alignment: { horizontal: 'right' }
        };
      }
    });

     // Format quarterly fees (Columns E, F, G, H) starting from D11
     const quarterlyRow = 22; // Row 23 (0-indexed)
     for (let col = 4; col <= 7; col++) { // Columns E, F, G, H
       const cellRef = XLSX.utils.encode_cell({ r: quarterlyRow, c: col });
       if (worksheet[cellRef]) {
         worksheet[cellRef].s = { 
           numFmt: '"$"#,##0.00',
           alignment: { horizontal: 'center' }
         };
       }
     }

     // Format date cell
     const dateCell = XLSX.utils.encode_cell({ r: 3, c: 1 }); // B4
     if (worksheet[dateCell]) {
       worksheet[dateCell].s = { 
         numFmt: 'mm/dd/yyyy',
         alignment: { horizontal: 'right' }
       };
     }

     // Format quarterly dates
     const quarterlyDatesRow = 23; // Row 24 (0-indexed)
     for (let col = 4; col <= 7; col++) { // Columns E, F, G, H
       const cellRef = XLSX.utils.encode_cell({ r: quarterlyDatesRow, c: col });
       if (worksheet[cellRef]) {
         worksheet[cellRef].s = { 
           numFmt: 'mm/dd/yyyy',
           alignment: { horizontal: 'center' }
         };
       }
     }

     // Format quarterly headers
     const quarterlyHeadersRow = 21; // Row 22 (0-indexed)
     for (let col = 4; col <= 7; col++) { // Columns E, F, G, H
       const cellRef = XLSX.utils.encode_cell({ r: quarterlyHeadersRow, c: col });
       if (worksheet[cellRef]) {
         worksheet[cellRef].s = { 
           font: { bold: true },
           alignment: { horizontal: 'center' }
         };
       }
     }

     // Format quarterly title
     const quarterlyTitleCell = XLSX.utils.encode_cell({ r: 20, c: 3 }); // D21
     if (worksheet[quarterlyTitleCell]) {
       worksheet[quarterlyTitleCell].s = { 
         font: { bold: true },
         alignment: { horizontal: 'center' }
       };
     }
  }

  /**
   * Remove all grid lines by setting clean white background for all cells
   */
  private static removeAllGridLines(worksheet: XLSX.WorkSheet): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Set worksheet properties to remove grid lines
    worksheet['!margins'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
    
    // Create a comprehensive style object for clean cells
    const cleanStyle = {
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: {
        top: { style: 'none', color: { rgb: 'FFFFFF' } },
        bottom: { style: 'none', color: { rgb: 'FFFFFF' } },
        left: { style: 'none', color: { rgb: 'FFFFFF' } },
        right: { style: 'none', color: { rgb: 'FFFFFF' } }
      },
      font: { color: { rgb: '000000' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellRef]) {
          worksheet[cellRef] = { v: '', t: 's' };
        }
        if (!worksheet[cellRef].s) {
          worksheet[cellRef].s = {};
        }
        
        // Apply clean style to all cells
        worksheet[cellRef].s = { ...worksheet[cellRef].s, ...cleanStyle };
      }
    }
    
    // Set worksheet view options to hide grid lines
    worksheet['!sheetView'] = [{
      RTL: false
    }];
    
    // Set worksheet properties to ensure no grid lines
    worksheet['!print'] = {
      gridLines: false,
      showGridLines: false
    };
  }

  /**
   * Format currency values to match the exact format from the image
   */
  private static formatCurrency(value: number): string {
    // Format like $13,56,574 (with commas, no decimals for large amounts)
    if (value >= 1000) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      // For smaller amounts, show decimals like $25.00
      return `$${value.toFixed(2)}`;
    }
  }

  /**
   * Format date values
   */
  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Generates PDF from Excel file
   */
  static async generatePDFFromExcel(excelPath: string, pdfPath: string): Promise<void> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // Read Excel file and convert to HTML
      const workbook = XLSX.readFile(excelPath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const htmlContent = this.excelToHTML(worksheet);
      
      await page.setContent(htmlContent);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });
    } finally {
      await browser.close();
    }
  }

  /**
   * Convert Excel worksheet to HTML for PDF generation with exact quarterly table formatting
   */
  private static excelToHTML(worksheet: XLSX.WorkSheet): string {
    let html = `
      <html>
        <head>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body { 
              font-family: Calibri, Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: white;
              color: #000;
              font-size: 11px;
              line-height: 1.2;
            }
            .invoice-container {
              width: 100%;
              max-width: 100%;
            }
            .title { 
              font-weight: bold; 
              font-size: 14px; 
              text-align: center; 
              margin-bottom: 5px;
              color: #000;
            }
            .subtitle { 
              font-weight: bold; 
              font-size: 12px; 
              text-align: center; 
              margin-bottom: 15px;
              color: #000;
            }
            .main-table { 
              border-collapse: collapse; 
              width: 65%; 
              margin-bottom: 15px;
              border: none;
              float: left;
            }
            .main-table td { 
              padding: 4px 6px; 
              text-align: left; 
              border: none;
              vertical-align: top;
            }
            .main-table td:nth-child(2) { 
              text-align: right; 
              font-weight: bold;
            }
            .main-table td:nth-child(3) { 
              font-style: italic; 
              color: #666;
              font-size: 10px;
            }
            .quarterly-section {
              float: right;
              width: 30%;
              margin-left: 15px;
            }
            .quarterly-table { 
              border-collapse: collapse; 
              width: 100%; 
              border: 1px solid #000;
              margin-bottom: 10px;
            }
            .quarterly-title {
              font-weight: bold;
              text-align: center;
              padding: 6px;
              border: 1px solid #000;
              border-bottom: none;
              background-color: #f9f9f9;
            }
            .quarterly-table th, .quarterly-table td { 
              padding: 6px; 
              text-align: center; 
              border: 1px solid #000;
            }
            .quarterly-table th { 
              font-weight: bold;
              background-color: #f5f5f5;
            }
            .quarterly-table td {
              border: 1px solid #000;
            }
            .quarterly-table tr:first-child th {
              border-top: 1px solid #000;
            }
            .currency { 
              text-align: right; 
              font-weight: bold;
            }
            .percentage { 
              text-align: right; 
              font-weight: bold;
            }
            .clear {
              clear: both;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
    `;

    // Add title and subtitle
    const titleCell = worksheet['A1'];
    const subtitleCell = worksheet['A2'];
    if (titleCell) {
      html += `<div class="title">${titleCell.v}</div>`;
    }
    if (subtitleCell) {
      html += `<div class="subtitle">${subtitleCell.v}</div>`;
    }

    // Add main calculation table
    html += '<table class="main-table">';
    for (let row = 3; row <= 19; row++) { // Main table rows
      const labelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const valueCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
      const noteCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })];
      
      if (labelCell && labelCell.v) {
        html += '<tr>';
        html += `<td>${labelCell.v}</td>`;
        html += `<td class="currency">${valueCell ? valueCell.v : ''}</td>`;
        html += `<td>${noteCell ? noteCell.v : ''}</td>`;
        html += '</tr>';
      }
    }
    html += '</table>';

    // Add quarterly fees section with exact bordered table format
    html += '<div class="quarterly-section">';
    html += '<table class="quarterly-table">';
    html += '<tr><td colspan="4" class="quarterly-title">Quarterly Asset based fees during 2025</td></tr>';
    html += '<tr><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>';
    
    // Quarterly values row
    html += '<tr>';
    for (let col = 4; col <= 7; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 22, c: col })];
      html += `<td>${cell ? cell.v : ''}</td>`;
    }
    html += '</tr>';
    
    // Quarterly dates row
    html += '<tr>';
    for (let col = 4; col <= 7; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 23, c: col })];
      html += `<td>${cell ? cell.v : ''}</td>`;
    }
    html += '</tr>';
    html += '</table>';
    html += '</div>';

    html += '<div class="clear"></div>';

    html += `
          </div>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Generates invoice for a single entity (both Excel and PDF)
   */
  static async generateInvoiceForEntity(
    data: IInvoiceData,
    template: IInvoiceTemplate,
    invoiceYear: string,
    outputDir: string
  ): Promise<string[]> {
    const calculations = this.calculateInvoiceValues(data);
    const generatedFiles: string[] = [];
    
    // Generate unique filename base
    const baseName = `Year end performance fee Calculation ${invoiceYear} #${data.entityId}`;
    let excelFile = path.join(outputDir, `${baseName}.xlsx`);
    let pdfFile = path.join(outputDir, `${baseName}.pdf`);
    
    let counter = 1;
    while (fs.existsSync(excelFile) || fs.existsSync(pdfFile)) {
      excelFile = path.join(outputDir, `${baseName}_${counter}.xlsx`);
      pdfFile = path.join(outputDir, `${baseName}_${counter}.pdf`);
      counter++;
    }

    // Create formatted Excel invoice
    await this.createFormattedInvoice(data, calculations, invoiceYear, excelFile);
    generatedFiles.push(excelFile);
    
    // Generate PDF from Excel
    try {
      await this.generatePDFFromExcel(excelFile, pdfFile);
      generatedFiles.push(pdfFile);
    } catch (error) {
      console.error(`Error generating PDF for entity ${data.entityId}:`, error);
      // Continue without PDF if generation fails
    }
    
    return generatedFiles;
  }

  /**
   * Generates all invoices for the provided data
   */
  static async generateInvoices(
    invoiceData: IInvoiceData[],
    template: IInvoiceTemplate,
    invoiceYear: string,
    outputDir: string,
    job: IInvoiceJob
  ): Promise<string[]> {
    const generatedFiles: string[] = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const data of invoiceData) {
      if (!data.entityPath || data.entityPath.trim() === '') {
        continue; // Skip entities without path as per Python logic
      }

      try {
        const outputFiles = await this.generateInvoiceForEntity(
          data, 
          template, 
          invoiceYear, 
          outputDir
        );
        
        generatedFiles.push(...outputFiles);
        
        // Update job progress
        job.processedEntities += 1;
        await job.save();
        
        // Small delay as in Python version
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error generating invoice for entity ${data.entityId}:`, error);
        // Continue with other entities
      }
    }

    return generatedFiles;
  }
}
