import ReceiptGenerator from './receiptGenerator.js';

class RegistrationFeeManager {
  static REGISTRATION_FEE = 500; // KES

  static async generateFeeReceipt(member) {
    const receiptData = {
      receiptNo: `REG${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      memberId: member.id,
      memberName: member.fullName,
      amount: this.REGISTRATION_FEE,
      type: 'registration_fee'
    };
    
    try {
      await ReceiptGenerator.printReceipt(receiptData, 'registration_fee');
    } catch (e) {
      console.error('Error generating registration fee receipt:', e);
    }
  }

  static getFeeStatus(memberId) {
    const feesData = JSON.parse(localStorage.getItem('registrationFees')) || [];
    return feesData.find(fee => fee.memberId === memberId);
  }

  static recordFeePayment(member) {
    const feesData = JSON.parse(localStorage.getItem('registrationFees')) || [];
    
    if (this.getFeeStatus(member.id)) {
      return false; // Already paid
    }

    const feeRecord = {
      memberId: member.id,
      amount: this.REGISTRATION_FEE,
      datePaid: new Date().toISOString(),
      receiptNo: `REG${Date.now().toString().slice(-6)}`
    };

    feesData.push(feeRecord);
    localStorage.setItem('registrationFees', JSON.stringify(feesData));
    return feeRecord;
  }
}

export default RegistrationFeeManager;