import AuthService from '/js/authService.js';

// Export adminSettings so it can be imported by other modules
export let adminSettings = {
  systemName: "Financial Management System",
  systemEmail: "admin@system.com",
  address: "123 Main Street\nNairobi, Kenya\nTel: +254 123 456 789",
  currency: "KES",
  interestRate: 10,
  loanTerm: 12,
  theme: "light",
  tableRows: 10,
  dateFormat: "MM/DD/YYYY",
  receiptFooter: "Thank you for choosing us!",
  primaryColor: "#007bff",
  secondaryColor: "#6c757d"
};

function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getFromLocalStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function applyThemeColors() {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', adminSettings.primaryColor);
  root.style.setProperty('--secondary-color', adminSettings.secondaryColor);
  
  // Apply to navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.backgroundColor = adminSettings.primaryColor;
  }

  // Apply to active nav links
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --primary-color: ${adminSettings.primaryColor};
      --secondary-color: ${adminSettings.secondaryColor};
    }
    .nav-link.active {
      background: ${adminSettings.primaryColor} !important;
    }
    .btn-primary {
      background-color: ${adminSettings.primaryColor} !important;
      border-color: ${adminSettings.primaryColor} !important;
    }
    .btn-primary:hover {
      background-color: ${shadeColor(adminSettings.primaryColor, -20)} !important;
    }
    .modal-header {
      background-color: ${adminSettings.primaryColor} !important;
    }
    .badge.bg-primary {
      background-color: ${adminSettings.primaryColor} !important;
    }
    .card.primary h2 {
      color: ${adminSettings.primaryColor} !important;
    }
  `;
  document.head.appendChild(style);
}

function shadeColor(color, percent) {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

function applySettings() {
  document.title = adminSettings.systemName;
  $('.navbar-brand').text(adminSettings.systemName);
  
  $('body').attr('data-theme', adminSettings.theme);
  
  window.currencyFormatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES' 
  });
  
  applyThemeColors();
  updateTableSettings();
}

function updateTableSettings() {
  const tables = [
    '#savingsTable',
    '#condolenceTable',
    '#educationTable',
    '#healthTable',
    '#contributionsTable',
    '#approvedLoansTable',
    '#loanApplicationsTable',
    '#registrationTable',
    '#approvedMembersTable',
    '#loanRepaymentTable',
    '#bonusTable',
    '#performanceTable'
  ];
  
  tables.forEach(tableId => {
    if ($.fn.DataTable.isDataTable(tableId)) {
      $(tableId).DataTable().page.len(parseInt(adminSettings.tableRows)).draw();
    }
  });
}

// Settings form handlers
$(document).ready(function() {
  const savedSettings = getFromLocalStorage('adminSettings');
  if (savedSettings) {
    adminSettings = { ...adminSettings, ...savedSettings };
  }
  
  const systemNameInput = document.getElementById('systemName');
  const systemEmailInput = document.getElementById('systemEmail');
  const addressInput = document.getElementById('address');
  const currencyInput = document.getElementById('currency');
  const interestRateInput = document.getElementById('interestRate');
  const loanTermInput = document.getElementById('loanTerm');
  const themeInput = document.getElementById('theme');
  const tableRowsInput = document.getElementById('tableRows');
  const dateFormatInput = document.getElementById('dateFormat');
  const receiptFooterInput = document.getElementById('receiptFooter');
  const primaryColorInput = document.getElementById('primaryColor');
  const secondaryColorInput = document.getElementById('secondaryColor');

  if (systemNameInput) systemNameInput.value = adminSettings.systemName;
  if (systemEmailInput) systemEmailInput.value = adminSettings.systemEmail;
  if (addressInput) addressInput.value = adminSettings.address;
  if (currencyInput) currencyInput.value = adminSettings.currency;
  if (interestRateInput) interestRateInput.value = adminSettings.interestRate;
  if (loanTermInput) loanTermInput.value = adminSettings.loanTerm;
  if (themeInput) themeInput.value = adminSettings.theme;
  if (tableRowsInput) tableRowsInput.value = adminSettings.tableRows;
  if (dateFormatInput) dateFormatInput.value = adminSettings.dateFormat;
  if (receiptFooterInput) receiptFooterInput.value = adminSettings.receiptFooter;
  if (primaryColorInput) primaryColorInput.value = adminSettings.primaryColor;
  if (secondaryColorInput) secondaryColorInput.value = adminSettings.secondaryColor;
  
  applySettings();
  
  const currencySelect = document.getElementById('currency');
  if (currencySelect) {
    currencySelect.innerHTML = `
      <option value="KES">Kenya Shilling (KES)</option>
      <option value="USD">US Dollar (USD)</option>
      <option value="EUR">Euro (EUR)</option>
      <option value="GBP">British Pound (GBP)</option>
      <option value="JPY">Japanese Yen (JPY)</option>
      <option value="AUD">Australian Dollar (AUD)</option>
      <option value="CAD">Canadian Dollar (CAD)</option>
    `;
  }
});

$('#settingsForm').on('submit', function(e) {
  e.preventDefault();
  
  adminSettings = {
    systemName: $('#systemName').val(),
    systemEmail: $('#systemEmail').val(),
    address: $('#address').val(),
    currency: $('#currency').val(),
    interestRate: parseFloat($('#interestRate').val()),
    loanTerm: parseInt($('#loanTerm').val()),
    theme: $('#theme').val(),
    tableRows: parseInt($('#tableRows').val()),
    dateFormat: $('#dateFormat').val(),
    receiptFooter: $('#receiptFooter').val(),
    primaryColor: $('#primaryColor').val(),
    secondaryColor: $('#secondaryColor').val()
  };
  
  saveToLocalStorage('adminSettings', adminSettings);
  applySettings();
  alert('Settings saved successfully!');
});

// Add import/export handlers for settings
$('#resetSettings').on('click', function() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    adminSettings = {
      systemName: "Financial Management System",
      systemEmail: "admin@system.com",
      address: "123 Main Street\nNairobi, Kenya\nTel: +254 123 456 789",
      currency: "KES",
      interestRate: 10,
      loanTerm: 12,
      theme: "light",
      tableRows: 10,
      dateFormat: "MM/DD/YYYY",
      receiptFooter: "Thank you for choosing us!",
      primaryColor: "#007bff",
      secondaryColor: "#6c757d"
    };
    
    saveToLocalStorage('adminSettings', adminSettings);
    Object.keys(adminSettings).forEach(key => {
      $(`#${key}`).val(adminSettings[key]);
    });
    
    applySettings();
    alert('Settings have been reset to defaults.');
  }
});

