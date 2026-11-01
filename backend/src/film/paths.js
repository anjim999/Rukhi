import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Resolved from this file, not process.cwd(), so the CLI behaves the same from any directory.
export const BACKEND_ROOT = path.resolve(here, '../..');
export const REPO_ROOT = path.resolve(BACKEND_ROOT, '..');
export const KEY_PATH = process.env.GCP_KEY_PATH || path.join(BACKEND_ROOT, 'gcp_key.json');
export const PRODUCTIONS_DIR = process.env.FILM_PRODUCTIONS_DIR || path.join(REPO_ROOT, 'productions');
