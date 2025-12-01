class ReceiptManager {
  static generateContributionReceipt(contribution, member) {
    const receiptData = {
      receiptNo: contribution.receiptNo,
      date: contribution.date,
      memberId: contribution.memberId,
      memberName: member ? member.fullName : 'Unknown',
      amount: contribution.amount
    };
    
    ReceiptGenerator.printReceipt(receiptData, 'contribution');
  }

  static generateLoanPaymentReceipt(payment, loan, member) {
    const receiptData = {
      receiptNo: `LP${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      memberId: member.id,
      memberName: member.fullName,
      amount: payment.amount,
      remainingAmount: payment.remainingAmount,
      loanId: loan.id
    };
    
    ReceiptGenerator.printReceipt(receiptData, 'loan_payment');
  }
}

class ReceiptGenerator {
  static generateReceipt(data, type = 'savings') {
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    
    let receiptHTML = `
      <div class="receipt-container">
        <div class="receipt-header">
          <h2>${settings.systemName || 'Financial Management System'}</h2>
          <p class="address">${settings.address || 'No Address Set'}</p>
          <p class="contact">${settings.systemEmail || ''}</p>
          <div class="receipt-border"></div>
          <h3>${capitalizedType} Contribution Receipt</h3>
        </div>
        
        <div class="receipt-body">
          <div class="receipt-row">
            <span class="label">Receipt No:</span>
            <span class="value">${data.receiptNo}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Date:</span>
            <span class="value">${new Date(data.date).toLocaleDateString()}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Member ID:</span>
            <span class="value">${data.memberId}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Member Name:</span>
            <span class="value">${data.memberName}</span>
          </div>
          <div class="receipt-border"></div>
          <div class="receipt-row amount">
            <span class="label">${capitalizedType} Amount:</span>
            <span class="value">${window.formatCurrency(data.amount)}</span>
          </div>
          <div class="receipt-border"></div>
        </div>
        
        <div class="receipt-footer">
          <p>${settings.receiptFooter || 'Thank you for your contribution'}</p>
          <p class="small">This is a computer generated receipt</p>
        </div>
      </div>
    `;

    return receiptHTML;
  }
}