// Add export system data button
$(document).on('click', '#exportSettingsBtn', async function() {
  if (!await AuthService.requireLogin('export system data')) return;
  
  const systemData = {
    members: JSON.parse(localStorage.getItem('members')) || [],
    contributions_savings: JSON.parse(localStorage.getItem('contributions_savings')) || [],
    contributions_condolence: JSON.parse(localStorage.getItem('contributions_condolence')) || [],
    contributions_education: JSON.parse(localStorage.getItem('contributions_education')) || [],
    contributions_health: JSON.parse(localStorage.getItem('contributions_health')) || [],
    loanApplications: JSON.parse(localStorage.getItem('loanApplications')) || [],
    approvedLoans: JSON.parse(localStorage.getItem('approvedLoans')) || [],
    loanRepayments: JSON.parse(localStorage.getItem('loanRepayments')) || [],
    bonuses: JSON.parse(localStorage.getItem('bonuses')) || [],
    registrationFees: JSON.parse(localStorage.getItem('registrationFees')) || []
  };
  
  const dataStr = JSON.stringify(systemData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  alert('System data exported successfully!');
});

// Add import system data button
$(document).on('click', '#importSettingsBtn', async function() {
  if (!await AuthService.requireLogin('import system data')) return;
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // Validate imported data structure
        const requiredKeys = ['members', 'contributions_savings', 'contributions_condolence', 'contributions_education', 'contributions_health', 'loanApplications', 'approvedLoans', 'loanRepayments', 'bonuses'];
        const hasAllKeys = requiredKeys.every(key => key in importedData);
        
        if (!hasAllKeys) {
          throw new Error('Invalid system data format - missing required data sections');
        }
        
        // Import each data section
        Object.keys(importedData).forEach(key => {
          if (Array.isArray(importedData[key])) {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          }
        });
        
        // Refresh the application
        location.reload();
        alert('System data imported successfully! The page will refresh to apply changes.');
      } catch (error) {
        alert('Error importing system data: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
});

// Make adminSettings global for non-module scripts
window.adminSettings = adminSettings;

// Initialize currency formatter immediately
function initializeCurrencyFormatter() {
  try {
    window.currencyFormatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES' 
    });
    
    window.formatCurrency = function(amount) {
      if (!amount && amount !== 0) return 'KES 0';
      return window.currencyFormatter.format(amount);
    };
  } catch (e) {
    console.error('Error initializing currency formatter:', e);
    window.formatCurrency = function(amount) {
      return 'KES ' + (parseFloat(amount) || 0).toFixed(2);
    };
  }
}

// Call immediately
initializeCurrencyFormatter();

// Export functions that need to be used by other modules
export { applySettings };