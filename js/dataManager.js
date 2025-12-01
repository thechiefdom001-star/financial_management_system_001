import MemberManager from '/js/memberManager.js';
import NotificationManager from '/js/notifications.js';
import ReceiptGenerator from '/js/receiptGenerator.js';
import { adminSettings } from '/js/settings.js';
import AuthService from '/js/authService.js';

const memberManager = new MemberManager();

class DataManager {
  constructor() {
    // Initialize storage with sample data if not exists
    const defaultData = {
      members: [],
      contributions_savings: [],
      contributions_condolence: [], 
      contributions_education: [],
      contributions_health: [],
      loanApplications: [],
      approvedLoans: [],
      loanRepayments: [],
      bonuses: []
    };

    // Initialize storage
    Object.keys(defaultData).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(defaultData[key]));
      }
    });

    this.loadData();

    // Initialize contribution types
    this.contributionTypes = {
      savings: [],
      condolence: [],
      education: [],
      health: []
    };

    // Load contribution data
    Object.keys(this.contributionTypes).forEach(type => {
      const storageKey = `contributions_${type}`;
      this.contributionTypes[type] = JSON.parse(localStorage.getItem(storageKey)) || [];
    });
  }

  loadData() {
    try {
      this.contributions = JSON.parse(localStorage.getItem('contributions')) || [];
      this.loanApplications = JSON.parse(localStorage.getItem('loanApplications')) || [];
      this.approvedLoans = JSON.parse(localStorage.getItem('approvedLoans')) || [];
      this.loanRepayments = JSON.parse(localStorage.getItem('loanRepayments')) || [];
      this.bonuses = JSON.parse(localStorage.getItem('bonuses')) || [];
    } catch (e) {
      console.error('Error loading data:', e);
      this.resetData();
    }
  }

  resetData() {
    this.contributions = [];
    this.loanApplications = [];
    this.approvedLoans = [];
    this.loanRepayments = [];
    this.bonuses = [];
  }

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      document.dispatchEvent(new CustomEvent('dataUpdated'));
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }

  // Add contribution method
  async addContribution(type, contribution) {
    try {
      const storageKey = `contributions_${type}`;
      const contributionId = `CONT-${type.toUpperCase()}-${Date.now()}`;
      
      const newContribution = {
        ...contribution,
        id: contributionId,
        date: new Date().toISOString(),
        receiptNo: `RCP${Date.now().toString().slice(-6)}`
      };
      
      this.contributionTypes[type].push(newContribution);
      localStorage.setItem(storageKey, JSON.stringify(this.contributionTypes[type]));
      
      // Generate receipt
      const member = this.getMemberById(contribution.memberId);
      if (member) {
        await this.generateContributionReceipt(type, newContribution, member);
      }
      
      this.populateContributionTable(type);
      return true;
    } catch (e) {
      console.error(`Error adding ${type} contribution:`, e);
      NotificationManager.show(`Error adding ${type} contribution`, 'error');
      return false;
    }
  }

  // Delete contribution method
  deleteContribution(type, id) {
    try {
      const storageKey = `contributions_${type}`;
      this.contributionTypes[type] = this.contributionTypes[type].filter(c => c.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(this.contributionTypes[type]));
      this.populateContributionTable(type);
      return true;
    } catch (e) {
      console.error(`Error deleting ${type} contribution:`, e);
      return false;
    }
  }

  // Edit contribution method
  editContribution(type, id, newAmount) {
    try {
      const storageKey = `contributions_${type}`;
      const contribution = this.contributionTypes[type].find(c => c.id === id);
      if (contribution) {
        contribution.amount = parseFloat(newAmount);
        localStorage.setItem(storageKey, JSON.stringify(this.contributionTypes[type]));
        this.populateContributionTable(type);
        return true;
      }
      return false;
    } catch (e) {
      console.error(`Error editing ${type} contribution:`, e);
      return false;
    }
  }

  // Populate contribution table
  populateContributionTable(type) {
    const tableId = `${type}Table`;
    const table = $(`#${tableId}`).DataTable();
    table.clear();
    
    this.contributionTypes[type].forEach(contribution => {
      const member = this.getMemberById(contribution.memberId);
      const memberName = member ? member.fullName : 'Unknown Member';
      
      table.row.add([
        contribution.memberId,
        memberName,
        window.formatCurrency(contribution.amount),
        new Date(contribution.date).toLocaleDateString(),
        `<div class="action-buttons">
          <button class="btn btn-sm btn-info print-receipt" data-id="${contribution.id}" data-type="${type}" 
                  title="Print Receipt">
            <i class="fas fa-print"></i>
          </button>
          <button class="btn btn-sm btn-primary edit-contribution" data-id="${contribution.id}" data-type="${type}"
                  title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-contribution" data-id="${contribution.id}" data-type="${type}"
                  title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>`
      ]);
    });
    
    table.draw();
  }

  // Handle loan applications
  addLoanApplication(application) {
    try {
      this.loanApplications.push({
        ...application,
        id: `LOAN${Date.now()}`,
        date: new Date().toISOString(),
        status: 'pending'
      });
      this.saveData('loanApplications', this.loanApplications);
      this.populateLoanApplicationsTable();
      return true;
    } catch (e) {
      console.error('Error adding loan application:', e);
      return false;
    }
  }

  populateLoanApplicationsTable() {
    const table = $('#loanApplicationsTable').DataTable();
    table.clear();
    
    this.loanApplications.forEach(application => {
      const member = memberManager.members.find(m => m.id === application.memberId);
      table.row.add([
        application.memberId,
        member ? member.fullName : 'Unknown',
        window.formatCurrency(application.amount),
        new Date(application.date).toLocaleDateString(),
        application.status,
        `<div class="action-buttons">
          ${application.status === 'pending' ? `
            <button class="btn btn-sm btn-success approve-loan" data-id="${application.id}" title="Approve">
              <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-danger reject-loan" data-id="${application.id}" title="Reject">
              <i class="fas fa-times"></i>
            </button>
          ` : ''}
        </div>`
      ]);
    });
    
    table.draw();
  }

  // Handle approved loans
  approveLoanBase(loanId) {
    try {
      const loanApplication = this.loanApplications.find(l => l.id === loanId);
      if (loanApplication) {
        loanApplication.status = 'approved';
        this.saveData('loanApplications', this.loanApplications);
        
        const approvedLoan = {
          ...loanApplication,
          approvalDate: new Date().toISOString(),
          status: 'active'
        };
        this.approvedLoans.push(approvedLoan);
        this.saveData('approvedLoans', this.approvedLoans);
        
        // Create initial repayment schedule
        this.createLoanRepaymentSchedule(approvedLoan);
        
        this.populateLoanApplicationsTable();
        this.populateApprovedLoansTable();
        this.populateLoanRepaymentsTable();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error approving loan:', e);
      return false;
    }
  }

  approveLoan(loanId) {
    try {
      const result = this.approveLoanBase(loanId);
      if (result) {
        const loan = this.approvedLoans.find(l => l.id === loanId);
        NotificationManager.notifyLoanApproval(loan.memberId, loan.amount);
      }
      return result;
    } catch (e) {
      console.error('Error approving loan:', e);
      return false;
    }
  }

  // Handle loan repayments
  createLoanRepaymentSchedule(loan) {
    try {
      // First remove any existing repayment records for this loan
      this.loanRepayments = this.loanRepayments.filter(r => r.loanId !== loan.id);
      
      const interestRate = adminSettings.interestRate / 100;
      const monthlyRate = interestRate / 12;
      const numberOfPayments = adminSettings.loanTerm;
      const principal = parseFloat(loan.amount);
      
      const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      for (let i = 1; i <= numberOfPayments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        this.loanRepayments.push({
          id: `REP${Date.now()}${i}`,
          loanId: loan.id,
          memberId: loan.memberId,
          amount: monthlyPayment.toFixed(2),
          dueDate: dueDate.toISOString(),
          status: 'pending'
        });
      }
      
      this.saveData('loanRepayments', this.loanRepayments);
      this.populateLoanRepaymentsTable();
    } catch (e) {
      console.error('Error creating repayment schedule:', e);
    }
  }

  // Update recordPartialRepayment method in DataManager class
  async recordPartialRepayment(repaymentId, payment) {
    try {
      const repayment = this.loanRepayments.find(r => r.id === repaymentId);
      if (!repayment) return false;

      const loan = this.approvedLoans.find(l => l.id === repayment.loanId);
      const member = this.getMemberById(repayment.memberId);
      
      if (!loan || !member) return false;

      // Create and show repayment modal
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-money-bill-wave me-2"></i>Record Loan Repayment
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="loan-details mb-4 p-3 bg-light rounded">
                <div class="row">
                  <div class="col-md-3 text-center">
                    <div class="avatar-circle mb-2">
                      <i class="fas fa-user fa-2x"></i>
                    </div>
                    <h6>${member.fullName}</h6>
                    <small class="text-muted">${member.id}</small>
                  </div>
                  <div class="col-md-9">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <div class="info-card bg-info bg-opacity-10 p-2 rounded">
                          <label class="text-info">Loan Amount</label>
                          <h5>${window.formatCurrency(loan.amount)}</h5>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="info-card bg-success bg-opacity-10 p-2 rounded">
                          <label class="text-success">Installment Amount</label>
                          <h5>${window.formatCurrency(repayment.amount)}</h5>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="info-card bg-warning bg-opacity-10 p-2 rounded">
                          <label class="text-warning">Due Date</label>
                          <h5>${new Date(repayment.dueDate).toLocaleDateString()}</h5>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="info-card ${repayment.remainingAmount ? 'bg-info' : 'bg-success'} bg-opacity-10 p-2 rounded">
                          <label class="${repayment.remainingAmount ? 'text-info' : 'text-success'}">Status</label>
                          <h5>${repayment.remainingAmount ? 'Partial Payment' : 'Pending'}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              ${repayment.payments ? `
                <div class="previous-payments mb-4">
                  <h6 class="border-bottom pb-2 mb-3">Previous Payments</h6>
                  <div class="table-responsive">
                    <table class="table table-sm table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${repayment.payments.map(p => `
                          <tr>
                            <td>${new Date(p.date).toLocaleDateString()}</td>
                            <td>${window.formatCurrency(p.amount)}</td>
                            <td><span class="badge bg-secondary">${p.method}</span></td>
                            <td>${p.reference || '-'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : ''}

              <form id="repaymentForm" class="needs-validation" novalidate>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input type="number" class="form-control" id="paymentAmount" 
                             max="${repayment.remainingAmount || repayment.amount}"
                             value="${repayment.remainingAmount || repayment.amount}"
                             step="0.01" required>
                      <label for="paymentAmount">Payment Amount</label>
                    </div>
                    <div class="form-text">
                      Maximum payment: ${window.formatCurrency(repayment.remainingAmount || repayment.amount)}
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input type="date" class="form-control" id="paymentDate" 
                             value="${new Date().toISOString().split('T')[0]}" required>
                      <label for="paymentDate">Payment Date</label>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <div class="form-floating">
                      <select class="form-select" id="paymentMethod" required>
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="mpesa">M-PESA</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                      <label for="paymentMethod">Payment Method</label>
                    </div>
                  </div>

                  <div class="col-md-6" id="referenceField" style="display: none;">
                    <div class="form-floating">
                      <input type="text" class="form-control" id="referenceNumber" 
                             placeholder="Transaction/Reference number">
                      <label for="referenceNumber">Reference Number</label>
                    </div>
                  </div>
                </div>

                <div id="paymentError" class="alert alert-danger mt-3" style="display: none;"></div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="fas fa-times me-2"></i>Cancel
              </button>
              <button type="submit" form="repaymentForm" class="btn btn-primary">
                <i class="fas fa-save me-2"></i>Record Payment
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();

      // Show/hide reference number field based on payment method
      const methodSelect = modal.querySelector('#paymentMethod');
      const referenceField = modal.querySelector('#referenceField');
      methodSelect.addEventListener('change', () => {
        referenceField.style.display = 
          methodSelect.value === 'mpesa' || methodSelect.value === 'bank' 
            ? 'block' 
            : 'none';
      });

      // Handle form submission
      const form = modal.querySelector('#repaymentForm');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('paymentError');
        
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const maxAmount = repayment.remainingAmount || repayment.amount;
        
        if (amount > maxAmount) {
          errorDiv.textContent = `Payment cannot exceed ${window.formatCurrency(maxAmount)}`;
          errorDiv.style.display = 'block';
          return;
        }

        // Record payment details
        const paymentDetails = {
          amount,
          date: document.getElementById('paymentDate').value,
          method: document.getElementById('paymentMethod').value,
          reference: document.getElementById('referenceNumber').value
        };

        // Update repayment record
        let remainingAmount = maxAmount - amount;
        repayment.status = remainingAmount <= 0 ? 'paid' : 'partial';
        repayment.remainingAmount = remainingAmount > 0 ? remainingAmount : 0;
        repayment.paymentDate = paymentDetails.date;
        repayment.paymentMethod = paymentDetails.method;
        repayment.reference = paymentDetails.reference;
        repayment.payments = repayment.payments || [];
        repayment.payments.push(paymentDetails);

        // If there's an overpayment, apply it to the next installment
        if (remainingAmount < 0) {
          const nextRepayment = this.loanRepayments.find(r => 
            r.loanId === loan.id && 
            r.status === 'pending' &&
            new Date(r.dueDate) > new Date(repayment.dueDate)
          );

          if (nextRepayment) {
            const overpayment = Math.abs(remainingAmount);
            nextRepayment.remainingAmount = nextRepayment.amount - overpayment;
            nextRepayment.status = 'partial';
            nextRepayment.payments = nextRepayment.payments || [];
            nextRepayment.payments.push({
              amount: overpayment,
              date: paymentDetails.date,
              method: paymentDetails.method,
              reference: paymentDetails.reference,
              note: 'Automatic rollover from previous installment'
            });
          }

          // Set current repayment as fully paid
          repayment.remainingAmount = 0;
          repayment.status = 'paid';
        }

        // Update loan amount
        loan.paidAmount = (loan.paidAmount || 0) + amount;
        loan.remainingAmount = loan.amount - loan.paidAmount;
        loan.status = loan.remainingAmount <= 0 ? 'completed' : 'active';

        this.saveData('loanRepayments', this.loanRepayments);
        this.saveData('approvedLoans', this.approvedLoans);
        
        // Generate receipt
        const receiptData = {
          receiptNo: `LP${Date.now().toString().slice(-6)}`,
          date: paymentDetails.date,
          memberId: member.id,
          memberName: member.fullName,
          amount: amount,
          remainingAmount: repayment.remainingAmount,
          method: paymentDetails.method,
          reference: paymentDetails.reference,
          type: 'loan_payment'
        };
        
        await ReceiptGenerator.printReceipt(receiptData, 'loan_payment');
        
        modalInstance.hide();
        modal.remove();
        
        this.populateLoanRepaymentsTable();
        this.populateApprovedLoansTable();
        NotificationManager.show('Payment recorded successfully', 'success');
      };

      // Cleanup on modal close
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
      });

      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      NotificationManager.show('Error recording payment', 'error');
      return false;
    }
  }

  // Add view repayment details method
  viewRepaymentDetails(repaymentId) {
    try {
      const repayment = this.loanRepayments.find(r => r.id === repaymentId);
      if (!repayment) return;

      const loan = this.approvedLoans.find(l => l.id === repayment.loanId);
      const member = this.getMemberById(repayment.memberId);
      
      if (!loan || !member) return;

      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-info text-white">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>Repayment Details
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="loan-details mb-4 p-3 bg-light rounded">
                <h6 class="border-bottom pb-2 mb-3">Loan Information</h6>
                <div class="row">
                  <div class="col-md-6">
                    <p><i class="fas fa-user me-2"></i><strong>Member:</strong> ${member.fullName}</p>
                    <p><i class="fas fa-id-card me-2"></i><strong>Member ID:</strong> ${member.id}</p>
                    <p><i class="fas fa-money-check-alt me-2"></i><strong>Total Loan Amount:</strong> ${window.formatCurrency(loan.amount)}</p>
                  </div>
                  <div class="col-md-6">
                    <p><i class="fas fa-calendar me-2"></i><strong>Due Date:</strong> ${new Date(repayment.dueDate).toLocaleDateString()}</p>
                    <p><i class="fas fa-money-bill me-2"></i><strong>Installment Amount:</strong> ${window.formatCurrency(repayment.amount)}</p>
                    <p><i class="fas fa-info-circle me-2"></i><strong>Status:</strong> 
                      <span class="badge bg-${repayment.status === 'pending' ? 'warning' : repayment.status === 'partial' ? 'info' : 'success'}">${repayment.status}</span>
                    </p>
                  </div>
                </div>
                ${repayment.payments ? `
                  <div class="payment-history mt-4">
                    <h6 class="border-bottom pb-2 mb-3">Payment History</h6>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Reference</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${repayment.payments.map(p => `
                            <tr>
                              <td>${new Date(p.date).toLocaleDateString()}</td>
                              <td>${window.formatCurrency(p.amount)}</td>
                              <td>${p.method}</td>
                              <td>${p.reference || '-'}</td>
                              <td>
                                <button class="btn btn-sm btn-info print-receipt" 
                                        data-payment='${JSON.stringify(p)}'>
                                  <i class="fas fa-print"></i>
                                </button>
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                        <tfoot>
                          <tr class="table-active">
                            <td><strong>Total Paid:</strong></td>
                            <td colspan="4">
                              <strong>${window.formatCurrency(repayment.payments.reduce((sum, p) => sum + p.amount, 0))}</strong>
                            </td>
                          </tr>
                          ${repayment.remainingAmount > 0 ? `
                            <tr class="table-warning">
                              <td><strong>Remaining:</strong></td>
                              <td colspan="4">
                                <strong>${window.formatCurrency(repayment.remainingAmount)}</strong>
                              </td>
                            </tr>
                          ` : ''}
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ` : `
                  <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>No payments recorded yet
                  </div>
                `}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${repayment.status !== 'paid' ? `
                <button type="button" class="btn btn-primary record-payment" 
                        data-id="${repayment.id}"
                        data-remaining="${repayment.remainingAmount || repayment.amount}">
                  <i class="fas fa-money-bill-wave me-2"></i>Record Payment
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();

      // Handle print receipt button clicks
      modal.querySelectorAll('.print-receipt').forEach(btn => {
        btn.addEventListener('click', async () => {
          const payment = JSON.parse(btn.dataset.payment);
          const receiptData = {
            receiptNo: `LP${Date.now().toString().slice(-6)}`,
            date: payment.date,
            memberId: member.id,
            memberName: member.fullName,
            amount: payment.amount,
            method: payment.method,
            reference: payment.reference,
            type: 'loan_payment'
          };
          await ReceiptGenerator.printReceipt(receiptData, 'loan_payment');
        });
      });

      // Handle record payment button click
      const recordPaymentBtn = modal.querySelector('.record-payment');
      if (recordPaymentBtn) {
        recordPaymentBtn.addEventListener('click', () => {
          modalInstance.hide();
          this.recordPartialRepayment(repayment.id);
        });
      }

      // Cleanup on modal close
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
      });

    } catch (error) {
      console.error('Error viewing repayment details:', error);
      NotificationManager.show('Error viewing repayment details', 'error');
    }
  }

  // Update populateLoanRepaymentsTable method
  populateLoanRepaymentsTable() {
    try {
      const table = $('#loanRepaymentTable').DataTable();
      table.clear();
      
      this.loanRepayments.forEach(repayment => {
        const loan = this.approvedLoans.find(l => l.id === repayment.loanId);
        const member = this.getMemberById(repayment.memberId);
        
        if (!loan || !member) return;

        table.row.add([
          member.id,
          member.fullName,
          window.formatCurrency(loan.amount),
          window.formatCurrency(repayment.amount),
          new Date(repayment.dueDate).toLocaleDateString(),
          `<span class="badge bg-${repayment.status === 'pending' ? 'warning' : repayment.status === 'partial' ? 'info' : 'success'}">
            ${repayment.status}
          </span>`,
          `<div class="action-buttons">
            ${repayment.status !== 'paid' ? `
              <button class="btn btn-sm btn-success record-payment" 
                      data-id="${repayment.id}" 
                      data-remaining="${repayment.remainingAmount || repayment.amount}"
                      title="Record Payment">
                <i class="fas fa-money-bill-wave"></i>
              </button>
            ` : `
              <button class="btn btn-sm btn-info print-receipt" 
                      data-id="${repayment.id}"
                      title="Print Receipt">
                <i class="fas fa-print"></i>
              </button>
            `}
            <button class="btn btn-sm btn-primary view-details" 
                    data-id="${repayment.id}"
                    title="View Details">
              <i class="fas fa-eye"></i>
            </button>
          </div>`
        ]);
      });
      
      table.draw();

      // Add event listeners for action buttons
      $('#loanRepaymentTable').off('click').on('click', 'button', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const repaymentId = btn.dataset.id;

        if (btn.classList.contains('record-payment')) {
          await this.recordPartialRepayment(repaymentId);
        } else if (btn.classList.contains('print-receipt')) {
          const repayment = this.loanRepayments.find(r => r.id === repaymentId);
          if (repayment && repayment.payments && repayment.payments.length > 0) {
            const lastPayment = repayment.payments[repayment.payments.length - 1];
            const member = this.getMemberById(repayment.memberId);
            const receiptData = {
              receiptNo: `LP${Date.now().toString().slice(-6)}`,
              date: lastPayment.date,
              memberId: member.id,
              memberName: member.fullName,
              amount: lastPayment.amount,
              method: lastPayment.method,
              reference: lastPayment.reference,
              type: 'loan_payment'
            };
            await ReceiptGenerator.printReceipt(receiptData, 'loan_payment');
          }
        } else if (btn.classList.contains('view-details')) {
          this.viewRepaymentDetails(repaymentId);
        }
      });
    } catch (e) {
      console.error('Error populating loan repayments table:', e);
    }
  }

  // Handle contribution receipt printing
  generateContributionReceipt(type, contribution, member) {
    const receiptData = {
      receiptNo: contribution.receiptNo,
      date: contribution.date,
      memberId: contribution.memberId,
      memberName: member ? member.fullName : 'Unknown',
      amount: contribution.amount,
      type: type
    };
    
    ReceiptGenerator.printReceipt(receiptData, type);
  }

  // Get member by ID
  getMemberById(id) {
    const members = JSON.parse(localStorage.getItem('members')) || [];
    return members.find(m => m.id === id) || null;
  }

  // Event handlers for registration
  handleRegistration() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newMember = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
      };

      try {
        if (memberManager.addMember(newMember)) {
          NotificationManager.show('Member registered successfully', 'success');
          this.populateRegistrationTable();
          this.populateApprovedMembersTable();
          this.populateMemberDropdowns();
          form.reset();
        } else {
          NotificationManager.show('Error registering member', 'error');
        }
      } catch (e) {
        console.error('Error in member registration:', e);
        NotificationManager.show('Error registering member: ' + e.message, 'error');
      }
    });

    // Handle member actions
    document.addEventListener('click', async (e) => {
      const approveBtn = e.target.closest('.approve-member');
      if (approveBtn) {
        const id = approveBtn.dataset.id;
        if (await AuthService.requireLogin('approve this member')) {
          const result = memberManager.updateMember(id, {
            status: 'approved',
            approvalDate: new Date().toISOString()
          });
          if (result) {
            NotificationManager.show('Member approved successfully', 'success');
            this.populateRegistrationTable();
            this.populateApprovedMembersTable();
            this.populateMemberDropdowns();
          }
        }
      }

      const rejectBtn = e.target.closest('.reject-member');
      if (rejectBtn) {
        const id = rejectBtn.dataset.id;
        const result = memberManager.updateMember(id, { status: 'rejected' });
        if (result) {
          NotificationManager.show('Member rejected', 'warning');
          this.populateRegistrationTable();
        }
      }
    });
  }

  // Initialize tables
  initializeTables() {
    try {
      const tableIds = [
        'savingsTable',
        'condolenceTable',
        'educationTable',
        'healthTable',
        'contributionsTable',
        'approvedLoansTable',
        'loanApplicationsTable',
        'loanRepaymentTable',
        'bonusTable',
        'performanceTable'
      ];

      tableIds.forEach(tableId => {
        const tableElement = document.getElementById(tableId);
        if (!tableElement) return;
        
        if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
          $(`#${tableId}`).DataTable().destroy();
        }
        
        try {
          $(`#${tableId}`).DataTable({
            pageLength: parseInt(adminSettings?.tableRows || 10),
            responsive: true,
            language: {
              emptyTable: "No data available"
            }
          });
        } catch (e) {
          console.warn(`Could not initialize table ${tableId}:`, e);
        }
      });
    } catch (e) {
      console.error('Error initializing tables:', e);
    }
  }

  // Initialize all functionality
  initialize() {
    try {
      this.initializeTables();
      this.populateRegistrationTable();
      this.populateApprovedMembersTable();
      this.populateLoanApplicationsTable();
      this.populateApprovedLoansTable();
      this.populateLoanRepaymentsTable();
      this.populatePerformanceTable();
      this.populateMemberDropdowns();
      
      // Listen for member status changes
      document.addEventListener('memberStatusChanged', () => {
        this.populateMemberDropdowns();
      });

      this.handleRegistration();
      this.setupEventHandlers();
      this.calculateBonuses();
      this.populateBonusTable();
      this.initializeContributions();
    } catch (e) {
      console.error('Error during initialization:', e);
    }
  }

  setupEventHandlers() {
    // Contribution form handler
    $('#contributionForm').on('submit', (e) => {
      e.preventDefault();
      const contribution = {
        memberId: $('#contributionMemberId').val(),
        amount: $('#contributionAmount').val()
      };
      this.addContribution('savings', contribution);
      $('#contributionForm')[0].reset();
    });

    // Loan application form handler
    $('#loanApplicationForm').on('submit', async (e) => {
      e.preventDefault();
      const application = {
        memberId: $('#loanMemberId').val(),
        amount: parseFloat($('#loanAmount').val()),
        purpose: $('#loanPurpose').val()
      };
      
      if (await this.addLoanApplication(application)) {
        $('#loanApplicationForm')[0].reset();
        NotificationManager.show('Loan application submitted successfully', 'success');
      }
    });

    // Loan approval handler
    $('#loanApplicationsTable').on('click', '.approve-loan', async (e) => {
      const id = $(e.target).closest('.approve-loan').data('id');
      if (await AuthService.requireLogin('approve this loan')) {
        if (await this.approveLoan(id)) {
          NotificationManager.show('Loan approved successfully', 'success');
        }
      }
    });

    // Payment recording handler
    $('#loanRepaymentTable').on('click', '.record-payment', (e) => {
      const btn = $(e.target);
      const repaymentId = btn.data('id');
      const remainingAmount = parseFloat(btn.data('remaining'));
      
      const amount = prompt(`Enter payment amount (max: ${window.formatCurrency(remainingAmount)}):`, remainingAmount);
      if (amount && !isNaN(amount) && parseFloat(amount) <= remainingAmount) {
        this.recordPartialRepayment(repaymentId, parseFloat(amount));
      }
    });

    // Handle contribution receipt printing
    $('#contributionsTable').on('click', '.print-receipt', (e) => {
      const contributionId = $(e.target).data('id');
      const contribution = this.contributions.find(c => c.id === contributionId);
      if (contribution) {
        this.generateContributionReceipt('savings', contribution);
      }
    });
  }

  async recordLoanPayment(repaymentId, amount) {
    try {
      const repayment = this.loanRepayments.find(r => r.id === repaymentId);
      if (!repayment) return false;

      const loan = this.approvedLoans.find(l => l.id === repayment.loanId);
      const member = this.getMemberById(repayment.memberId);
      
      if (!loan || !member) return false;

      // Update repayment status
      const remainingAmount = parseFloat(repayment.amount) - parseFloat(amount);
      repayment.status = remainingAmount <= 0 ? 'paid' : 'partial';
      repayment.remainingAmount = remainingAmount > 0 ? remainingAmount : 0;
      repayment.paymentDate = new Date().toISOString();

      this.saveData('loanRepayments', this.loanRepayments);

      // Generate receipt
      const receiptData = {
        receiptNo: `LP${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        memberId: member.id,
        memberName: member.fullName,
        amount: amount,
        remainingAmount: repayment.remainingAmount,
        type: 'loan_payment'
      };
      
      await ReceiptGenerator.printReceipt(receiptData, 'loan_payment');
      return true;
    } catch (e) {
      console.error('Error recording loan payment:', e);
      return false;
    }
  }

  // Add new methods for table population
  populateRegistrationTable() {
    try {
      const tableElement = document.getElementById('registrationTable');
      if (!tableElement) return;
      
      if ($.fn.DataTable.isDataTable('#registrationTable')) {
        $('#registrationTable').DataTable().destroy();
      }
      
      $('#registrationTable').DataTable({
        pageLength: parseInt(adminSettings?.tableRows || 10),
        responsive: true,
        language: {
          emptyTable: "No data available"
        }
      });

      const table = $('#registrationTable').DataTable();
      table.clear();
      
      memberManager.members.forEach(member => {
        table.row.add([
          member.id,
          member.fullName,
          member.email,
          member.phone,
          member.status,
          `<div class="action-buttons">
            <button class="btn btn-sm btn-primary edit-member" data-id="${member.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            ${member.status === 'pending' ? 
              `<button class="btn btn-sm btn-success approve-member" data-id="${member.id}" title="Approve">
                 <i class="fas fa-check"></i>
               </button>
               <button class="btn btn-sm btn-danger reject-member" data-id="${member.id}" title="Reject">
                 <i class="fas fa-times"></i>
               </button>` : 
              ''}
          </div>`
        ]);
      });
      
      table.draw();
    } catch (e) {
      console.error('Error populating registration table:', e);
    }
  }

  populateApprovedMembersTable() {
    try {
      const tableElement = document.getElementById('approvedMembersTable');
      if (!tableElement) return;
      
      if ($.fn.DataTable.isDataTable('#approvedMembersTable')) {
        $('#approvedMembersTable').DataTable().destroy();
      }
      
      $('#approvedMembersTable').DataTable({
        pageLength: parseInt(adminSettings?.tableRows || 10),
        responsive: true,
        language: {
          emptyTable: "No data available"
        }
      });

      const table = $('#approvedMembersTable').DataTable();
      table.clear();
      
      const approvedMembers = memberManager.members.filter(m => m.status === 'approved');
      approvedMembers.forEach(member => {
        table.row.add([
          member.id,
          member.fullName,
          member.email,
          member.phone,
          member.approvalDate ? new Date(member.approvalDate).toLocaleDateString() : '-',
          `<div class="action-buttons">
            <button class="btn btn-sm btn-primary edit-member" data-id="${member.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-member" data-id="${member.id}" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>`
        ]);
      });
      
      table.draw();
    } catch (e) {
      console.error('Error populating approved members table:', e);
    }
  }

  populateMemberDropdowns() {
    try {
      const approvedMembers = memberManager.members.filter(m => m.status === 'approved');
      const options = approvedMembers
        .map(member => 
          `<option value="${member.id}">${member.id} - ${member.fullName}</option>`
        ).join('');

      // Update all member select dropdowns
      const memberSelects = document.querySelectorAll('.member-select, #loanMemberId, #contributionMemberId');
      memberSelects.forEach(select => {
        select.innerHTML = `<option value="">Select Member</option>${options}`;
      });
    } catch (e) {
      console.error('Error populating member dropdowns:', e);
    }
  }

  calculateBonuses() {
    try {
      // Clear existing bonuses
      this.bonuses = [];
      
      // Get all approved members
      const members = JSON.parse(localStorage.getItem('members')) || [];
      const approvedMembers = members.filter(m => m.status === 'approved');
      
      approvedMembers.forEach(member => {
        // Calculate total contributions for all types
        let totalContributions = 0;
        const contributionTypes = ['savings', 'condolence', 'education', 'health'];
        
        contributionTypes.forEach(type => {
          const typeContributions = this.contributionTypes[type] || [];
          const memberContributions = typeContributions
            .filter(c => c.memberId === member.id)
            .reduce((sum, c) => sum + parseFloat(c.amount), 0);
          totalContributions += memberContributions;
        });

        // Calculate loan repayment score
        const memberLoans = this.loanRepayments.filter(r => r.memberId === member.id);
        let repaymentScore = 1; // Default perfect score
        
        if (memberLoans.length > 0) {
          const onTimePayments = memberLoans.filter(r => 
            r.status === 'paid' && new Date(r.paymentDate) <= new Date(r.dueDate)
          ).length;
          repaymentScore = onTimePayments / memberLoans.length;
        }

        // Calculate bonus amount:
        // Base: 5% of total contributions
        // Multiplier: Repayment score (0-1) adds up to 50% bonus
        const baseBonus = totalContributions * 0.05;
        const repaymentBonus = baseBonus * (repaymentScore * 0.5);
        const totalBonus = (baseBonus + repaymentBonus).toFixed(2);

        // Create bonus record
        this.bonuses.push({
          id: `BON${Date.now()}-${member.id}`,
          memberId: member.id,
          amount: totalBonus,
          contributionTotal: totalContributions,
          repaymentScore: repaymentScore,
          date: new Date().toISOString(),
          status: 'calculated',
          details: {
            baseBonus,
            repaymentBonus,
            totalContributions,
            repaymentScore
          }
        });
      });
      
      localStorage.setItem('bonuses', JSON.stringify(this.bonuses));
      this.populateBonusTable();
      
    } catch (e) {
      console.error('Error calculating bonuses:', e);
    }
  }

  populateBonusTable() {
    const tableElement = document.getElementById('bonusTable');
    if (!tableElement || !$.fn.DataTable.isDataTable('#bonusTable')) return;
    
    const table = $('#bonusTable').DataTable();
    table.clear();
    
    this.bonuses.forEach(bonus => {
      const member = this.getMemberById(bonus.memberId);
      const memberName = member ? member.fullName : 'Unknown Member';
      
      table.row.add([
        bonus.memberId,
        memberName,
        window.formatCurrency(bonus.amount),
        new Date(bonus.date).toLocaleDateString(),
        `<span class="badge bg-${bonus.status === 'approved' ? 'success' : 'warning'}">
          ${bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
         </span><br>
         Contribution: ${window.formatCurrency(bonus.contributionTotal)}<br>
         Repayment Score: ${(bonus.repaymentScore * 100).toFixed(1)}%`,
        `<div class="action-buttons">
          ${bonus.status !== 'approved' ? `
            <button class="btn btn-sm btn-success approve-bonus" data-id="${bonus.id}" title="Approve Bonus">
              <i class="fas fa-check"></i>
            </button>
          ` : `
            <button class="btn btn-sm btn-info print-bonus-receipt" data-id="${bonus.id}" title="Print Receipt">
              <i class="fas fa-print"></i>
            </button>
          `}
          <button class="btn btn-sm btn-primary view-bonus-details" data-id="${bonus.id}" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
        </div>`
      ]);
    });
    
    table.draw();

    // Add event listeners for bonus actions
    $('#bonusTable').off('click').on('click', 'button', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const bonusId = btn.dataset.id;
      const bonus = this.bonuses.find(b => b.id === bonusId);
      
      if (!bonus) return;

      if (btn.classList.contains('approve-bonus')) {
        const canProceed = await AuthService.requireLogin('approve this bonus');
        if (!canProceed) return;

        bonus.status = 'approved';
        bonus.approvalDate = new Date().toISOString();
        this.saveData('bonuses', this.bonuses);
        
        const member = this.getMemberById(bonus.memberId);
        if (member) {
          // Only call notification if we have member data
          NotificationManager.notifyBonusApproval(bonus.memberId, bonus.amount);
          
          // Generate and print receipt
          const receiptData = {
            receiptNo: `BON${Date.now().toString().slice(-6)}`,
            date: bonus.approvalDate,
            memberId: bonus.memberId,
            memberName: member.fullName,
            amount: bonus.amount,
            type: 'bonus',
            details: {
              contributionTotal: bonus.contributionTotal,
              repaymentScore: bonus.repaymentScore,
              baseBonus: bonus.details.baseBonus,
              repaymentBonus: bonus.details.repaymentBonus
            }
          };
          
          await ReceiptGenerator.printBonusReceipt(receiptData);
        }
        
        this.populateBonusTable();
        NotificationManager.show('Bonus approved successfully', 'success');
        
      } else if (btn.classList.contains('print-bonus-receipt')) {
        const member = this.getMemberById(bonus.memberId);
        if (member) {
          const receiptData = {
            receiptNo: `BON${Date.now().toString().slice(-6)}`,
            date: bonus.approvalDate || bonus.date,
            memberId: bonus.memberId,
            memberName: member.fullName,
            amount: bonus.amount,
            type: 'bonus',
            details: {
              contributionTotal: bonus.contributionTotal,
              repaymentScore: bonus.repaymentScore,
              baseBonus: bonus.details.baseBonus,
              repaymentBonus: bonus.details.repaymentBonus
            }
          };
          await ReceiptGenerator.printBonusReceipt(receiptData);
        }
        
      } else if (btn.classList.contains('view-bonus-details')) {
        this.viewBonusDetails(bonusId);
      }
    });
  }

  async generateBonusReceipt(bonus) {
    const member = this.getMemberById(bonus.memberId);
    if (!member) return;

    const receiptData = {
      receiptNo: `BON${Date.now().toString().slice(-6)}`,
      date: bonus.approvalDate || bonus.date,
      memberId: bonus.memberId,
      memberName: member.fullName,
      amount: bonus.amount,
      type: 'bonus',
      details: {
        contributionTotal: bonus.contributionTotal,
        repaymentScore: bonus.repaymentScore,
        baseBonus: bonus.details.baseBonus,
        repaymentBonus: bonus.details.repaymentBonus
      }
    };

    await ReceiptGenerator.printBonusReceipt(receiptData);
  }

  viewBonusDetails(bonusId) {
    const bonus = this.bonuses.find(b => b.id === bonusId);
    if (!bonus) return;

    const member = this.getMemberById(bonus.memberId);
    if (!member) return;

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-gift me-2"></i>Bonus Details
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="bonus-details mb-4 p-3 bg-light rounded">
              <h6 class="border-bottom pb-2 mb-3">Member Information</h6>
              <div class="row">
                <div class="col-md-6">
                  <p><i class="fas fa-user me-2"></i><strong>Member:</strong> ${member.fullName}</p>
                  <p><i class="fas fa-id-card me-2"></i><strong>Member ID:</strong> ${member.id}</p>
                  <p><i class="fas fa-calendar me-2"></i><strong>Date:</strong> ${new Date(bonus.date).toLocaleDateString()}</p>
                </div>
                <div class="col-md-6">
                  <p><i class="fas fa-money-bill-wave me-2"></i><strong>Bonus Amount:</strong> ${window.formatCurrency(bonus.amount)}</p>
                  <p><i class="fas fa-chart-line me-2"></i><strong>Repayment Score:</strong> ${(bonus.repaymentScore * 100).toFixed(1)}%</p>
                  <p><i class="fas fa-piggy-bank me-2"></i><strong>Total Contributions:</strong> ${window.formatCurrency(bonus.contributionTotal)}</p>
                </div>
              </div>
              <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Bonus Calculation:</strong><br>
                This bonus was calculated based on the member's total contributions and loan repayment history.
                The repayment score represents the ratio of timely loan payments.
              </div>
              <div class="text-center mt-3">
                <span class="badge bg-${bonus.status === 'approved' ? 'success' : 'warning'} p-2">
                  <i class="fas fa-${bonus.status === 'approved' ? 'check-circle' : 'clock'} me-2"></i>
                  Status: ${bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            ${bonus.status === 'approved' ? `
              <button type="button" class="btn btn-info print-bonus-receipt" data-id="${bonus.id}">
                <i class="fas fa-print me-2"></i>Print Receipt
              </button>
            ` : `
              <button type="button" class="btn btn-success approve-bonus" data-id="${bonus.id}">
                <i class="fas fa-check me-2"></i>Approve Bonus
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Handle modal button clicks
    modal.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (btn.classList.contains('approve-bonus')) {
          const bonusId = btn.dataset.id;
          const bonus = this.bonuses.find(b => b.id === bonusId);
          if (bonus) {
            bonus.status = 'approved';
            bonus.approvalDate = new Date().toISOString();
            this.saveData('bonuses', this.bonuses);
            modalInstance.hide();
            this.populateBonusTable();
            NotificationManager.notifyBonusApproval(bonus.memberId, bonus.amount);
          }
        } else if (btn.classList.contains('print-bonus-receipt')) {
          const bonusId = btn.dataset.id;
          const bonus = this.bonuses.find(b => b.id === bonusId);
          if (bonus) {
            const member = this.getMemberById(bonus.memberId);
            const receiptData = {
              receiptNo: `BON${Date.now().toString().slice(-6)}`,
              date: bonus.approvalDate || bonus.date,
              memberId: bonus.memberId,
              memberName: member ? member.fullName : 'Unknown',
              amount: bonus.amount,
              type: 'bonus',
              details: {
                contributionTotal: bonus.contributionTotal,
                repaymentScore: bonus.repaymentScore,
                baseBonus: bonus.details.baseBonus,
                repaymentBonus: bonus.details.repaymentBonus
              }
            };
            await ReceiptGenerator.printBonusReceipt(receiptData);
          }
        }
      });
    });

    // Cleanup on modal close
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }

  initializeContributions() {
    // Initialize contribution tables
    Object.keys(this.contributionTypes).forEach(type => {
      const tableId = `${type}Table`;
      if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
        $(`#${tableId}`).DataTable().destroy();
      }
      
      $(`#${tableId}`).DataTable({
        pageLength: parseInt(adminSettings.tableRows),
        responsive: true,
        language: {
          emptyTable: "No data available"
        }
      });
      
      this.populateContributionTable(type);
    });

    // Setup contribution form handlers
    document.querySelectorAll('.contribution-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = e.target.dataset.type;
        const contribution = {
          memberId: e.target.querySelector('.member-select').value,
          amount: parseFloat(e.target.querySelector('input[type="number"]').value),
          date: e.target.querySelector('input[type="date"]').value
        };
        
        if (await this.addContribution(type, contribution)) {
          e.target.reset();
          NotificationManager.show(`${type.charAt(0).toUpperCase() + type.slice(1)} contribution added successfully`, 'success');
        }
      });
    });

    // Setup action button handlers
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const id = target.dataset.id;
      const type = target.dataset.type;

      if (target.classList.contains('edit-contribution')) {
        const newAmount = prompt('Enter new amount:');
        if (newAmount && !isNaN(newAmount)) {
          if (await this.editContribution(type, id, newAmount)) {
            NotificationManager.show('Contribution updated successfully', 'success');
          }
        }
      } else if (target.classList.contains('delete-contribution')) {
        if (confirm('Are you sure you want to delete this contribution?')) {
          if (await this.deleteContribution(type, id)) {
            NotificationManager.show('Contribution deleted successfully', 'success');
          }
        }
      }
    });
  }

  populateApprovedLoansTable() {
    const tableElement = document.getElementById('approvedLoansTable');
    if (!tableElement || !$.fn.DataTable.isDataTable('#approvedLoansTable')) return;
    
    const table = $('#approvedLoansTable').DataTable();
    table.clear();
    
    this.approvedLoans.forEach(loan => {
      const member = this.getMemberById(loan.memberId);
      const memberName = member ? member.fullName : 'Unknown Member';
      
      table.row.add([
        loan.memberId,
        memberName,
        window.formatCurrency(loan.amount),
        new Date(loan.approvalDate).toLocaleDateString(),
        `<span class="badge bg-${loan.status === 'active' ? 'success' : loan.status === 'completed' ? 'info' : 'danger'}">
          ${loan.status}
        </span>`,
        `<div class="action-buttons">
          <button class="btn btn-sm btn-primary view-loan-details" data-id="${loan.id}" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-info print-loan-receipt" data-id="${loan.id}" title="Print">
            <i class="fas fa-print"></i>
          </button>
        </div>`
      ]);
    });
    
    table.draw();

    // Add event handlers for action buttons
    $('#approvedLoansTable').off('click', 'button').on('click', 'button', (e) => {
      const btn = $(e.target).closest('button');
      if (!btn.length) return;

      const loanId = btn.data('id');
      const loan = this.approvedLoans.find(l => l.id === loanId);

      if (!loan) return;

      if (btn.hasClass('view-loan-details')) {
        this.viewLoanDetails(loanId);
      } else if (btn.hasClass('print-loan-receipt')) {
        const member = this.getMemberById(loan.memberId);
        if (member) {
          const receiptData = {
            receiptNo: `LOAN${Date.now().toString().slice(-6)}`,
            date: loan.approvalDate,
            memberId: loan.memberId,
            memberName: member.fullName,
            amount: loan.amount,
            type: 'loan_approval'
          };
          ReceiptGenerator.printReceipt(receiptData, 'loan_approval');
        }
      }
    });
  }

  viewLoanDetails(loanId) {
    const loan = this.approvedLoans.find(l => l.id === loanId);
    if (!loan) return;

    const member = this.getMemberById(loan.memberId);
    if (!member) return;

    // Get repayment details for this loan
    const repayments = this.loanRepayments.filter(r => r.loanId === loanId);
    const paidRepayments = repayments.filter(r => r.status === 'paid').length;
    const totalRepayments = repayments.length;
    const totalPaid = repayments.filter(r => r.status === 'paid').reduce((sum, r) => {
      if (r.payments) {
        return sum + r.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      }
      return sum;
    }, 0);

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-file-invoice-dollar me-2"></i>Loan Details
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="loan-info mb-4 p-3 bg-light rounded">
              <div class="row">
                <div class="col-md-6">
                  <p><i class="fas fa-user me-2"></i><strong>Member:</strong> ${member.fullName}</p>
                  <p><i class="fas fa-id-card me-2"></i><strong>Member ID:</strong> ${member.id}</p>
                  <p><i class="fas fa-envelope me-2"></i><strong>Email:</strong> ${member.email}</p>
                </div>
                <div class="col-md-6">
                  <p><i class="fas fa-phone me-2"></i><strong>Phone:</strong> ${member.phone}</p>
                  <p><i class="fas fa-calendar me-2"></i><strong>Approval Date:</strong> ${new Date(loan.approvalDate).toLocaleDateString()}</p>
                  <p><i class="fas fa-badge-check me-2"></i><strong>Status:</strong> 
                    <span class="badge bg-${loan.status === 'active' ? 'success' : 'info'}">${loan.status}</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card border-primary">
                  <div class="card-body">
                    <h6 class="card-title text-primary">
                      <i class="fas fa-money-bill-wave me-2"></i>Loan Amount
                    </h6>
                    <h3 class="text-primary">${window.formatCurrency(loan.amount)}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card border-success">
                  <div class="card-body">
                    <h6 class="card-title text-success">
                      <i class="fas fa-check-circle me-2"></i>Amount Paid
                    </h6>
                    <h3 class="text-success">${window.formatCurrency(totalPaid)}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-4">
                <div class="alert alert-info text-center">
                  <h6>Total Installments</h6>
                  <h3>${totalRepayments}</h3>
                </div>
              </div>
              <div class="col-md-4">
                <div class="alert alert-success text-center">
                  <h6>Paid</h6>
                  <h3>${paidRepayments}</h3>
                </div>
              </div>
              <div class="col-md-4">
                <div class="alert alert-warning text-center">
                  <h6>Pending</h6>
                  <h3>${totalRepayments - paidRepayments}</h3>
                </div>
              </div>
            </div>

            <h6 class="border-bottom pb-2 mb-3">Recent Repayments</h6>
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${repayments.slice(0, 5).map(r => `
                    <tr>
                      <td>${new Date(r.dueDate).toLocaleDateString()}</td>
                      <td>${window.formatCurrency(r.amount)}</td>
                      <td><span class="badge bg-${r.status === 'pending' ? 'warning' : r.status === 'partial' ? 'info' : 'success'}">${r.status}</span></td>
                      <td>
                        <button class="btn btn-xs btn-sm btn-primary view-repayment" data-id="${r.id}" title="View">
                          <i class="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-info print-loan-details-btn" data-id="${loan.id}">
              <i class="fas fa-print me-2"></i>Print Details
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Handle button clicks in modal
    modal.querySelectorAll('.view-repayment').forEach(btn => {
      btn.addEventListener('click', () => {
        const repaymentId = btn.dataset.id;
        modalInstance.hide();
        this.viewRepaymentDetails(repaymentId);
      });
    });

    modal.querySelector('.print-loan-details-btn').addEventListener('click', () => {
      const member = this.getMemberById(loan.memberId);
      if (member) {
        const receiptData = {
          receiptNo: `LOAN${Date.now().toString().slice(-6)}`,
          date: loan.approvalDate,
          memberId: loan.memberId,
          memberName: member.fullName,
          amount: loan.amount,
          type: 'loan_approval'
        };
        ReceiptGenerator.printReceipt(receiptData, 'loan_approval');
      }
    });

    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }

  populatePerformanceTable() {
    const tableElement = document.getElementById('performanceTable');
    if (!tableElement || !$.fn.DataTable.isDataTable('#performanceTable')) return;
    
    const table = $('#performanceTable').DataTable();
    table.clear();
    
    const members = JSON.parse(localStorage.getItem('members')) || [];
    const approvedMembers = members.filter(m => m.status === 'approved');
    
    approvedMembers.forEach(member => {
      const memberLoans = this.loanRepayments.filter(r => r.memberId === member.id);
      const totalPayments = memberLoans.length;
      const onTimePayments = memberLoans.filter(r => 
        r.status === 'paid' && r.paymentDate && new Date(r.paymentDate) <= new Date(r.dueDate)
      ).length;
      const latePayments = memberLoans.filter(r => 
        r.status === 'paid' && r.paymentDate && new Date(r.paymentDate) > new Date(r.dueDate)
      ).length;
      
      // Rating system: 5 stars for on-time, 2.5 for late, warning for default
      let rating = '';
      if (totalPayments === 0) {
        rating = '<i class="fas fa-circle" style="color: #ccc;"></i> No loans';
      } else if (onTimePayments === totalPayments) {
        rating = '<i class="fas fa-star" style="color: gold;"></i>'.repeat(5);
      } else if (onTimePayments >= totalPayments * 0.8) {
        rating = '<i class="fas fa-star" style="color: gold;"></i>'.repeat(5);
      } else if (onTimePayments >= totalPayments * 0.5) {
        rating = '<i class="fas fa-star" style="color: gold;"></i>'.repeat(2) + 
                '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
      } else {
        rating = '<i class="fas fa-exclamation-triangle" style="color: red;"></i>'.repeat(5);
      }
      
      table.row.add([
        member.id,
        member.fullName,
        totalPayments,
        onTimePayments,
        latePayments,
        rating,
        `<div class="action-buttons">
          <button class="btn btn-sm btn-primary view-performance" data-id="${member.id}" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
        </div>`
      ]);
    });
    
    table.draw();

    // Add event listener for view-performance button
    $('#performanceTable').off('click', '.view-performance').on('click', '.view-performance', (e) => {
      const memberId = $(e.target).closest('.view-performance').data('id');
      this.viewPerformanceDetails(memberId);
    });
  }

  viewPerformanceDetails(memberId) {
    try {
      const member = this.getMemberById(memberId);
      if (!member) {
        NotificationManager.show('Member not found', 'error');
        return;
      }

      const memberLoans = this.loanRepayments.filter(r => r.memberId === memberId);
      const totalPayments = memberLoans.length;
      const onTimePayments = memberLoans.filter(r => 
        r.status === 'paid' && r.paymentDate && new Date(r.paymentDate) <= new Date(r.dueDate)
      ).length;
      const latePayments = memberLoans.filter(r => 
        r.status === 'paid' && r.paymentDate && new Date(r.paymentDate) > new Date(r.dueDate)
      ).length;
      const pendingPayments = memberLoans.filter(r => r.status !== 'paid').length;

      const performanceScore = totalPayments > 0 ? ((onTimePayments / totalPayments) * 100).toFixed(1) : 0;
      const performanceRating = performanceScore >= 80 ? 'Excellent' : performanceScore >= 60 ? 'Good' : performanceScore >= 40 ? 'Average' : 'Poor';

      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-chart-line me-2"></i>Member Performance Details
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="member-info mb-4 p-3 bg-light rounded">
                <div class="row">
                  <div class="col-md-6">
                    <p><i class="fas fa-user me-2"></i><strong>Member:</strong> ${member.fullName}</p>
                    <p><i class="fas fa-id-card me-2"></i><strong>Member ID:</strong> ${member.id}</p>
                    <p><i class="fas fa-envelope me-2"></i><strong>Email:</strong> ${member.email}</p>
                  </div>
                  <div class="col-md-6">
                    <p><i class="fas fa-phone me-2"></i><strong>Phone:</strong> ${member.phone}</p>
                    <p><i class="fas fa-calendar me-2"></i><strong>Member Since:</strong> ${new Date(member.registrationDate).toLocaleDateString()}</p>
                    <p><i class="fas fa-check-circle me-2"></i><strong>Status:</strong> <span class="badge bg-success">${member.status}</span></p>
                  </div>
                </div>
              </div>

              <div class="row mb-4">
                <div class="col-md-6">
                  <div class="card border-primary">
                    <div class="card-body text-center">
                      <h6 class="card-title text-primary">
                        <i class="fas fa-tasks me-2"></i>Performance Score
                      </h6>
                      <h2 class="text-primary">${performanceScore}%</h2>
                      <p class="mb-0"><strong>${performanceRating}</strong></p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card border-success">
                    <div class="card-body text-center">
                      <h6 class="card-title text-success">
                        <i class="fas fa-money-bill-wave me-2"></i>Total Loan Payments
                      </h6>
                      <h2 class="text-success">${totalPayments}</h2>
                      <p class="mb-0">Installments</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row mb-4">
                <div class="col-md-4">
                  <div class="alert alert-success text-center">
                    <h6 class="mb-1">On-Time Payments</h6>
                    <h3 class="mb-0">${onTimePayments}</h3>
                    <small class="text-muted">${totalPayments > 0 ? ((onTimePayments/totalPayments)*100).toFixed(0) : 0}%</small>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="alert alert-warning text-center">
                    <h6 class="mb-1">Late Payments</h6>
                    <h3 class="mb-0">${latePayments}</h3>
                    <small class="text-muted">${totalPayments > 0 ? ((latePayments/totalPayments)*100).toFixed(0) : 0}%</small>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="alert alert-info text-center">
                    <h6 class="mb-1">Pending Payments</h6>
                    <h3 class="mb-0">${pendingPayments}</h3>
                    <small class="text-muted">${totalPayments > 0 ? ((pendingPayments/totalPayments)*100).toFixed(0) : 0}%</small>
                  </div>
                </div>
              </div>

              ${totalPayments > 0 ? `
                <h6 class="border-bottom pb-2 mb-3">Recent Loan Installments</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${memberLoans.slice(0, 10).map(loan => `
                        <tr>
                          <td>${new Date(loan.dueDate).toLocaleDateString()}</td>
                          <td>${window.formatCurrency(loan.amount)}</td>
                          <td><span class="badge bg-${loan.status === 'pending' ? 'warning' : loan.status === 'partial' ? 'info' : 'success'}">${loan.status}</span></td>
                          <td>${loan.paymentDate ? new Date(loan.paymentDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i>No loan payments recorded yet
                </div>
              `}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();

      // Cleanup on modal close
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
      });
    } catch (error) {
      console.error('Error viewing performance details:', error);
      NotificationManager.show('Error viewing performance details', 'error');
    }
  }
}

// Make dataManager global
window.dataManager = new DataManager();

export default window.dataManager;