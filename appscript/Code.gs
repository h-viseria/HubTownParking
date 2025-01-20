// Serve the HTML form
function doGet() {
  const userEmail = Session.getActiveUser().getEmail();

  const template = HtmlService.createTemplateFromFile('OrderForm');
  template.userEmail = userEmail;  
  return template.evaluate().setTitle("Order Management");
}

// Fetch metadata from the "Metadata" sheet
function getMetadata() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Metadata");
  const data = sheet.getDataRange().getValues();
  return data.slice(1); // Skip header row
}

// Fetch orders raised by the current user
function getUserOrdersList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OrderRecords");
  const email = Session.getActiveUser().getEmail();
  const data1 = sheet.getDataRange().getValues();
  const adminUser = "priyeshdoshi3@gmail.com";
  //Logger.log("Fetched Data: " + JSON.stringify(data)); // Log all data
  Logger.log("User Email: " + email); // Log current user email

  if (!data1 || data1.length <= 1) return []; // Return an empty array if no data or only header exists
   
    const now = new Date();
    // Calculate today and yesterday
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
    const startOfYesterday = new Date();
    startOfYesterday.setDate(now.getDate() - 1);

  // Filter orders by the user's email
  const userOrders = data1.filter(row => {
    const orderDate = new Date(row[3]);
    const emailMatches = (row[2] === email || row[2] === adminUser);
    const isTodayOrYesterday = orderDate >= startOfYesterday && orderDate < startOfToday;
    return emailMatches && isTodayOrYesterday;
  }).map(row => ({
    orderId: row[0],
    client: row[1],
    salesEmail: row[2],
    timestamp: ""+formatTimestamp(row[3]),
    category: row[4],
    product: row[5],
    variant: row[6],
    quantity: row[7],
    mode: row[8]
  }));

  Logger.log("User Orders: " + JSON.stringify(userOrders)); // Log filtered user orders
  return userOrders;
}

// Submit or update an order
function submitOrder(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OrderRecords");
  const email = Session.getActiveUser().getEmail();
  const timestamp = new Date();

  if (data.orderId) {
    // Update existing order
    const range = sheet.getDataRange();
    const values = range.getValues();
    for (let i = 1; i < values.length; i++) { // Skip header row
      if (values[i][0] === data.orderId && values[i][2] === email) {
        // Update the row
        const items = data.items;
        items.forEach((item, index) => {
          const rowIndex = i + index; // Handle multiple rows for the same order
          sheet.getRange(rowIndex + 1, 2, 1, 9).setValues([[data.client, email, timestamp, item.category, item.product, item.variant, item.quantity, data.mode, data.comments]]);
        });
        return `Order ${data.orderId} Updated Successfully!`;
      }
    }
  } else {
    // Create a new order
    const orderId = 'ORD-' + new Date().getTime();
    const items = data.items;
    items.forEach(item => {
      sheet.appendRow([
        orderId,
        data.client,
        email,
        timestamp,
        item.category,
        item.product,
        item.variant,
        item.quantity,
        data.mode,
        data.comments,
      ]);
    });
    return `Order ${orderId} Submitted Successfully!`;
  }
}

function getOrderDetails(orderId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OrderRecords");
  const data = sheet.getDataRange().getValues();

  // Filter rows by orderId
  const orderRows = data.filter(row => row[0] === orderId);

  if (!orderRows.length) return null; // Return null if no rows match the orderId

  const client = orderRows[0][1]; // Assuming the client is consistent for all rows
  const mode = orderRows[0][8];
  const comments = orderRows[0][9];
  // Map order items
  const items = orderRows.map(row => ({
    category: row[4],
    product: row[5],
    variant: row[6],
    quantity: row[7],
  }));

  // Return order details
  return { orderId, client, mode, comments, items };
}

function formatTimestamp(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm");
}

