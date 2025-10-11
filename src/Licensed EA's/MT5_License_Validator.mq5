//+------------------------------------------------------------------+
//|                                   MT5_License_System_Pro.mq5     |
//|                                    Industry-Level Licensing      |
//+------------------------------------------------------------------+
#property copyright "MT5 License Pro"
#property link      "https://mark8pips.vercel.app"
#property version   "2.00"
#property strict

//--- Input parameters
input string LICENSE_KEY = "";  // Your License Key
input bool SHOW_DASHBOARD = true;  // Show License Dashboard

//--- Global variables
string g_api_url = "https://mark8pips.vercel.app/api/license/validate";
bool g_license_valid = false;
datetime g_last_check = 0;
int g_check_interval = 3600;  // Recheck every hour
string g_product_name = "";
datetime g_license_expires = 0;
int g_accounts_used = 0;
int g_max_accounts = 0;
int g_days_remaining = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(LICENSE_KEY == "" || StringLen(LICENSE_KEY) < 10)
   {
      Alert("ERROR: Please enter your license key in EA settings!");
      ShowLicenseError("No License Key");
      return(INIT_FAILED);
   }
   
   Print("=== MT5 License System Pro v2.0 ===");
   Print("Validating license...");
   
   if(!ValidateLicense())
   {
      Alert("LICENSE VALIDATION FAILED! Contact support.");
      ShowLicenseError("Validation Failed");
      return(INIT_FAILED);
   }
   
   Print("✓ License validated successfully!");
   Print("✓ Product: ", g_product_name);
   Print("✓ Expires in: ", g_days_remaining, " days");
   Print("✓ Accounts used: ", g_accounts_used, "/", g_max_accounts);
   
   if(SHOW_DASHBOARD)
   {
      ShowLicenseDashboard();
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Enhanced license validation                                      |
//+------------------------------------------------------------------+
bool ValidateLicense()
{
   if(g_license_valid && (TimeCurrent() - g_last_check) < g_check_interval)
   {
      return true;
   }
   
   string headers = "Content-Type: application/json\r\n";
   char post_data[];
   char result_data[];
   string result_headers;
   
   // Collect comprehensive system information
   long account_number = AccountInfoInteger(ACCOUNT_LOGIN);
   string account_name = AccountInfoString(ACCOUNT_NAME);
   string broker_server = AccountInfoString(ACCOUNT_SERVER);
   string broker_company = AccountInfoString(ACCOUNT_COMPANY);
   string terminal_name = TerminalInfoString(TERMINAL_NAME);
   string terminal_company = TerminalInfoString(TERMINAL_COMPANY);
   int terminal_build = TerminalInfoInteger(TERMINAL_BUILD);
   string computer_name = TerminalInfoString(TERMINAL_PATH);
   
   // Create enhanced JSON payload
   string json = StringFormat(
      "{\"license_key\":\"%s\",\"account_number\":%d,\"account_name\":\"%s\",\"broker_server\":\"%s\",\"broker_company\":\"%s\",\"ip_address\":\"AUTO\",\"terminal_name\":\"%s\",\"terminal_build\":%d,\"terminal_company\":\"%s\",\"computer_name\":\"%s\",\"os_version\":\"Windows\"}",
      LICENSE_KEY,
      account_number,
      account_name,
      broker_server,
      broker_company,
      terminal_name,
      terminal_build,
      terminal_company,
      computer_name
   );
   
   StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1);
   
   ResetLastError();
   int timeout = 5000;
   int http_code = WebRequest(
      "POST",
      g_api_url,
      headers,
      timeout,
      post_data,
      result_data,
      result_headers
   );
   
   if(http_code == -1)
   {
      int error = GetLastError();
      Print("WebRequest Error: ", error);
      Print("Add to allowed URLs: https://mark8pips.vercel.app");
      
      // Grace period for temporary offline
      if(g_license_valid && (TimeCurrent() - g_last_check) < 86400)
      {
         Print("Using cached validation (grace period)");
         return true;
      }
      
      return false;
   }
   
   string response = CharArrayToString(result_data, 0, WHOLE_ARRAY, CP_UTF8);
   Print("License Server Response (", http_code, ")");
   
   if(http_code == 200 && StringFind(response, "\"valid\":true") >= 0)
   {
      g_license_valid = true;
      g_last_check = TimeCurrent();
      
      // Parse response data
      ParseLicenseResponse(response);
      
      return true;
   }
   else
   {
      Print("Validation failed: ", response);
      g_license_valid = false;
      return false;
   }
}

