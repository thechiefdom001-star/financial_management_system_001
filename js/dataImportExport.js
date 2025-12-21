import AuthService from './authService.js';
import NotificationManager from './notifications.js';

class DataImportExport {
  static async importData(tableId, type) {
    try {
      // Require admin login
      if (!await AuthService.requireLogin('import data')) return;
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target.result);
            
            // Validate data structure
            if (!Array.isArray(data)) {
              throw new Error('Invalid data format - must be an array');
            }

            // Store data
            localStorage.setItem(type, JSON.stringify(data));
            
            // Trigger refresh
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
            NotificationManager.show('Data imported successfully!', 'success');
          } catch (error) {
            console.error('Error importing data:', error);
            NotificationManager.show('Error importing data. Please check the file format.', 'error');
          }
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    } catch (error) {
      console.error('Error during import:', error);
      NotificationManager.show('Error during import operation', 'error');
    }
  }

  static async exportData(tableId, type) {
    try {
      // Require admin login  
      if (!await AuthService.requireLogin('export data')) return;

      const data = JSON.parse(localStorage.getItem(type)) || [];
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      NotificationManager.show('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error during export:', error);
      NotificationManager.show('Error during export operation', 'error'); 
    }
  }

  static addImportExportButtons(tableId, type) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mb-3';
    buttonContainer.style.textAlign = 'right';

    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-primary me-2';
    importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import';
    importBtn.onclick = () => this.importData(tableId, type);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-success';
    exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Export';
    exportBtn.onclick = () => this.exportData(tableId, type);

    buttonContainer.appendChild(importBtn);
    buttonContainer.appendChild(exportBtn);
    table.parentElement.insertBefore(buttonContainer, table);
  }
}

export default DataImportExport;