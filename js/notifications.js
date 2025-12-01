class NotificationManager {
  static show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      animation: slideIn 0.5s ease-out;
    `;
    notification.innerHTML = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease-in';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }

  static notifyLoanApproval(memberId, amount) {
    // Use DataManager's instance to get member info
    const member = window.dataManager?.getMemberById(memberId);
    if (member) {
      this.show(
        `Loan approved for ${member.fullName} - Amount: ${window.formatCurrency(amount)}`,
        'success'
      );
    }
  }

  static notifyBonusApproval(memberId, amount) {
    // Use DataManager's instance to get member info
    const member = window.dataManager?.getMemberById(memberId);
    if (member) {
      this.show(
        `Bonus approved for ${member.fullName} - Amount: ${window.formatCurrency(amount)}`,
        'success'
      );
    } else {
      // Fallback message if member not found
      this.show(
        `Bonus approved - Amount: ${window.formatCurrency(amount)}`,
        'success'
      );
    }
  }

  static notifyMemberApproval(member) {
    if (member?.fullName) {
      this.show(
        `Member ${member.fullName} has been approved - ID: ${member.id}`,
        'success'
      );
    }
  }

  static notifyMemberRejection(member) {
    if (member?.fullName) {
      this.show(
        `Member ${member.fullName} has been rejected`,
        'warning'
      );
    }
  }
}

export default NotificationManager;