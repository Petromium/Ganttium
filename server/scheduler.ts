import { syncExchangeRates } from "./exchangeRateService";
import { log } from "./app";

/**
 * Calculate time until next 17:00 CET (Central European Time)
 * ECB updates rates around 16:00 CET, so we sync at 17:00 to ensure we get the latest
 */
function getMillisecondsUntilSync(): number {
  const now = new Date();
  
  // Convert to CET (UTC+1 in winter, UTC+2 in summer)
  // For simplicity, we'll use UTC+1 (winter time)
  // In production, you'd want to handle DST properly
  const cetOffset = 1; // UTC+1 for CET (adjust for CEST if needed)
  const nowUTC = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const nowCET = new Date(nowUTC.getTime() + (cetOffset * 3600000));
  
  // Target time: 17:00 CET
  const targetHour = 17;
  const targetMinute = 0;
  
  const target = new Date(nowCET);
  target.setHours(targetHour, targetMinute, 0, 0);
  
  // If target time has passed today, schedule for tomorrow
  if (target <= nowCET) {
    target.setDate(target.getDate() + 1);
  }
  
  // Calculate milliseconds until target
  const msUntilTarget = target.getTime() - nowCET.getTime();
  
  // Also ensure we don't wait more than 24 hours (safety check)
  return Math.min(msUntilTarget, 24 * 60 * 60 * 1000);
}

/**
 * Schedule daily exchange rate sync
 * Syncs at 17:00 CET daily (after ECB updates at 16:00 CET)
 */
function scheduleDailySync(): void {
  const msUntilSync = getMillisecondsUntilSync();
  const hoursUntilSync = msUntilSync / (1000 * 60 * 60);
  
  log(`Exchange rate sync scheduled in ${hoursUntilSync.toFixed(2)} hours (17:00 CET daily)`);
  
  setTimeout(async () => {
    log("Starting scheduled exchange rate sync...");
    
    try {
      const result = await syncExchangeRates();
      
      if (result.success) {
        log(`Exchange rate sync completed: ${result.ratesUpdated} rates updated`);
      } else {
        log(`Exchange rate sync failed: ${result.error}`, "error");
      }
    } catch (error: any) {
      log(`Exchange rate sync error: ${error.message}`, "error");
    }
    
    // Schedule next sync (24 hours from now)
    scheduleDailySync();
  }, msUntilSync);
}

/**
 * Initialize scheduler
 * Starts the daily exchange rate sync schedule
 */
export function initializeScheduler(): void {
  log("Initializing scheduler...");
  
  // Run initial sync on startup (optional - you may want to skip this in production)
  const runOnStartup = process.env.RUN_EXCHANGE_SYNC_ON_STARTUP !== "false";
  
  if (runOnStartup) {
    // Run sync after a short delay to allow server to fully start
    setTimeout(async () => {
      log("Running initial exchange rate sync...");
      try {
        const result = await syncExchangeRates();
        if (result.success) {
          log(`Initial sync completed: ${result.ratesUpdated} rates updated`);
        } else {
          log(`Initial sync failed: ${result.error}`, "error");
        }
      } catch (error: any) {
        log(`Initial sync error: ${error.message}`, "error");
      }
    }, 5000); // 5 second delay
  }
  
  // Schedule daily syncs
  scheduleDailySync();
}

