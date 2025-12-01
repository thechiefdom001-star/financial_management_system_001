import NotificationManager from '/js/notifications.js';

// Store chart instances globally 
let contributionsChart = null;
let loansChart = null;
let membershipChart = null;
let repaymentsChart = null;

function destroyCharts() {
  [contributionsChart, loansChart, membershipChart, repaymentsChart].forEach(chart => {
    if (chart) chart.destroy();
  });
}

function updateDashboard() {
  try {
    // Ensure formatCurrency is available
    if (!window.formatCurrency) {
      window.formatCurrency = function(amount) {
        return 'KES ' + (parseFloat(amount) || 0).toFixed(2);
      };
    }

    // Get data from localStorage
    const members = JSON.parse(localStorage.getItem('members')) || [];
    const contributions = [];
    const contributionTypes = ['savings', 'condolence', 'education', 'health'];
    
    // Combine all contribution types
    contributionTypes.forEach(type => {
      const typeContributions = JSON.parse(localStorage.getItem(`contributions_${type}`)) || [];
      contributions.push(...typeContributions);
    });
    
    const approvedLoans = JSON.parse(localStorage.getItem('approvedLoans')) || [];
    const loanRepayments = JSON.parse(localStorage.getItem('loanRepayments')) || [];

    // Calculate stats
    const totalMembers = members.filter(m => m.status === 'approved').length;
    const activeLoans = approvedLoans.filter(l => l.status === 'active').length;
    const totalContributions = contributions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalLoans = approvedLoans.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

    // Update dashboard cards
    const cardPrimary = document.querySelector('.card.primary .card-text');
    if (cardPrimary) cardPrimary.textContent = totalMembers;
    
    const cardSuccess = document.querySelector('.card.success .card-text');
    if (cardSuccess) cardSuccess.textContent = activeLoans;
    
    const cardInfo = document.querySelector('.card.info .card-text');
    if (cardInfo) cardInfo.textContent = window.formatCurrency(totalContributions);
    
    const cardWarning = document.querySelector('.card.warning .card-text');
    if (cardWarning) cardWarning.textContent = window.formatCurrency(totalLoans);

    // Update charts
    updateDashboardCharts(contributions, approvedLoans, members, loanRepayments);
  } catch (e) {
    console.error('Error updating dashboard:', e);
  }
}

