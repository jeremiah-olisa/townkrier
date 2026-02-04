import { User } from '../models/user.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file located in the examples directory
// Adjusted path assumes this file is in examples/constants/user.ts
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Wait, if it's in examples/constants, and .env is in examples, then it is ../.env
// But typical monorepo structure townkrier/.env ? No user said "examples directory" earlier but I see townkrier/.env usually.
// Let's check listing again. "list_dir examples" showed ".env". So it IS in examples/
// So path from examples/constants/user.ts is ../.env relative to __dirname (dist/constants/user.js?)
// When running tsx, __dirname points to source usually.
// Let's use path.resolve just to be safe or try ../.env

// Actually, safe bet: try to look up or use process.cwd() if running from root.
// If running from root: process.cwd() = townkrier. .env is in townkrier/.env ?
// list_dir examples showed .env. So examples/.env exists.
// User command: npx tsx examples/email-only.ts. CWD is townkrier.
// So relative path from townkrier to examples/.env is examples/.env.
// But dotenv config from within a file...
// Let's stick to the path requested or deduced.
dotenv.config({ path: path.join(__dirname, '../.env') });

export const user = new User({
    id: 'user-123',
    name: 'Jeremiah',
    email: process.env.TEST_EMAIL || 'jeremiaholisaiosa@maildrop.cc',
    phone: process.env.TEST_PHONE_NUMBER || '+2348123456789',
    pushToken: process.env.TEST_PUSH_TOKEN || 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
});
