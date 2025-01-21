const PARKING_SHEET_NAME = "ParkingData";
const USER_DETAILS_SHEET_NAME = "UserDetails";

function doGet() {
  const userEmail = Session.getActiveUser().getEmail();
  const userDetails = getUserDetails(userEmail);

  if (!userDetails) {
    return HtmlService.createHtmlOutput(`
      <html>
        <body>
          <h3>Email Not Registered</h3>
          <p>Your email (${userEmail}) is not registered. Please contact the admin.</p>
        </body>
      </html>
    `);
  }

  const template = HtmlService.createTemplateFromFile("serverSideContent");
  template.userDetails = userDetails;
  template.parkingSlot = findParkingSlot(userDetails.FlatNumber);
  return template.evaluate().setTitle("Parking System");
}

function getUserDetails(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_DETAILS_SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      return { Email : rows[i][0], FlatNumber : rows[i][1], CarSize : rows[i][2] }; // Corrected object 
    }
  }

  return null;
}

function findParkingSlot(flatNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PARKING_SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === flatNumber && rows[i][2] === "Occupied") {
      return { slot: rows[i][0], carSize: rows[i][3] }; // Corrected object return
    }
  }

  return null;
}

function parkCar(flatNumber, carSize) {
  const slot = findParkingSlot(flatNumber);
  const userEmail = Session.getActiveUser().getEmail();
  if (slot != null) {
    logParkingAction(userEmail,"Park",slot.slot);
    return slot.slot;
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PARKING_SHEET_NAME);
  const rows = sheet.getDataRange().getValues();  
  
  var timestamp = new Date();

  for (let i = 1; i < rows.length; i++) {    
    if (rows[i][2] === "Available" && rows[i][3] === carSize) {
      sheet.getRange(i + 1, 2).setValue(flatNumber); // Assign FlatNumber
      sheet.getRange(i + 1, 3).setValue("Occupied"); // Mark as Occupied
      sheet.getRange(i + 1, 5).setValue("" + timestamp); // Mark timestamp
      logParkingAction(userEmail,"Park",`${rows[i][0]}`);
      return `${rows[i][0]}`;
    }
  }
  return `Not available`;
}

function removeCar(flatNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PARKING_SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const userEmail = Session.getActiveUser().getEmail();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === flatNumber && rows[i][2] === "Occupied") {
      sheet.getRange(i + 1, 2).setValue(""); // Clear FlatNumber
      sheet.getRange(i + 1, 3).setValue("Available"); // Mark as Available
      sheet.getRange(i + 1, 5).setValue(""); // Mark as Available
      logParkingAction(userEmail,"Remove",`${rows[i][0]}`);
      return "Your car has been removed successfully.";
    }
  }
  return "No car found to remove.";
}

function reportCar(flatNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PARKING_SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const userEmail = Session.getActiveUser().getEmail();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === flatNumber && rows[i][2] === "Occupied") {
      sheet.getRange(i + 1, 2).setValue("WRONG Parking"); // Mark as wrong Parking      
      logParkingAction(userEmail,"Report Wrong Parking",`${rows[i][0]}`);
      return "Your car has been removed successfully.";
    }
  }
  return "No car found to remove.";
}

function serverAction(action) {
    const userEmail = Session.getActiveUser().getEmail();
    const userDetails = getUserDetails(userEmail);    
    if (action == "removeCar") {
      return removeCar(userDetails.FlatNumber);
    }
    if (action == "parkCar") {
      return parkCar(userDetails.FlatNumber,userDetails.CarSize);
    }
 return "Wrong command : " + action;
}

function logParkingAction(email, action, slot) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ParkingLogs");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("ParkingLogs");
    sheet.appendRow(["Timestamp", "Email", "Action", "Slot"]);
  }
  var timestamp = new Date();
  sheet.appendRow([timestamp, email, action, slot]);
}

function sendReportEmail(base64, fileName) {
  var userEmail = Session.getActiveUser().getEmail();
  var adminEmail = "hubtownheaven@gmail.com";  // App owner email
  var timestamp = new Date();

  const userDetails = getUserDetails(userEmail);    

  reportCar(userDetails.FlatNumber);

  var blob = Utilities.newBlob(Utilities.base64Decode(base64), "image/png", fileName);

  // Send Email
 // MailApp.sendEmail({
 //   to: adminEmail + "," + userEmail,
 //   subject: "Wrong Parking Report",
  //  body: "Dear " + adminEmail + ", A wrong parking issue has been reported by " + userEmail,
  //  attachments: [blob]
 // });

  // Log to ReportLogs sheet
  //logWrongParking(userEmail, fileName, timestamp);

   uploadImage(blob);

  return "Report submitted successfully!";
}

// Function to log wrong parking reports
function logWrongParking(email, fileName, timestamp) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ReportLogs");

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("ReportLogs");
    sheet.appendRow(["Timestamp", "Email", "FileName"]);
  }

  sheet.appendRow([timestamp, email, fileName]);
}

function uploadImage(blob) {

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ReportLogs');
    const email = Session.getActiveUser().getEmail();
    const timestamp = new Date();

// Convert blob to base64 for embedding
    const base64 = Utilities.base64Encode(blob.getBytes());
    const mimeType = blob.getContentType();
    
    // Create the image formula to insert into the cell
    const imageFormula = `=IMAGE("data:${mimeType};base64,${base64}")`;
    
      // Log the report
    sheet.appendRow([timestamp, email]);

  const startRow = sheet.getLastRow(); 
  const startCol = 3; 

  // Calculate the range for 2x2 cells
  const range = sheet.getRange(startRow, startCol, 2, 2); 

  // Insert the image into the range
  const image = sheet.insertImage(blob, startCol, startRow, 2, 2); 

  // Adjust image size to fit the 2x2 cell range
  image.setWidth(50); 
  image.setHeight(50); 

    return "Photo uploaded successfully!";
}

function getOccupiedSlots() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ParkingData');
  const data = sheet.getDataRange().getValues();
  
  let occupiedSlots = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == 'Occupied') {  // Assuming 'Occupied' status is in the 3rd column
      occupiedSlots.push({
        flat: data[i][1],            // Flat number in 1st column
        slot: data[i][0],            // Slot number in 2nd column
        timestamp: data[i][4]        // Timestamp in 4th column
      });
    }
  }
  return occupiedSlots;
}

function getParkingGrid() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ParkingData');
  const data = sheet.getDataRange().getValues();
  
  let slotStatus = {};
  for (let i = 1; i < data.length; i++) {
    const slot = data[i][0];  // Slot (e.g., "B - 203")
    const status = data[i][2];  // Status in column C
    slotStatus[slot] = status;  // Store status (Occupied/Available)
  }
  
  return slotStatus;
}

