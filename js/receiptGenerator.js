import AuthService from './authService.js';

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
            @media print {
              * { margin: 0; padding: 0; }
              html, body { height: 100%; }
            }
            @page { 
              size: auto;
              margin: 0;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              color: #333;
            }
            .receipt {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .receipt-container {
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            }
            .header {
              text-align: center;
              border-bottom: 3px solid ${settings.primaryColor || '#007bff'};
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header-logo {
              width: 60px;
              height: 60px;
              background: ${settings.primaryColor || '#007bff'};
              border-radius: 50%;
              margin: 0 auto 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 30px;
              font-weight: bold;
            }
            .header-title {
              font-weight: bold;
              font-size: 18px;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
              color: ${settings.primaryColor || '#007bff'};
            }
            .header-subtitle {
              font-size: 10px;
              line-height: 1.4;
              margin-bottom: 8px;
              color: #666;
              font-weight: 500;
            }
            .receipt-type {
              font-weight: bold;
              font-size: 13px;
              margin-top: 8px;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: ${settings.primaryColor || '#007bff'};
            }
            .receipt-date {
              font-size: 11px;
              color: #888;
              margin-bottom: 5px;
            }
            .divider {
              border-top: 2px dashed ${settings.primaryColor || '#007bff'};
              margin: 15px 0;
              opacity: 0.5;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              margin: 8px 0;
              line-height: 1.4;
              border-bottom: 1px solid #f0f0f0;
              padding-bottom: 6px;
            }
            .item-label {
              flex-grow: 1;
              text-align: left;
              color: #666;
              font-weight: 500;
            }
            .item-value {
              text-align: right;
              font-weight: 600;
              color: #333;
            }
            .amount-section {
              margin: 20px 0;
              padding: 15px;
              border: 2px solid ${settings.primaryColor || '#007bff'};
              text-align: center;
              background: linear-gradient(135deg, ${settings.primaryColor || '#007bff'}08 0%, ${settings.primaryColor || '#007bff'}12 100%);
              border-radius: 6px;
            }
            .amount-label {
              font-size: 11px;
              margin-bottom: 8px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #666;
            }
            .amount-value {
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 1px;
              color: ${settings.primaryColor || '#007bff'};
              font-family: 'Courier New', monospace;
            }
            .receipt-details {
              font-size: 12px;
              margin: 15px 0;
              padding: 12px;
              background: #f9f9f9;
              border-left: 3px solid ${settings.primaryColor || '#007bff'};
              border-radius: 4px;
            }
            .receipt-details p {
              margin: 5px 0;
              line-height: 1.5;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed ${settings.primaryColor || '#007bff'};
              opacity: 0.8;
            }
            .footer-text {
              margin: 5px 0;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
              color: #333;
              letter-spacing: 0.5px;
            }
            .footer-notice {
              font-size: 10px;
              color: #888;
              margin-top: 5px;
              line-height: 1.4;
            }
            .receipt-number {
              font-size: 9px;
              color: #999;
              margin-top: 8px;
              font-family: 'Courier New', monospace;
            }
            @media print {
              body { margin: 0; padding: 0; background: white; }
              .receipt { padding: 0; }
              .receipt-container { border: none; box-shadow: none; padding: 20px; }
              .divider { border-top-style: dashed; }
            }
            @media (max-width: 600px) {
              .receipt-container { padding: 15px; }
              .amount-value { font-size: 24px; }
              .header-title { font-size: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-container">
              <div class="header">
                <div class="header-logo">✓</div>
                <div class="header-title">${settings.systemName || 'FINANCIAL SYSTEM'}</div>
                <div class="header-subtitle">
                  ${(settings.address || 'NO ADDRESS').split('\n').map(l => l.trim()).join(' • ')}
                </div>
                <div class="header-subtitle">${settings.systemEmail || ''}</div>
                <div class="receipt-type">${type === 'savings' ? 'SAVINGS CONTRIBUTION' : type === 'condolence' ? 'CONDOLENCE FUND' : type === 'education' ? 'EDUCATION FUND' : type === 'health' ? 'HEALTH FUND' : type === 'loan_payment' ? 'LOAN REPAYMENT' : 'RECEIPT'}</div>
                <div class="receipt-date">Date: ${new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>

              <div class="divider"></div>

              <div class="receipt-details">
                <div class="item-row">
                  <span class="item-label">Receipt #</span>
                  <span class="item-value">${data.receiptNo}</span>
                </div>
                <div class="item-row">
                  <span class="item-label">Member ID</span>
                  <span class="item-value">${data.memberId}</span>
                </div>
                <div class="item-row">
                  <span class="item-label">Member Name</span>
                  <span class="item-value">${data.memberName}</span>
                </div>
                ${data.method ? `
                  <div class="item-row">
                    <span class="item-label">Payment Method</span>
                    <span class="item-value">${data.method.toUpperCase()}</span>
                  </div>
                ` : ''}
                ${data.reference ? `
                  <div class="item-row">
                    <span class="item-label">Reference</span>
                    <span class="item-value">${data.reference}</span>
                  </div>
                ` : ''}
              </div>

              <div class="amount-section">
                <div class="amount-label">Amount Received</div>
                <div class="amount-value">${window.formatCurrency(data.amount).replace('KES ', '')}</div>
              </div>

              ${data.remainingAmount !== undefined ? `
                <div class="divider"></div>
                <div class="item-row">
                  <span class="item-label">Remaining Balance</span>
                  <span class="item-value">${window.formatCurrency(data.remainingAmount)}</span>
                </div>
              ` : ''}

              <div class="divider"></div>

              <div class="footer">
                <div class="footer-text">${settings.receiptFooter || 'THANK YOU FOR YOUR CONTRIBUTION'}</div>
                <div class="footer-notice">
                  ✓ This is a computer-generated receipt<br>
                  ✓ No signature required<br>
                  ✓ Please retain for your records
                </div>
                <div class="receipt-number">
                  ${new Date().toLocaleTimeString('en-US', { hour12: false })}
                </div>
              </div>
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
          <title>Bonus Award Receipt</title>
          <style>
            @media print {
              * { margin: 0; padding: 0; }
              html, body { height: 100%; }
            }
            @page { 
              size: auto;
              margin: 0;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              color: #333;
            }
            .receipt {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .receipt-container {
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            }
            .header {
              text-align: center;
              border-bottom: 3px solid ${settings.primaryColor || '#007bff'};
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header-logo {
              width: 60px;
              height: 60px;
              background: ${settings.primaryColor || '#007bff'};
              border-radius: 50%;
              margin: 0 auto 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 30px;
              font-weight: bold;
            }
            .header-title {
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 5px;
              color: ${settings.primaryColor || '#007bff'};
            }
            .header-subtitle {
              font-size: 10px;
              line-height: 1.4;
              margin-bottom: 8px;
              color: #666;
            }
            .receipt-type {
              font-weight: bold;
              font-size: 13px;
              margin-top: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: ${settings.primaryColor || '#007bff'};
            }
            .divider {
              border-top: 2px dashed ${settings.primaryColor || '#007bff'};
              margin: 15px 0;
              opacity: 0.5;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              margin: 8px 0;
              padding-bottom: 6px;
              border-bottom: 1px solid #f0f0f0;
            }
            .item-label {
              color: #666;
              font-weight: 500;
            }
            .item-value {
              text-align: right;
              font-weight: 600;
              color: #333;
            }
            .amount-section {
              margin: 20px 0;
              padding: 15px;
              border: 2px solid ${settings.primaryColor || '#007bff'};
              text-align: center;
              background: linear-gradient(135deg, ${settings.primaryColor || '#007bff'}08 0%, ${settings.primaryColor || '#007bff'}12 100%);
              border-radius: 6px;
            }
            .amount-label {
              font-size: 11px;
              margin-bottom: 8px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #666;
            }
            .amount-value {
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 1px;
              color: ${settings.primaryColor || '#007bff'};
              font-family: 'Courier New', monospace;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed ${settings.primaryColor || '#007bff'};
              opacity: 0.8;
            }
            .footer-text {
              margin: 5px 0;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
              color: #333;
            }
            .footer-notice {
              font-size: 10px;
              color: #888;
              margin-top: 5px;
            }
            @media print {
              body { margin: 0; padding: 0; background: white; }
              .receipt { padding: 0; }
              .receipt-container { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-container">
              <div class="header">
                <div class="header-logo">🎁</div>
                <div class="header-title">${settings.systemName || 'FINANCIAL SYSTEM'}</div>
                <div class="header-subtitle">${(settings.address || 'NO ADDRESS').split('\n').map(l => l.trim()).join(' • ')}</div>
                <div class="header-subtitle">${settings.systemEmail || ''}</div>
                <div class="receipt-type">BONUS AWARD CERTIFICATE</div>
              </div>

              <div class="divider"></div>

              <div class="item-row">
                <span class="item-label">Member ID</span>
                <span class="item-value">${data.memberId}</span>
              </div>
              <div class="item-row">
                <span class="item-label">Member Name</span>
                <span class="item-value">${data.memberName}</span>
              </div>
              <div class="item-row">
                <span class="item-label">Total Contributions</span>
                <span class="item-value">${window.formatCurrency(data.details.contributionTotal)}</span>
              </div>
              <div class="item-row">
                <span class="item-label">Repayment Score</span>
                <span class="item-value">${(data.details.repaymentScore * 100).toFixed(1)}%</span>
              </div>

              <div class="amount-section">
                <div class="amount-label">BONUS AWARDED</div>
                <div class="amount-value">${window.formatCurrency(data.amount).replace('KES ', '')}</div>
              </div>

              <div class="footer">
                <div class="footer-text">${settings.receiptFooter || 'CONGRATULATIONS'}</div>
                <div class="footer-notice">
                  This bonus has been awarded based on your outstanding<br>
                  contributions and loan repayment performance.
                </div>
              </div>
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

