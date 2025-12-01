// This file contains code moved from dataManager.js to reduce its size
import TableManager from './tableManager.js';
import DataImportExport from './dataImportExport.js';

// Configuration for tables
const tableConfig = {
  savingsTable: {
    moneyColumn: 2
  },
  condolenceTable: {
    moneyColumn: 2
  },
  educationTable: {
    moneyColumn: 2
  },
  healthTable: {
    moneyColumn: 2
  },
  contributionsTable: {
    moneyColumn: 2
  },
  approvedLoansTable: {
    moneyColumn: 2
  },
  loanApplicationsTable: {
    moneyColumn: 2
  },
  registrationTable: {
    importExport: true
  },
  approvedMembersTable: {
    importExport: true
  },
  loanRepaymentTable: {
    moneyColumn: 2
  },
  bonusTable: {
    moneyColumn: 2
  },
  performanceTable: {
    // No money column for performance table
  }
};

export function initializeTables() {
  Object.entries(tableConfig).forEach(([tableId, config]) => {
    // Add print button to all tables
    TableManager.addPrintButton(tableId);

    // Add import/export buttons to member tables
    if (config.importExport) {
      DataImportExport.addImportExportButtons(tableId, tableId.replace('Table', ''));
    }

    // Add totals to tables with money columns
    if (config.moneyColumn !== undefined) {
      TableManager.addTableFooterTotal(tableId, config.moneyColumn);
    }
  });

  // Listen for data updates
  document.addEventListener('dataUpdated', () => {
    Object.entries(tableConfig).forEach(([tableId, config]) => {
      if (config.moneyColumn !== undefined) {
        TableManager.addTableFooterTotal(tableId, config.moneyColumn);
      }
    });
  });
}

// Initialize tables when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTables);