import NotificationManager from './notifications.js';
import Member from './models/Member.js';

class MemberManager {
  constructor() {
    this.loadMembers();
  }

  loadMembers() {
    try {
      const data = localStorage.getItem('members');
      this.members = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading members:', e);
      this.members = [];
      localStorage.setItem('members', JSON.stringify([]));
    }
  }

  addMember(memberData) {
    try {
      const member = Member.create(memberData);
      this.members.push(member);
      this.saveMembersToStorage();
      return true;
    } catch (e) {
      console.error('Error adding member:', e);
      NotificationManager.show('Error adding member: ' + e.message, 'error');
      return false;
    }
  }

  saveMembersToStorage() {
    try {
      localStorage.setItem('members', JSON.stringify(this.members));
      // Dispatch event to notify other parts of the application
      document.dispatchEvent(new CustomEvent('dataUpdated'));
    } catch (e) {
      console.error('Error saving members to storage:', e);
      throw e;
    }
  }

  updateMember(id, updatedData) {
    try {
      const index = this.members.findIndex(m => m.id === id);
      if (index !== -1) {
        this.members[index] = { ...this.members[index], ...updatedData };
        this.saveMembersToStorage();
        
        // Show notification for status changes
        if (updatedData.status === 'approved') {
          NotificationManager.show(`Member ${this.members[index].fullName} approved`, 'success');
        } else if (updatedData.status === 'rejected') {
          NotificationManager.show(`Member ${this.members[index].fullName} rejected`, 'warning');
        }
        
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating member:', e);
      NotificationManager.show('Error updating member: ' + e.message, 'error');
      return false;
    }
  }

  deleteMember(id) {
    try {
      this.members = this.members.filter(m => m.id !== id);
      this.saveMembersToStorage();
      return true;
    } catch (e) {
      console.error('Error deleting member:', e);
      return false;
    }
  }

  getMember(id) {
    return this.members.find(m => m.id === id);
  }

  getApprovedMembers() {
    return this.members.filter(m => m.status === 'approved');
  }
}

export default MemberManager;