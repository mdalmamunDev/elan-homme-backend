import { createMollieClient } from '@mollie/api-client';
import { config } from '../config';

// A single shared Mollie client instance.
export const mollieClient = createMollieClient({ apiKey: config.mollie.apiKey });
