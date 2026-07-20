import path from 'node:path';
import os from 'node:os';

export const REPO = 'GeoffroyRiou/geo-skills';
export const DEFAULT_BRANCH = 'main';
export const CACHE_DIR = path.join(os.homedir(), '.cache', 'geo-skills', 'repo');
export const SKILLS_DIR = 'skills';

export const PROVIDER_NAMES = ['cursor', 'claude', 'agents'];

export const PROVIDER_LABELS = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  agents: 'Agents',
};
