const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const EXCEL_FILE = path.join(__dirname, '../orders.xlsx');

// Create or get Excel workbook
async function getWorkbook() {
    let workbook = new ExcelJS.Workbook();
    
    // If file exists, load it
    if (fs.existsSync(EXCEL_FILE)) {
        await workbook.xlsx.readFile(EXCEL_FILE);
    } else {
        // Create new workbook with headers
        const worksheet = workbook.addWorksheet('Orders');
        worksheet.columns = [
            { header: 'Timestamp', key: 'timestamp', width: 15 },
            { header: 'Email', key: 'email', width: 20 },
            { header: 'Name', key: 'name', width: 15 },
            { header: 'Token', key: 'token', width: 10 },
            { header: 'Code', key: 'code', width: 10 },
            { header: 'Items', key: 'items', width: 30 },
            { header: 'Total', key: 'total', width: 10 },
            { header: 'Status', key: 'status', width: 15 }
        ];
    }
    
    return workbook;
}

// Add order to Excel
async function addOrderToExcel(orderData) {
    try {
        const workbook = await getWorkbook();
        const worksheet = workbook.getWorksheet('Orders') || workbook.addWorksheet('Orders');
        
        const row = worksheet.addRow({
            timestamp: new Date().toLocaleString(),
            email: orderData.userEmail,
            name: orderData.userName,
            token: orderData.token,
            code: orderData.code,
            items: orderData.items.map(i => `${i.name} x${i.quantity}`).join(", "),
            total: orderData.total,
            status: orderData.status
        });
        
        // Format row
        row.eachCell((cell) => {
            cell.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
        });
        
        await workbook.xlsx.writeFile(EXCEL_FILE);
        console.log("Order added to Excel file");
        return true;
        
    } catch (error) {
        console.error("Error writing to Excel:", error);
        return false;
    }
}

// Update order status in Excel
async function updateOrderStatusInExcel(token, newStatus) {
    try {
        const workbook = await getWorkbook();
        const worksheet = workbook.getWorksheet('Orders');
        
        if (!worksheet) return false;
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            if (row.getCell('token').value == token) {
                row.getCell('status').value = newStatus;
            }
        });
        
        await workbook.xlsx.writeFile(EXCEL_FILE);
        console.log(`Order ${token} status updated to ${newStatus}`);
        return true;
        
    } catch (error) {
        console.error("Error updating Excel:", error);
        return false;
    }
}

module.exports = {
    addOrderToExcel,
    updateOrderStatusInExcel,
    getExcelFilePath: () => EXCEL_FILE
};