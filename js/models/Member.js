class Member {
  static generateId() {
    // Format: MEM-YYYYMM-XXXX where XXXX is random
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MEM-${year}${month}-${random}`;
  }

  static create(data) {
    try {
      const id = this.generateId();
      const member = {
        id,
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        status: 'pending',
        registrationDate: new Date().toISOString(),
        approvalDate: null,
        registrationFeePaid: false
      };

      return member;
    } catch (e) {
      console.error('Error creating member:', e);
      throw e;
    }
  }

  static generateFeeReceipt(member) {
    try {
      if (typeof RegistrationFeeManager !== 'undefined') {
        RegistrationFeeManager.generateFeeReceipt(member);
      }
    } catch (e) {
      console.error('Error generating fee receipt:', e);
    }
  }
}

export default Member;

