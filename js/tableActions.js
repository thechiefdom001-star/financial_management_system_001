import AuthService from '/js/authService.js';
import NotificationManager from '/js/notifications.js';

class TableActions {
  static async handleEdit(type, id) {
    try {
      const data = JSON.parse(localStorage.getItem(type)) || [];
      const item = data.find(i => i.id === id);
      
      if (!item) {
        NotificationManager.show('Record not found', 'error');
        return;
      }

      switch(type) {
        case 'contributions':
          await this.editContribution(item);
          break;
        case 'loanApplications':
          await this.editLoanApplication(item);
          break;
        case 'members':
          await this.editMember(item);
          break;
        default:
          NotificationManager.show('Edit not supported for this type', 'warning');
          return;
      }

      NotificationManager.show('Record updated successfully', 'success');
    } catch (error) {
      console.error('Error editing record:', error);
      NotificationManager.show('Error updating record', 'error');
    }
  }

  static async handleDelete(type, id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    const data = JSON.parse(localStorage.getItem(type)) || [];
    const updatedData = data.filter(item => item.id !== id);
    localStorage.setItem(type, JSON.stringify(updatedData));
    
    // Dispatch event to refresh tables
    document.dispatchEvent(new CustomEvent('dataUpdated'));
    
    NotificationManager.show('Record deleted successfully', 'success');
  }

  static async editContribution(contribution) {
    const amount = prompt('Enter new amount:', contribution.amount);
    if (!amount) return;

    const data = JSON.parse(localStorage.getItem('contributions'));
    const index = data.findIndex(c => c.id === contribution.id);
    data[index].amount = parseFloat(amount);
    
    localStorage.setItem('contributions', JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('dataUpdated'));
  }

  static async editLoanApplication(application) {
    const amount = prompt('Enter new loan amount:', application.amount);
    if (!amount) return;

    const data = JSON.parse(localStorage.getItem('loanApplications'));
    const index = data.findIndex(a => a.id === application.id);
    data[index].amount = parseFloat(amount);
    
    localStorage.setItem('loanApplications', JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('dataUpdated'));
  }

  static async editMember(member) {
    const formHtml = `
      <form id="editMemberForm" class="p-3">
        <div class="mb-3">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="editFullName" value="${member.fullName}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="editEmail" value="${member.email}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Phone</label>
          <input type="tel" class="form-control" id="editPhone" value="${member.phone}" required>
        </div>
      </form>
    `;

    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Member</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${formHtml}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveChanges">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Handle save
    document.getElementById('saveChanges').onclick = async () => {
      const data = JSON.parse(localStorage.getItem('members'));
      const index = data.findIndex(m => m.id === member.id);
      
      data[index] = {
        ...data[index],
        fullName: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value
      };
      
      localStorage.setItem('members', JSON.stringify(data));
      document.dispatchEvent(new CustomEvent('dataUpdated'));
      modalInstance.hide();
      modal.remove();
    };

    // Cleanup on modal close
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }
}

// Add printer friendly styles
const tableStyles = `
<style>
  @media print {
    body { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { 
      padding: 8px;
      border: 1px solid #ddd;
      text-align: left; 
    }
    th { background-color: #f5f5f5; }
    .action-buttons { display: none; }
    .print-btn { display: none; }
  }
</style>`;

// Add calculation functions
export function calculateTableTotal(tableId, columnIndex) {
  const table = document.getElementById(tableId);
  if (!table) return 0;
  
  let total = 0;
  const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
  
  for (let row of rows) {
    const cell = row.cells[columnIndex];
    if (cell) {
      // Extract numeric value from currency string
      const value = parseFloat(cell.textContent.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(value)) {
        total += value;
      }
    }
  }
  
  return total;
}

export function addTotalRow(tableId, columnIndex) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  // Remove existing footer if any
  const existingFooter = table.getElementsByTagName('tfoot')[0];
  if (existingFooter) {
    existingFooter.remove();
  }
  
  const footer = table.createTFoot();
  const row = footer.insertRow();
  
  // Add empty cells before total
  for (let i = 0; i < columnIndex; i++) {
    row.insertCell();
  }
  
  // Add total cell
  const totalCell = row.insertCell();
  totalCell.style.fontWeight = 'bold';
  totalCell.textContent = window.formatCurrency(calculateTableTotal(tableId, columnIndex));
  
  // Add remaining empty cells
  const remainingCells = table.rows[0].cells.length - columnIndex - 1;
  for (let i = 0; i < remainingCells; i++) {
    row.insertCell();
  }
}

// Add event listeners for action buttons
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', async (e) => {
    const target = e.target;
    
    // Edit button handler
    if (target.classList.contains('edit-member') || target.closest('.edit-member')) {
      const id = target.dataset.id || target.closest('.edit-member').dataset.id;
      const canProceed = await AuthService.requireLogin('edit this member');
      if (canProceed) {
        await TableActions.handleEdit('members', id);
      }
    }
    
    // Delete button handler  
    if (target.classList.contains('delete-member') || target.closest('.delete-member')) {
      const id = target.dataset.id || target.closest('.delete-member').dataset.id;
      const canProceed = await AuthService.requireLogin('delete this member');
      if (canProceed) {
        await TableActions.handleDelete('members', id);
      }
    }
    
    // Edit contribution handler
    if (target.classList.contains('edit-contribution') || target.closest('.edit-contribution')) {
      const id = target.dataset.id || target.closest('.edit-contribution').dataset.id;
      const canProceed = await AuthService.requireLogin('edit this contribution');
      if (canProceed) {
        await TableActions.handleEdit('contributions', id);
      }
    }
    
    // Delete contribution handler
    if (target.classList.contains('delete-contribution') || target.closest('.delete-contribution')) {
      const id = target.dataset.id || target.closest('.delete-contribution').dataset.id;
      const canProceed = await AuthService.requireLogin('delete this contribution');
      if (canProceed) {
        await TableActions.handleDelete('contributions', id);
      }
    }
  });
});

export default TableActions;