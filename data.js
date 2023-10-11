// Load req
const fs = require('fs');
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();

const loadExcelAsArray = async function(filePath, sheetName) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(sheetName); // Assuming you want the first sheet
  const jsonArray = [];

  let isFirstRow = true;

  sheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
    if (isFirstRow) {
      isFirstRow = false;
      return; // Skip the header row
    }

    const rowData = {};
    row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
      const headerCell = sheet.getCell(1, colNumber); // Assuming the first row contains headers
      const headerText = headerCell.value;
      rowData[headerText] = cell.value;
    });

    jsonArray.push(rowData);
  });

  return jsonArray;
};

const conditionalFetchCell2 = function (data, conditionalKey, conditionalValue, targetKey) {
  const item = data.find(item => item[conditionalKey] === conditionalValue);
  return item ? item[targetKey] : null;
}

const conditionalFetchRow2 = function (data, conditionalKey, conditionalValue, targetKey) {
  const item = data.find(item => item[conditionalKey] === conditionalValue);
  return item ? item : null;
}

const twoConditionalFetchCell2 = function (data, conditionalKey1, conditionalValue1, conditionalKey2, conditionalValue2, targetKey) {  
  const item = data.find(item => item[conditionalKey1] === conditionalValue1 && item[conditionalKey2] === conditionalValue2);
  return item ? item[targetKey] : null;
}

const insertRowIntoCSV = (filePath, jsonData) => {
  return new Promise((resolve, reject) => {
      // Read csv
      let csvData = '';
      if (fs.existsSync(filePath)) {
          csvData = fs.readFileSync(filePath, 'utf-8');
      }

      // Get headers
      const existingHeaders = csvData.trim().split('\n')[0].split(',');

      // Match json data with corresponding header
      const csvRowValues = existingHeaders.map(header => {          
          return jsonData.hasOwnProperty(header.trim()) ? `"${jsonData[header.trim()]}"` : '""';
      });

      // Append new row
      fs.appendFile(filePath, `${csvRowValues.join(',')}\n`, 'utf-8', (err) => {
          if (err) {
              reject(err);
          } else {
              resolve('JSON data added as a new row successfully.');
          }
      });
  });
};

const insertRowIntoCSVWithId = (filePath, jsonData) => {
  return new Promise((resolve, reject) => {
      // Read existing CSV data if the file exists
      let headers = [];
      if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          headers = content.trim().split('\n')[0].split(',');
      }
      
      // Create id
      const id = new Date().getTime();      
      jsonData['id'] = id

      // Map JSON data based on CSV headers
      const csvRowValues = headers.map(header => {
          const value = jsonData.hasOwnProperty(header.trim()) ? `"${jsonData[header.trim()]}"` : '""';
          return value;
      }).join(',');

      console.log(csvRowValues)

      // Append the new row to the CSV file
      fs.appendFile(filePath, `${csvRowValues}\n`, 'utf-8', (err) => {
          if (err) {
              reject(err);
          } else {
              resolve(id);
          }
      });
  });
};

const conditionalFetchCell = (fileName, sheet, conditionalColumn, conditionalValue, targetColumn) => {
  try {    
    // Read file
    return workbook.xlsx.readFile(fileName).then(() => {
      // Initialise
      let result, columnIndex, targetColumnIndex;

      // Get sheet
      const worksheet = workbook.getWorksheet(sheet); 
      
      // Get headers
      let headers = worksheet.getRow(1).values;

      // Loop through headers to:
      headers.forEach((header, index) => {
        // Find the column index
        if (header == conditionalColumn) {
          columnIndex = index
        }
        // Find target index
        if (header == targetColumn) {
          targetColumnIndex = index
        }
      });
  
      // Loop through row
      worksheet.eachRow((row, rowNumber) => {

        // Get cell
        let cellValue = row.getCell(columnIndex).value;

        // Match cell
        if (cellValue == conditionalValue) {

          // Assign result
          result = row.getCell(targetColumnIndex).value;
        }
      });
      return result;
    })
  } catch (err) {
    console.error(err)
  }
}


const twoConditionalFetchCell = (fileName, sheet, conditionalColumn1, conditionalValue1, conditionalColumn2, conditionalValue2, targetColumn) => {
  try {    
    // Read file
    return workbook.xlsx.readFile(fileName).then(() => {
      // Initialise
      let result1 = []
      let columnIndex1
      let columnIndex2
      let targetColumnIndex;

      // Get sheet
      const worksheet = workbook.getWorksheet(sheet); 
      
      // Get headers
      let headers = worksheet.getRow(1).values;

      // Loop through headers to:
      headers.forEach((header, index) => {
        // Find the column index
        if (header == conditionalColumn1) {
          columnIndex1 = index
        }
        else if (header == conditionalColumn2) {
          columnIndex2 = index
        }
        // Find target index
        if (header == targetColumn) {
          targetColumnIndex = index
        }
      });
  
      // Loop through row
      worksheet.eachRow((row, rowNumber) => {

        // Match cell
        if (row.getCell(columnIndex1).value == conditionalValue1) {

          // Assign result
          result1.push(row);
        }
      });      

      // Iterate through first result
      for (let i=0; i<result1.length; i++) {

        // Match cell
        if (result1[i].getCell(columnIndex2).value == conditionalValue2) {
  
          // Return result
          return result1[i].getCell(targetColumnIndex).value;
        }
      }
      
      return;
    })
  } catch (err) {
    console.error(err)
  }
}


