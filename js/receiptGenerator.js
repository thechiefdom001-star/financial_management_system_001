import AuthService from '/js/authService.js';

class ReceiptGenerator {
  static async printReceipt(data, type = 'contribution') {
    if (!await AuthService.requireLogin('print receipt')) return;
    
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${type.charAt(0).toUpperCase() + type.slice(1)} Receipt</title>
          <style>
            @page { size: 80mm 200mm; margin: 0; }
            * { margin: 0; padding: 0; }
            body { 
              font-family: 'Courier New', monospace;
              background: white;
              padding: 0;
              width: 80mm;
            }
            .receipt {
              width: 100%;
              padding: 8px;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .header-title {
              font-weight: bold;
              font-size: 13px;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .header-address {
              font-size: 9px;
              line-height: 1.3;
              margin-bottom: 2px;
            }
            .header-email {
              font-size: 8px;
              margin-bottom: 4px;
            }
            .receipt-type {
              font-weight: bold;
              font-size: 11px;
              margin-top: 4px;
              margin-bottom: 2px;
            }
            .receipt-date {
              font-size: 8px;
              color: #333;
              margin-bottom: 8px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin: 4px 0;
              line-height: 1.2;
            }
            .item-label {
              flex-grow: 1;
              text-align: left;
              padding-right: 4px;
            }
            .item-value {
              text-align: right;
              font-weight: bold;
            }
            .amount-section {
              margin: 8px 0;
              padding: 6px;
              border: 1px solid #000;
              text-align: center;
            }
            .amount-label {
              font-size: 9px;
              margin-bottom: 2px;
            }
            .amount-value {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .footer {
              text-align: center;
              margin-top: 8px;
              padding-top: 4px;
              border-top: 1px dashed #000;
              font-size: 8px;
              line-height: 1.4;
            }
            .footer-text {
              margin: 2px 0;
            }
            .footer-notice {
              font-size: 7px;
              color: #555;
              margin-top: 2px;
            }
            .reference {
              font-size: 8px;
              margin-top: 4px;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="header-title">${settings.systemName || 'FINANCIAL SYSTEM'}</div>
              <div class="header-address">${(settings.address || 'NO ADDRESS').split('\n').map(l => l.trim()).join(' | ')}</div>
              <div class="header-email">${settings.systemEmail || ''}</div>
              <div class="receipt-type">${type === 'savings' ? 'SAVINGS RECEIPT' : type === 'condolence' ? 'CONDOLENCE RECEIPT' : type === 'education' ? 'EDUCATION RECEIPT' : type === 'health' ? 'HEALTH RECEIPT' : type === 'loan_payment' ? 'LOAN PAYMENT' : 'RECEIPT'}</div>
              <div class="receipt-date">${new Date(data.date).toLocaleDateString()}</div>
            </div>

            <div class="item-row">
              <div class="item-label">Receipt No:</div>
              <div class="item-value">${data.receiptNo}</div>
            </div>
            
            <div class="item-row">
              <div class="item-label">Member ID:</div>
              <div class="item-value">${data.memberId}</div>
            </div>

            <div class="item-row">
              <div class="item-label">Name:</div>
              <div class="item-value">${data.memberName}</div>
            </div>

            <div class="divider"></div>

            <div class="amount-section">
              <div class="amount-label">AMOUNT</div>
              <div class="amount-value">${window.formatCurrency(data.amount).replace('KES ', '')}</div>
            </div>

            ${data.remainingAmount !== undefined ? `
              <div class="item-row">
                <div class="item-label">Remaining:</div>
                <div class="item-value">${window.formatCurrency(data.remainingAmount)}</div>
              </div>
            ` : ''}

            ${data.method ? `
              <div class="item-row">
                <div class="item-label">Method:</div>
                <div class="item-value">${data.method.toUpperCase()}</div>
              </div>
            ` : ''}

            ${data.reference ? `
              <div class="reference">Ref: ${data.reference}</div>
            ` : ''}

            <div class="footer">
              <div class="footer-text">${settings.receiptFooter || 'THANK YOU'}</div>
              <div class="footer-notice">Computer Generated Receipt</div>
              <div class="footer-notice">${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  static async printBonusReceipt(data) {
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Bonus Receipt</title>
          <style>
            @page { size: 80mm 200mm; margin: 0; }
            * { margin: 0; padding: 0; }
            body { 
              font-family: 'Courier New', monospace;
              background: white;
              padding: 0;
              width: 80mm;
            }
            .receipt {
              width: 100%;
              padding: 8px;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .header-title {
              font-weight: bold;
              font-size: 13px;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .header-address {
              font-size: 9px;
              line-height: 1.3;
              margin-bottom: 2px;
            }
            .header-email {
              font-size: 8px;
              margin-bottom: 4px;
            }
            .receipt-type {
              font-weight: bold;
              font-size: 11px;
              margin-top: 4px;
              margin-bottom: 2px;
            }
            .receipt-date {
              font-size: 8px;
              color: #333;
              margin-bottom: 8px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin: 4px 0;
              line-height: 1.2;
            }
            .item-label {
              flex-grow: 1;
              text-align: left;
              padding-right: 4px;
            }
            .item-value {
              text-align: right;
              font-weight: bold;
            }
            .amount-section {
              margin: 8px 0;
              padding: 6px;
              border: 1px solid #000;
              text-align: center;
            }
            .amount-label {
              font-size: 9px;
              margin-bottom: 2px;
            }
            .amount-value {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .detail-section {
              font-size: 8px;
              margin: 4px 0;
              line-height: 1.3;
            }
            .footer {
              text-align: center;
              margin-top: 8px;
              padding-top: 4px;
              border-top: 1px dashed #000;
              font-size: 8px;
              line-height: 1.4;
            }
            .footer-text {
              margin: 2px 0;
            }
            .footer-notice {
              font-size: 7px;
              color: #555;
              margin-top: 2px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="header-title">${settings.systemName || 'FINANCIAL SYSTEM'}</div>
              <div class="header-address">${(settings.address || 'NO ADDRESS').split('\n').map(l => l.trim()).join(' | ')}</div>
              <div class="header-email">${settings.systemEmail || ''}</div>
              <div class="receipt-type">BONUS AWARD RECEIPT</div>
              <div class="receipt-date">${new Date(data.date).toLocaleDateString()}</div>
            </div>

            <div class="item-row">
              <div class="item-label">Receipt No:</div>
              <div class="item-value">${data.receiptNo}</div>
            </div>
            
            <div class="item-row">
              <div class="item-label">Member ID:</div>
              <div class="item-value">${data.memberId}</div>
            </div>

            <div class="item-row">
              <div class="item-label">Name:</div>
              <div class="item-value">${data.memberName}</div>
            </div>

            <div class="divider"></div>

            <div class="detail-section">
              <div class="item-row">
                <div class="item-label">Total Contributions:</div>
                <div class="item-value">${window.formatCurrency(data.details.contributionTotal)}</div>
              </div>
              <div class="item-row">
                <div class="item-label">Repayment Score:</div>
                <div class="item-value">${(data.details.repaymentScore * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div class="amount-section">
              <div class="amount-label">BONUS AWARDED</div>
              <div class="amount-value">${window.formatCurrency(data.amount).replace('KES ', '')}</div>
            </div>

            <div class="footer">
              <div class="footer-text">${settings.receiptFooter || 'THANK YOU'}</div>
              <div class="footer-notice">Computer Generated Receipt</div>
              <div class="footer-notice">${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

export default ReceiptGenerator;