//+------------------------------------------------------------------+
//| Parse license validation response                                |
//+------------------------------------------------------------------+
void ParseLicenseResponse(string response)
{
   // Extract product name
   int pos = StringFind(response, "\"product_name\":\"");
   if(pos >= 0)
   {
      pos += 16;
      int end = StringFind(response, "\"", pos);
      g_product_name = StringSubstr(response, pos, end - pos);
   }
   
   // Extract days remaining
   pos = StringFind(response, "\"days_remaining\":");
   if(pos >= 0)
   {
      pos += 17;
      int end = StringFind(response, ",", pos);
      if(end < 0) end = StringFind(response, "}", pos);
      string days_str = StringSubstr(response, pos, end - pos);
      g_days_remaining = (int)StringToInteger(days_str);
   }
   
   // Extract accounts used
   pos = StringFind(response, "\"accounts_used\":");
   if(pos >= 0)
   {
      pos += 16;
      int end = StringFind(response, ",", pos);
      string acc_str = StringSubstr(response, pos, end - pos);
      g_accounts_used = (int)StringToInteger(acc_str);
   }
   
   // Extract max accounts
   pos = StringFind(response, "\"max_accounts\":");
   if(pos >= 0)
   {
      pos += 15;
      int end = StringFind(response, ",", pos);
      if(end < 0) end = StringFind(response, "}", pos);
      string max_str = StringSubstr(response, pos, end - pos);
      g_max_accounts = (int)StringToInteger(max_str);
   }
}

//+------------------------------------------------------------------+
//| Show license dashboard on chart                                  |
//+------------------------------------------------------------------+
void ShowLicenseDashboard()
{
   string dashboard = StringFormat(
      "╔═══════════════════════════════════╗\n" +
      "║     LICENSE INFORMATION           ║\n" +
      "╠═══════════════════════════════════╣\n" +
      "║ Product: %-24s ║\n" +
      "║ Status: ✓ ACTIVE                  ║\n" +
      "║ Expires in: %3d days              ║\n" +
      "║ Accounts: %d / %d                   ║\n" +
      "║ Account: %-24d ║\n" +
      "╚═══════════════════════════════════╝",
      g_product_name,
      g_days_remaining,
      g_accounts_used,
      g_max_accounts,
      AccountInfoInteger(ACCOUNT_LOGIN)
   );
   
   Comment(dashboard);
}

//+------------------------------------------------------------------+
//| Show license error                                               |
//+------------------------------------------------------------------+
void ShowLicenseError(string error_msg)
{
   string error_display = StringFormat(
      "╔═══════════════════════════════════╗\n" +
      "║     LICENSE ERROR                 ║\n" +
      "╠═══════════════════════════════════╣\n" +
      "║ %s\n" +
      "║ Contact: support@yoursite.com     ║\n" +
      "╚═══════════════════════════════════╝",
      error_msg
   );
   
   Comment(error_display);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!ValidateLicense())
   {
      Alert("LICENSE VALIDATION FAILED!");
      ShowLicenseError("Validation Failed");
      ExpertRemove();
      return;
   }
   
   // Warning if license expires soon
   if(g_days_remaining <= 7 && g_days_remaining > 0)
   {
      static datetime last_warning = 0;
      if(TimeCurrent() - last_warning > 3600) // Once per hour
      {
         Alert("LICENSE WARNING: Only ", g_days_remaining, " days remaining!");
         last_warning = TimeCurrent();
      }
   }
   
   if(SHOW_DASHBOARD)
   {
      ShowLicenseDashboard();
   }
   
   //--- YOUR TRADING LOGIC HERE ---
   // Add your EA strategy code below this line
   
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Comment("");
   Print("EA stopped. Reason: ", reason);
}
//+------------------------------------------------------------------+
