const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();

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

async function insertRowToExcel(fileName, sheet, jsonObject) {
  const workbook = new ExcelJS.Workbook();

  try {
    // Load the existing Excel file
    await workbook.xlsx.readFile(fileName);

    // Get the desired worksheet
    const worksheet = workbook.getWorksheet(sheet);

    // Add a new row to the worksheet
    const newRow = worksheet.addRow([]);

    // Get the header row (row 1) to match against JSON object fields
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

    // Save the modified workbook back to the same Excel file
    await workbook.xlsx.writeFile(fileName);

    console.log('Row added to Excel file with matching headers successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
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
  conditionalFetchCell,
  twoConditionalFetchCell,
  conditionalFetchRow,
  conditionalFetchRows,
  insertRowToExcel,
}