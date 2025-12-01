class TableManager {
  static addPrintButton(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const parentElement = table.parentElement;
    if (!parentElement) return;

    const printBtn = document.createElement('button');
    printBtn.className = 'btn btn-secondary mb-3';
    printBtn.innerHTML = '<i class="fas fa-print"></i> Print Table';
    printBtn.onclick = () => this.printTable(tableId);

    parentElement.insertBefore(printBtn, table);
  }

  static printTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
    
    // Collect data from table
    const headers = [];
    const rows = [];
    
    // Get headers (excluding Actions column)
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach((cell, index) => {
      // Skip the last column (Actions)
      if (index < headerCells.length - 1) {
        headers.push(cell.textContent.trim());
      }
    });

    // Get data rows
    let dataRows = [];
    if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
      const dt = $(`#${tableId}`).DataTable();
      const allRows = Array.from(dt.rows({ search: 'applied' }).nodes());
      
      allRows.forEach(row => {
        const cells = $(row).find('td');
        const rowData = [];
        // Exclude last column (actions)
        for (let i = 0; i < cells.length - 1; i++) {
          const cellText = cells.eq(i).text().trim();
          // Remove extra whitespace and newlines
          rowData.push(cellText.replace(/\s+/g, ' '));
        }
        if (rowData.length > 0) {
          dataRows.push(rowData);
        }
      });
    } else {
      // Regular table
      const tbody = table.querySelector('tbody');
      if (tbody) {
        const trows = tbody.querySelectorAll('tr');
        trows.forEach(row => {
          const cells = row.querySelectorAll('td');
          const rowData = [];
          for (let i = 0; i < cells.length - 1; i++) {
            rowData.push(cells[i].textContent.trim().replace(/\s+/g, ' '));
          }
          if (rowData.length > 0) {
            dataRows.push(rowData);
          }
        });
      }
    }

    // Get table title
    let tableTitle = '';
    const card = table.closest('.card');
    if (card) {
      const titleEl = card.querySelector('.card-title');
      if (titleEl) {
        tableTitle = titleEl.textContent.trim();
      }
    }
    if (!tableTitle) {
      const section = table.closest('.content-section');
      if (section) {
        const heading = section.querySelector('h2');
        if (heading) {
          tableTitle = heading.textContent.trim();
        }
      }
    }
    if (!tableTitle) {
      tableTitle = 'Table Report';
    }

    const printWindow = window.open('', '_blank');
    const style = `
      @page { 
        size: A4; 
        margin: 0.5cm;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: Arial, sans-serif;
        font-size: 11px;
        line-height: 1.3;
        color: #333;
        background: white;
      }
      .print-header {
        text-align: center;
        margin-bottom: 10px;
        border-bottom: 2px solid ${settings.primaryColor || '#007bff'};
        padding-bottom: 8px;
        page-break-after: avoid;
      }
      .print-header h2 {
        margin: 0 0 3px 0;
        color: ${settings.primaryColor || '#007bff'};
        font-size: 16px;
        font-weight: bold;
      }
      .print-header .org-name {
        font-size: 10px;
        color: #555;
        margin: 2px 0;
      }
      .print-header h3 {
        margin: 6px 0 2px 0;
        color: ${settings.primaryColor || '#007bff'};
        font-size: 12px;
        font-weight: bold;
      }
      .print-header .date-info {
        margin: 2px 0;
        font-size: 9px;
        color: #777;
      }
      .print-info { 
        margin-bottom: 8px;
        padding: 4px;
        background-color: #f9f9f9;
        border-left: 3px solid ${settings.secondaryColor || '#6c757d'};
        font-size: 10px; 
        color: #666;
        page-break-after: avoid;
      }
      table { 
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        page-break-inside: auto;
      }
      tr { 
        page-break-inside: avoid;
        page-break-after: auto;
      }
      th {
        background-color: ${settings.primaryColor || '#007bff'};
        color: white;
        font-weight: bold;
        padding: 4px 3px;
        text-align: left;
        font-size: 10px;
        border: 0.5px solid ${settings.primaryColor || '#007bff'};
      }
      td {
        padding: 3px 3px;
        border: 0.5px solid #ddd;
        font-size: 10px;
        text-align: left;
        word-wrap: break-word;
      }
      tbody tr:nth-child(even) {
        background-color: #fafafa;
      }
      tbody tr:nth-child(odd) {
        background-color: #fff;
      }
      .print-footer {
        text-align: center;
        margin-top: 10px;
        padding-top: 6px;
        border-top: 1px solid ${settings.secondaryColor || '#6c757d'};
        font-size: 9px;
        color: #999;
        page-break-after: avoid;
      }
      .print-footer p {
        margin: 2px 0;
      }
      @media print {
        body { margin: 0; padding: 2px; }
        @page { margin: 0.4cm; size: A4; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
      }
    `;

    const tableHtml = `
      <table border="1" cellpadding="3" cellspacing="0">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataRows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print ${tableTitle}</title>
          <style>${style}</style>
        </head>
        <body>
          <div class="print-header">
            <h2>${settings.systemName || 'Financial Management System'}</h2>
            <div class="org-name">${(settings.address || 'No Address').split('\n')[0]}</div>
            <div class="org-name">${settings.systemEmail || ''}</div>
            <h3>${tableTitle}</h3>
            <div class="date-info">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
          <div class="print-info">Total Records: ${dataRows.length}</div>
          ${tableHtml}
          <div class="print-footer">
            <p>${settings.receiptFooter || 'Thank you for choosing us!'}</p>
            <p style="font-size: 8px;">Printed from ${settings.systemName || 'Financial Management System'}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  static addTableFooterTotal(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Remove existing footer if any
    const existingFooter = table.getElementsByTagName('tfoot')[0];
    if (existingFooter) {
      existingFooter.remove();
    }

    const footer = table.createTFoot();
    const row = footer.insertRow();
    
    // Add "Total" label cell
    const labelCell = row.insertCell();
    labelCell.textContent = 'Total:';
    labelCell.style.fontWeight = 'bold';
    
    // Add cells up to money column
    for (let i = 1; i < columnIndex; i++) {
      row.insertCell();
    }
    
    // Add total amount cell
    const totalCell = row.insertCell();
    const total = this.calculateColumnTotal(table, columnIndex);
    totalCell.textContent = window.formatCurrency ? window.formatCurrency(total) : 'KES ' + total;
    totalCell.style.fontWeight = 'bold';
    
    // Add remaining empty cells
    const remainingCells = table.rows[0].cells.length - columnIndex - 1;
    for (let i = 0; i < remainingCells; i++) {
      row.insertCell();
    }
  }

  static calculateColumnTotal(table, columnIndex) {
    let total = 0;
    
    // Check if this is a DataTable
    if (table.id && $.fn && $.fn.DataTable && $.fn.DataTable.isDataTable(`#${table.id}`)) {
      try {
        const dataTable = $(`#${table.id}`).DataTable();
        const rows = dataTable.rows({ search: 'applied' }).data();
        
        rows.each(function(value) {
          if (Array.isArray(value) && value[columnIndex]) {
            const numValue = parseFloat(value[columnIndex].toString().replace(/[^0-9.-]+/g, ''));
            if (!isNaN(numValue)) {
              total += numValue;
            }
          }
        });
      } catch (e) {
        console.error('Error calculating DataTable total:', e);
      }
    } else {
      // Fall back to regular table calculation
      const tbody = table.getElementsByTagName('tbody')[0];
      if (tbody) {
        const rows = tbody.getElementsByTagName('tr');
        for (let row of rows) {
          const cell = row.cells[columnIndex];
          if (cell) {
            const value = parseFloat(cell.textContent.replace(/[^0-9.-]+/g, ''));
            if (!isNaN(value)) {
              total += value;
            }
          }
        }
      }
    }
    
    return total;
  }
}

export default TableManager;