function updateDashboardCharts(contributions, loans, members, repayments) {
  destroyCharts();
  
  // 1. Monthly Contributions by Type
  const contributionsCtx = document.getElementById('contributionsChart');
  if (contributionsCtx) {
    try {
      const monthlyData = {};
      const types = ['savings', 'condolence', 'education', 'health'];
      
      types.forEach(type => {
        const typeContributions = contributions.filter(c => c.type === type);
        monthlyData[type] = groupByMonth(typeContributions);
      });

      const labels = getUniqueMonths(contributions);
      
      contributionsChart = new Chart(contributionsCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: types.map(type => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            data: labels.map(month => monthlyData[type][month] || 0),
            backgroundColor: getColorForType(type)
          }))
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: true },
            y: { 
              stacked: true,
              ticks: {
                callback: value => window.formatCurrency(value)
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('Error creating contributions chart:', e);
    }
  }

  // 2. Loan Status Distribution
  const loansCtx = document.getElementById('loansChart');
  if (loansCtx) {
    try {
      const loanStatuses = {
        'Active': loans.filter(l => l.status === 'active').length,
        'Completed': loans.filter(l => l.status === 'completed').length,
        'Defaulted': loans.filter(l => l.status === 'defaulted').length
      };

      loansChart = new Chart(loansCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(loanStatuses),
          datasets: [{
            data: Object.values(loanStatuses),
            backgroundColor: ['#36b9cc', '#1cc88a', '#e74a3b']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    } catch (e) {
      console.error('Error creating loans chart:', e);
    }
  }

  // 3. Member Growth Over Time
  const membershipCtx = document.getElementById('membershipChart');
  if (membershipCtx) {
    try {
      const membersByMonth = groupByMonth(members.filter(m => m.status === 'approved'));
      const labels = Object.keys(membersByMonth).sort();

      membershipChart = new Chart(membershipCtx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Total Members',
            data: getCumulativeData(labels, membersByMonth),
            borderColor: '#4e73df',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    } catch (e) {
      console.error('Error creating membership chart:', e);
    }
  }

  // 4. Loan Repayment Performance
  const repaymentsCtx = document.getElementById('repaymentsChart');
  if (repaymentsCtx) {
    try {
      const repaymentData = calculateRepaymentPerformance(repayments);

      repaymentsChart = new Chart(repaymentsCtx, {
        type: 'bar',
        data: {
          labels: ['On Time', 'Late', 'Pending'],
          datasets: [{
            data: [
              repaymentData.onTime,
              repaymentData.late,
              repaymentData.pending
            ],
            backgroundColor: ['#1cc88a', '#f6c23e', '#e74a3b']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    } catch (e) {
      console.error('Error creating repayments chart:', e);
    }
  }
}

// Helper Functions
function getColorForType(type) {
  const colors = {
    savings: '#4e73df',
    condolence: '#1cc88a', 
    education: '#36b9cc',
    health: '#f6c23e'
  };
  return colors[type];
}

function groupByMonth(items) {
  const groups = {};
  items.forEach(item => {
    const date = new Date(item.date || item.approvalDate || item.registrationDate);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    groups[monthYear] = (groups[monthYear] || 0) + (parseFloat(item.amount) || 1);
  });
  return groups;
}

function getUniqueMonths(items) {
  const months = new Set();
  items.forEach(item => {
    const date = new Date(item.date || item.approvalDate || item.registrationDate);
    months.add(`${date.getMonth() + 1}/${date.getFullYear()}`);
  });
  return Array.from(months).sort();
}

function getCumulativeData(labels, monthlyData) {
  let cumulative = 0;
  return labels.map(month => {
    cumulative += (monthlyData[month] || 0);
    return cumulative;
  });
}

function calculateRepaymentPerformance(repayments) {
  return {
    onTime: repayments.filter(r => r.status === 'paid' && r.paymentDate && new Date(r.paymentDate) <= new Date(r.dueDate)).length,
    late: repayments.filter(r => r.status === 'paid' && r.paymentDate && new Date(r.paymentDate) > new Date(r.dueDate)).length,
    pending: repayments.filter(r => r.status === 'pending').length
  };
}

// Handle sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const mainContent = document.querySelector('.main-content');
  const navLinks = document.querySelectorAll('.sidebar .nav-link');
  
  // Create overlay element if it doesn't exist
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  function toggleSidebar() {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
    document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
  }

  // Toggle button click handler
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Close sidebar when clicking overlay
  overlay.addEventListener('click', () => {
    toggleSidebar();
  });

  // Close sidebar when clicking a menu item (mobile only)
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        toggleSidebar();
      }
    });
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    }, 250);
  });

  // Handle sidebar navigation
  const contentSections = document.querySelectorAll('.content-section');

  function showSection(sectionId) {
    // Hide all sections
    contentSections.forEach(section => {
      section.classList.remove('active');
    });

    // Remove active class from all nav links
    navLinks.forEach(link => {
      link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Add active class to clicked link
    const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  // Add click handlers to all nav links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      showSection(sectionId);
      
      // Update URL hash without scrolling
      history.pushState(null, null, `#${sectionId}`);
    });
  });

  // Handle initial load and browser back/forward
  function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    showSection(hash);
  }

  window.addEventListener('hashchange', handleHashChange);
  
  // Handle initial page load
  handleHashChange();
  
  // Update dashboard
  updateDashboard();
});

// Update dashboard when data changes
document.addEventListener('dataUpdated', updateDashboard);

// Handle chart responsiveness
window.addEventListener('resize', () => {
  const dashboardSection = document.getElementById('dashboard');
  if (dashboardSection && dashboardSection.classList.contains('active')) {
    updateDashboard();
  }
});

export default { updateDashboard };