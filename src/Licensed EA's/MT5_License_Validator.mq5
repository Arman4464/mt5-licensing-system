//+------------------------------------------------------------------+
//|                                        EA_License_Validator.mq5 |
//|                                                      Mark8Pips   |
//+------------------------------------------------------------------+
#property copyright "Mark8Pips"
#property link      "https://mark8pips.vercel.app"
#property version   "1.00"
#property strict

input string LicenseKey = "U43NMO4G-KVQFTVO0-9XNY80IE-60N6SAP8"; // Your License Key
string API_URL = "https://mark8pips.vercel.app/api/license/validate";

bool LicenseValid = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("===========================================");
   Print("MT5 License Validator - Initializing...");
   Print("===========================================");
   
   if(StringLen(LicenseKey) == 0)
   {
      Alert("⚠️ ERROR: Please enter your license key in EA settings!");
      Comment("❌ License Key Required!\nRight-click EA → Properties → Inputs");
      return(INIT_FAILED);
   }
   
   Print("License Key: ", LicenseKey);
   Print("API URL: ", API_URL);
   
   // Validate license
   if(!ValidateLicense())
   {
      Alert("❌ License validation FAILED! EA will not trade.");
      Comment("❌ Invalid License\nCheck your license key and internet connection");
      return(INIT_FAILED);
   }
   
   LicenseValid = true;
   Comment("✅ License Active\nTrading Enabled");
   Print("✅ ✅ ✅ LICENSE VALIDATED SUCCESSFULLY ✅ ✅ ✅");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Comment("");
}

//+------------------------------------------------------------------+
//| License Validation Function                                      |
//+------------------------------------------------------------------+
bool ValidateLicense()
{
   Print("-------------------------------------------");
   Print("Starting License Validation...");
   Print("-------------------------------------------");
   
   // Get account info
   long accountNumber = AccountInfoInteger(ACCOUNT_LOGIN);
   string serverName = AccountInfoString(ACCOUNT_SERVER);
   string accountName = AccountInfoString(ACCOUNT_NAME);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   
   Print("Account Number: ", accountNumber);
   Print("Server: ", serverName);
   Print("Account Name: ", accountName);
   Print("Company: ", company);
   
   // Build JSON request
   string jsonData = StringFormat(
      "{\"license_key\":\"%s\",\"account_number\":%I64d,\"broker_server\":\"%s\",\"account_name\":\"%s\",\"broker_company\":\"%s\"}",
      LicenseKey,
      accountNumber,
      serverName,
      accountName,
      company
   );
   
   Print("JSON Payload: ", jsonData);
   
   // Convert to char array
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post) - 1); // Remove null terminator
   
   // Headers
   string headers = "Content-Type: application/json\r\n";
   
   // Reset last error
   ResetLastError();
   
   Print("Sending WebRequest to: ", API_URL);
   Print("Timeout: 10000ms");
   
   // Make request
   int timeout = 10000;
   int httpCode = WebRequest(
      "POST",
      API_URL,
      headers,
      timeout,
      post,
      result,
      resultHeaders
   );
   
   // Check for errors
   if(httpCode == -1)
   {
      int error = GetLastError();
      Print("❌ WebRequest FAILED with error: ", error);
      
      switch(error)
      {
         case 4014:
            Print("❌ ERROR 4014: URL not allowed in WebRequest");
            Print("📋 SOLUTION:");
            Print("1. Go to: Tools → Options → Expert Advisors");
            Print("2. Enable 'Allow WebRequest for listed URL'");
            Print("3. Click 'Add' and enter EXACTLY:");
            Print("   https://mark8pips.vercel.app");
            Print("4. Click OK and restart MT5");
            Print("5. Remove and re-attach the EA to chart");
            break;
            
         case 5203:
            Print("❌ ERROR 5203: Invalid URL format");
            Print("Check API_URL in EA code");
            break;
            
         case 4060:
            Print("❌ ERROR 4060: Function not allowed");
            Print("Enable WebRequest in EA settings");
            break;
            
         default:
            Print("❌ Unknown error: ", error);
            Print("Check your internet connection");
            break;
      }
      
      return false;
   }
   
   Print("HTTP Response Code: ", httpCode);
   
   // Check HTTP code
   if(httpCode != 200 && httpCode != 201)
   {
      Print("❌ HTTP Error: ", httpCode);
      
      if(httpCode == 404)
         Print("❌ API endpoint not found. Check API_URL");
      else if(httpCode == 403)
         Print("❌ License key invalid or expired");
      else if(httpCode == 429)
         Print("❌ Too many requests. Wait 1 minute");
      else if(httpCode >= 500)
         Print("❌ Server error. Try again later");
         
      return false;
   }
   
   // Parse response
   string response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   Print("📡 API Response: ", response);
   
   // Simple JSON parsing - check for "valid":true
   if(StringFind(response, "\"valid\":true") != -1)
   {
      Print("✅ License validation SUCCESS!");
      Print("✅ Product: ", ExtractJSONValue(response, "product_name"));
      Print("✅ Days Remaining: ", ExtractJSONValue(response, "days_remaining"));
      Print("✅ Accounts Used: ", ExtractJSONValue(response, "accounts_used"));
      return true;
   }
   else
   {
      Print("❌ License validation FAILED");
      string message = ExtractJSONValue(response, "message");
      if(StringLen(message) > 0)
      {
         Print("❌ Reason: ", message);
         Alert("License Error: " + message);
      }
      return false;
   }
}

//+------------------------------------------------------------------+
//| Extract value from JSON string (simple implementation)            |
//+------------------------------------------------------------------+
string ExtractJSONValue(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int startPos = StringFind(json, searchKey);
   
   if(startPos == -1)
      return "";
   
   startPos += StringLen(searchKey);
   
   // Skip whitespace and quotes
   while(startPos < StringLen(json) && 
         (StringGetCharacter(json, startPos) == ' ' || 
          StringGetCharacter(json, startPos) == '"'))
      startPos++;
   
   // Find end (comma, quote, or brace)
   int endPos = startPos;
   while(endPos < StringLen(json))
   {
      ushort ch = StringGetCharacter(json, endPos);
      if(ch == ',' || ch == '"' || ch == '}' || ch == ']')
         break;
      endPos++;
   }
   
   return StringSubstr(json, startPos, endPos - startPos);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!LicenseValid)
   {
      Comment("❌ License Invalid\nEA Disabled");
      return;
   }
   
   // Your trading logic here
   // EA will only reach this point if license is valid
   
   Comment("✅ License Active\nEA Running...");
}
//+------------------------------------------------------------------+
