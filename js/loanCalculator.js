export default class LoanCalculator {
  static getFormattedDate() {
    const today = new Date();
    return today.toLocaleDateString();
  }

  static calculateLoan(amount, interestRate, period) {
    const monthlyRate = (interestRate / 100) / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, period)) / 
                          (Math.pow(1 + monthlyRate, period) - 1);
    
    const schedule = [];
    let remainingBalance = amount;
    let totalInterest = 0;
    
    for (let month = 1; month <= period; month++) {
      const interest = remainingBalance * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;
      totalInterest += interest;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal,
        interest,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }
    
    return {
      monthlyPayment,
      totalPayment: monthlyPayment * period,
      totalInterest,
      schedule
    };
  }

  static generateAmortizationSchedule(calculationResult) {
    const printWindow = window.open('', '_blank');
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
    
    const style = `
      @page { size: A4; margin: 0.5cm; }
      body { 
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 10px;
      }
      .header { 
        text-align: center; 
        margin-bottom: 20px;
        border-bottom: 2px solid ${settings.primaryColor || '#007bff'};
        padding-bottom: 15px;
      }
      .header h2 {
        margin: 0 0 5px 0;
        color: ${settings.primaryColor || '#007bff'};
      }
      .header p {
        margin: 2px 0;
        font-size: 12px;
      }
      .summary { margin-bottom: 20px; }
      .summary-item { 
        margin: 8px 0;
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }
      table { 
        width: 100%; 
        border-collapse: collapse;
        margin: 15px 0;
      }
      th, td { 
        padding: 10px; 
        text-align: right; 
        border: 1px solid #ddd;
        font-size: 12px;
      }
      th { 
        background-color: ${settings.primaryColor || '#007bff'};
        color: white;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid ${settings.secondaryColor || '#6c757d'};
        font-size: 11px;
        color: #666;
      }
      @media print {
        body { margin: 0; padding: 5px; }
      }
    `;

    const loanAmount = document.getElementById('loanCalculatorAmount')?.value || 0;
    const interestRate = document.getElementById('loanCalculatorInterestRate')?.value || 0;
    const loanPeriod = document.getElementById('loanCalculatorRepaymentPeriod')?.value || 0;

    const content = `
      <div class="header">
        <h2>${settings.systemName || 'Financial Management System'}</h2>
        <p>${(settings.address || 'No Address Set').split('\n').join('<br>')}</p>
        <p>${settings.systemEmail || ''}</p>
        <h3 style="margin-top: 10px; margin-bottom: 5px;">Loan Amortization Schedule</h3>
        <p>Generated on: ${this.getFormattedDate()}</p>
      </div>
      <div class="summary">
        <div class="summary-item">
          <span>Loan Amount:</span>
          <span>${window.formatCurrency ? window.formatCurrency(loanAmount) : 'KES ' + loanAmount}</span>
        </div>
        <div class="summary-item">
          <span>Interest Rate:</span>
          <span>${interestRate}%</span>
        </div>
        <div class="summary-item">
          <span>Loan Period:</span>
          <span>${loanPeriod} months</span>
        </div>
        <div class="summary-item">
          <span>Monthly Payment:</span>
          <span>${window.formatCurrency ? window.formatCurrency(calculationResult.monthlyPayment) : 'KES ' + calculationResult.monthlyPayment}</span>
        </div>
        <div class="summary-item">
          <span>Total Interest:</span>
          <span>${window.formatCurrency ? window.formatCurrency(calculationResult.totalInterest) : 'KES ' + calculationResult.totalInterest}</span>
        </div>
        <div class="summary-item">
          <span>Total Payment:</span>
          <span>${window.formatCurrency ? window.formatCurrency(calculationResult.totalPayment) : 'KES ' + calculationResult.totalPayment}</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Payment</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Remaining Balance</th>
          </tr>
        </thead>
        <tbody>
          ${calculationResult.schedule.map(row => `
            <tr>
              <td>${row.month}</td>
              <td>${window.formatCurrency ? window.formatCurrency(row.payment) : 'KES ' + row.payment}</td>
              <td>${window.formatCurrency ? window.formatCurrency(row.principal) : 'KES ' + row.principal}</td>
              <td>${window.formatCurrency ? window.formatCurrency(row.interest) : 'KES ' + row.interest}</td>
              <td>${window.formatCurrency ? window.formatCurrency(row.remainingBalance) : 'KES ' + row.remainingBalance}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>${settings.receiptFooter || 'Thank you for choosing us!'}</p>
        <p style="font-size: 10px; color: #999;">This is a computer generated schedule</p>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Loan Amortization Schedule</title>
          <style>${style}</style>
        </head>
        <body>
          ${content}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}