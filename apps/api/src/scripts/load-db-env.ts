import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root
// Path: src/scripts/load-db-env.ts -> ../../../../.env
config({ path: resolve(__dirname, '../../../../.env') });