const conditionalFetchRow = (fileName, sheet, conditionalColumn, conditionalValue) => {
  try {
    // Initialise
    let result = []

    // Read file
    return workbook.xlsx.readFile(fileName).then(() => {
      // Initialise
      let columnIndex, targetColumnIndex;
      
      // Get sheet
      const worksheet = workbook.getWorksheet(sheet); 
      
      // Get headers
      let headers = worksheet.getRow(1).values;

      // Loop through headers to:
      headers.forEach((header, index) => {
        // Find the column index
        if (header == conditionalColumn) {
          columnIndex = index
        }
      });
  
      // Loop through row
      worksheet.eachRow((row, rowNumber) => {

        // Get cell
        let cellValue = row.getCell(columnIndex).value;
  
        // Match cell
        if (cellValue.toLowerCase() == conditionalValue) {

          // Init
          let rowData = {}

          // Loop through headers
          headers.forEach((header, index) => {
            rowData[header] = row.getCell(index).value;
          });

          // Return result
          result = rowData;
        }
      });
      return result;
    })
  } catch (err) {
    console.error(err)
  }
}

const conditionalFetchRows = (fileName, sheet, conditionalColumn, conditionalValue) => {
  try {
    // Read file
    return workbook.xlsx.readFile(fileName).then(() => {
      // Initialise
      let result = []
      let columnIndex;
      
      // Get sheet
      const worksheet = workbook.getWorksheet(sheet); 
      
      // Get headers
      let headers = worksheet.getRow(1).values;

      // Loop through headers to:
      headers.forEach((header, index) => {
        // Find the column index
        if (header == conditionalColumn) {
          columnIndex = index
        }
      });
  
      // Loop through row
      worksheet.eachRow((row, rowNumber) => {

        // Get cell
        let cellValue = row.getCell(columnIndex).value;
  
        // Match cell
        if (cellValue == conditionalValue) {

          // Init
          let rowData = {}

          // Loop through headers
          headers.forEach((header, index) => {
            rowData[header] = row.getCell(index).value;
          });

          // Append result
          result.push(rowData);
        }
      });
      return result;
    })
  } catch (err) {
    console.error(err)
  }
}

const insertRowToExcel = async function(fileName, sheet, jsonObject) {
  const workbook = new ExcelJS.Workbook();
  var id = '';

  try {
    // Load the existing Excel file
    await workbook.xlsx.readFile(fileName);

    // Get worksheet
    const worksheet = workbook.getWorksheet(sheet);

    // Add row to worksheet
    const newRow = worksheet.addRow([]);

    // Get header
    const headerRow = worksheet.getRow(1);

    // Loop through each column (cell) in the header row
    headerRow.eachCell((headerCell, colNumber) => {
      const headerText = headerCell.value;      

      // Check if the header matches a field in the JSON object
      if (jsonObject.hasOwnProperty(headerText)) {
        const cellValue = jsonObject[headerText];

        // Assign the value to the corresponding cell in the new row
        newRow.getCell(colNumber).value = cellValue;
      }      
    });

    // Assign id to first column for user
    if (sheet == 'user') {

      // Create id
      id = `${generateRandomId()}${worksheet.lastRow.number}`

      // Assign id to row
      newRow.getCell(1).value = id;
    }
    
    // Save the modified workbook back to the same Excel file
    await workbook.xlsx.writeFile(fileName);

    
    console.log('Row added to Excel file with matching headers successfully.');
    
    return id;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function generateRandomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomId = '';
  for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomId += characters[randomIndex];
  }
  return randomId;
}

const postModuleResult = (fileName, module, name, email, answerArray, questionScores) => {
    // Read file
    workbook.xlsx.readFile(fileName).then(() => {
      // Compile as row
      let row = [id, name, email, ...questionScores, ...sqAnswerArray]   
      
      // Get sheet
      const worksheet = workbook.getWorksheet(module); 
      
      // Get headers
      let headers = worksheet.getRow(1).values;

      // Add row
      worksheet.addRow(row);

      return workbook.xlsx.writeFile('existingData.xlsx');
    })
    .then(() => {
      console.log('Row added to the Excel file successfully');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

module.exports = {
  loadExcelAsArray,  
  conditionalFetchCell2,
  twoConditionalFetchCell2,
  conditionalFetchRow2,
  insertRowIntoCSV,
  insertRowIntoCSVWithId,
  conditionalFetchCell,
  twoConditionalFetchCell,
  conditionalFetchRow,
  conditionalFetchRows,
  insertRowToExcel,
}