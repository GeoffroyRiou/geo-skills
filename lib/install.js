import fs from 'node:fs';
import path from 'node:path';
import { formatInstallTarget } from './discover.js';
import { getSkillsDir, listSkills } from './skills.js';

function resolveLink(source, linkPath) {
  try {
    return fs.realpathSync(linkPath) === fs.realpathSync(source);
  } catch {
    return false;
  }
}

export function installSkills({ repoDir, target, skills, force = false }) {
  const available = listSkills(repoDir);
  const selected = skills?.length ? skills : available;

  const unknown = selected.filter((name) => !available.includes(name));
  if (unknown.length) {
    throw new Error(`Skills inconnus : ${unknown.join(', ')}`);
  }

  const skillsDir = getSkillsDir(repoDir);
  const targetDir = target.dir;
  const targetLabel = formatInstallTarget(target);
  fs.mkdirSync(targetDir, { recursive: true });

  const results = [];

  for (const skill of selected) {
    const source = path.join(skillsDir, skill);
    const linkPath = path.join(targetDir, skill);

    if (fs.existsSync(linkPath)) {
      const stat = fs.lstatSync(linkPath);
      if (stat.isSymbolicLink() && resolveLink(source, linkPath)) {
        results.push({ skill, status: 'skipped', linkPath, targetLabel });
        continue;
      }

      if (!force) {
        results.push({ skill, status: 'exists', linkPath, targetLabel });
        continue;
      }

      fs.rmSync(linkPath, { recursive: true, force: true });
    }

    fs.symlinkSync(source, linkPath, 'dir');
    results.push({ skill, status: 'linked', linkPath, source, targetLabel });
  }

  return results;
}
