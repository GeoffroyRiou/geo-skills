import fs from 'node:fs';
import path from 'node:path';
import { SKILLS_DIR } from './constants.js';

export function getSkillsDir(repoDir) {
  return path.join(repoDir, SKILLS_DIR);
}

export function listSkills(repoDir) {
  const skillsDir = getSkillsDir(repoDir);

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => fs.existsSync(path.join(skillsDir, name, 'SKILL.md')))
    .sort();
}
