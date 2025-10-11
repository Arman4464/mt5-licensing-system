//+------------------------------------------------------------------+
//|                                        MT5_License_Validator.mq5 |
//|                                              MT5 License System |
//+------------------------------------------------------------------+
#property copyright "MT5 License System"
#property link      "https://mark8pips.vercel.app"
#property version   "1.00"
#property strict

input string LICENSE_KEY = "";  // Your License Key

// Global variables
string API_URL = "https://mark8pips.vercel.app/api/license/validate";
bool g_license_valid = false;
datetime g_last_check = 0;
int g_check_interval = 3600;  // Check every hour

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(LICENSE_KEY == "")
   {
      Alert("Please enter your license key in the EA settings!");
      return(INIT_FAILED);
   }
   
   if(!ValidateLicense())
   {
      Alert("License validation failed! Please check your license key.");
      return(INIT_FAILED);
   }
   
   Print("License validated successfully!");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| License validation function                                      |
//+------------------------------------------------------------------+
bool ValidateLicense()
{
   // Check if we need to validate (every hour)
   if(g_license_valid && (TimeCurrent() - g_last_check) < g_check_interval)
      return true;
   
   string headers = "Content-Type: application/json\r\n";
   char post_data[];
   char result_data[];
   string result_headers;
   
   // Get account information
   long account_number = AccountInfoInteger(ACCOUNT_LOGIN);
   string account_name = AccountInfoString(ACCOUNT_NAME);
   string broker_server = AccountInfoString(ACCOUNT_SERVER);
   string broker_company = AccountInfoString(ACCOUNT_COMPANY);
   
   // Create JSON payload
   string json = StringFormat(
      "{\"license_key\":\"%s\",\"account_number\":%d,\"account_name\":\"%s\",\"broker_server\":\"%s\",\"broker_company\":\"%s\",\"ip_address\":\"MT5_CLIENT\"}",
      LICENSE_KEY,
      account_number,
      account_name,
      broker_server,
      broker_company
   );
   
   StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1);  // Remove null terminator
   
   // Send HTTP request
   int timeout = 5000;
   int res = WebRequest(
      "POST",
      API_URL,
      headers,
      timeout,
      post_data,
      result_data,
      result_headers
   );
   
   if(res == -1)
   {
      int error = GetLastError();
      Print("WebRequest error: ", error);
      Print("Make sure URL is added to Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL");
      Print("Add URL: https://mark8pips.vercel.app");
      return false;
   }
   
   if(res == 200)
   {
      string response = CharArrayToString(result_data, 0, WHOLE_ARRAY, CP_UTF8);
      
      // Check if response contains "valid":true
      if(StringFind(response, "\"valid\":true") >= 0)
      {
         g_license_valid = true;
         g_last_check = TimeCurrent();
         
         // Extract product name if available
         int name_pos = StringFind(response, "\"product_name\":\"");
         if(name_pos >= 0)
         {
            string product = StringSubstr(response, name_pos + 16);
            int end_pos = StringFind(product, "\"");
            product = StringSubstr(product, 0, end_pos);
            Print("Licensed Product: ", product);
         }
         
         return true;
      }
      else
      {
         Print("License validation failed: ", response);
         return false;
      }
   }
   else
   {
      Print("Server returned error code: ", res);
      string response = CharArrayToString(result_data, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Response: ", response);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Validate license periodically
   if(!ValidateLicense())
   {
      Alert("License validation failed! EA will stop trading.");
      ExpertRemove();
      return;
   }
   
   // Your EA trading logic goes here
   // This is where you add your strategy code
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("EA stopped. Reason: ", reason);
}
//+------------------------------------------------------------------+
