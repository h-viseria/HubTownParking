const SCRIPT_ID = '1W3t7z65WEQPojUflFwP5xqb7XkeEsak7kjZSaHMZJg62IH3e5raZ2Khb'; // Replace with your Apps Script Script ID
const CLIENT_ID = '231804756203-pon52d0g8l3arj4efscmedusaknankda.apps.googleusercontent.com'; // Replace with your Google OAuth 2.0 Client ID
const API_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.currentonly https://www.googleapis.com/auth/userinfo.email';
    
let tokenClient;
let access_token;

function initializeOAuth() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, // Replace with your client ID
      scope: API_SCOPE,
      callback: (tokenResponse) => {
        console.log('OAuth Token:', tokenResponse.access_token);     
        access_token = tokenResponse.access_token;        

        localStorage.setItem('google_access_token', access_token);
        localStorage.setItem('google_token_expires', Date.now() + tokenResponse.expires_in * 1000);       
      },
    });
    authenticate();
}

  // Function to trigger authentication
  function authenticate() {
    if (!tokenClient) {
      console.error('OAuth client not initialized. Make sure the library is loaded.');
      return;
    }
    const storedToken = localStorage.getItem('google_access_token');
    const tokenExpires = localStorage.getItem('google_token_expires');

    if (storedToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
      // Token exists and is valid
      access_token = storedToken;
      console.log('Reusing stored access token:', storedToken);
      fetchMetadata();
      fetchOrders();
      return ;
    } else {
      // Token is missing or expired, request a new one
      console.log('Requesting a new access token');
      tokenClient.requestAccessToken();
    }
  }

    // Make a POST request to the API Executable
    async function callAppsScriptAPI(functionName, parameters = []) {
      const accessToken = access_token;

      if (!accessToken) {
        alert('Please authenticate first.');
        return;
      }

      const url = `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`;
      const body = {
        function: functionName,
        parameters: parameters,
        devMode: true
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        const result = await response.json();
        if (result.error) {
          console.error('API Error:', result.error);
          alert('Error: ' + result.error.message);
          return null;
        }

        return result.response.result;
      } catch (error) {
        console.error('Fetch Error:', error);
        alert('An error occurred. Check the console for details.');
      }
    }
