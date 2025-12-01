import NotificationManager from '/js/notifications.js';

class AuthService {
  static isLoggedIn() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  }

  static login(username, password) {
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('adminLoggedIn', 'true');
      this.updateUI(true);
      return true;
    }
    return false;
  }

  static logout() {
    sessionStorage.removeItem('adminLoggedIn');
    this.updateUI(false);
    NotificationManager.show('Successfully logged out', 'info');
  }

  static updateUI(isLoggedIn) {
    // Update navbar buttons
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const statusDiv = document.getElementById('adminLoginStatus');
    
    if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'block';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    if (statusDiv) statusDiv.style.display = isLoggedIn ? 'block' : 'none';
  }

  static setupLoginHandlers() {
    const modalElement = document.getElementById('adminLoginModal');
    if (!modalElement) return;
    
    const loginModal = new bootstrap.Modal(modalElement);
    
    // Handle password visibility toggle
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('adminPassword');
        const icon = togglePasswordBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          passwordInput.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    }
    
    // Handle login button click
    const loginBtn = document.getElementById('adminLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        loginModal.show();
      });
    }

    // Handle logout button click
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Handle login form submission
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername')?.value;
        const password = document.getElementById('adminPassword')?.value;
        
        if (username && password && this.login(username, password)) {
          loginModal.hide();
          loginForm.reset();
          const errorDiv = document.getElementById('loginError');
          if (errorDiv) errorDiv.style.display = 'none';
          NotificationManager.show('Successfully logged in as admin', 'success');
        } else {
          const errorDiv = document.getElementById('loginError');
          if (errorDiv) errorDiv.style.display = 'block';
        }
      });
    }

    this.updateUI(this.isLoggedIn());
  }

  static async requireLogin(action) {
    if (this.isLoggedIn()) {
      return true;
    }
    
    const modalElement = document.getElementById('adminLoginModal');
    if (!modalElement) return false;
    
    const loginModal = new bootstrap.Modal(modalElement);
    loginModal.show();

    return new Promise((resolve) => {
      const form = document.getElementById('adminLoginForm');
      if (!form) {
        resolve(false);
        return;
      }

      const handleSubmit = (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername')?.value;
        const password = document.getElementById('adminPassword')?.value;
        
        if (this.login(username, password)) {
          form.removeEventListener('submit', handleSubmit);
          loginModal.hide();
          form.reset();
          const errorDiv = document.getElementById('loginError');
          if (errorDiv) errorDiv.style.display = 'none';
          resolve(true);
        } else {
          const errorDiv = document.getElementById('loginError');
          if (errorDiv) errorDiv.style.display = 'block';
        }
      };

      form.addEventListener('submit', handleSubmit);

      modalElement.addEventListener('hidden.bs.modal', () => {
        form.removeEventListener('submit', handleSubmit);
        form.reset();
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'none';
        resolve(false);
      }, { once: true });
    });
  }
}

// Initialize login handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  AuthService.setupLoginHandlers();
});

export default AuthService;