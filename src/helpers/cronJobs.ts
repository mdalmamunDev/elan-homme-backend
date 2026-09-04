import cron from 'node-cron';
import { logger } from '../shared/logger';
import colors from 'colors';

//Auto complete : 'accepted' | 'paid' | 'picked'
//Auto cancel : 'created' | 'requested'

export function startCronJobs() {
  // Example: Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info(
      colors.green(
        '🚀 Daily job running at 9 AM - ' + new Date().toLocaleString(),
      ),
    );
    // Add your daily task here
  });
}
