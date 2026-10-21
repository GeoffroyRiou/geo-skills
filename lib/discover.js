import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROVIDER_LABELS = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  agents: 'Agents',
};

function exists(dirPath) {
  try {
    fs.accessSync(dirPath);
    return true;
  } catch {
    return false;
  }
}

function isDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function hasSkillEntries(dirPath) {
  if (!isDirectory(dirPath)) {
    return false;
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).some((entry) => {
    if (!entry.isDirectory()) {
      return false;
    }
    return exists(path.join(dirPath, entry.name, 'SKILL.md'));
  });
}

function walkUp(startDir, maxDepth = 12) {
  const dirs = [];
  let current = path.resolve(startDir);

  for (let depth = 0; depth < maxDepth; depth += 1) {
    dirs.push(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return dirs;
}

function addTarget(targets, seen, target) {
  const normalized = path.resolve(target.dir);
  if (seen.has(normalized)) {
    return;
  }

  seen.add(normalized);
  targets.push({ ...target, dir: normalized });
}

function detectGlobalTarget(targets, seen, { provider, configDir, skillsDir, scope, label }) {
  const configExists = isDirectory(configDir);
  const skillsExists = isDirectory(skillsDir);

  if (!configExists && !skillsExists) {
    return;
  }

  addTarget(targets, seen, {
    key: `${provider}:${scope}`,
    provider,
    scope,
    label,
    dir: skillsDir,
    source: skillsExists ? 'skills existants' : `dossier ${path.basename(configDir)} détecté`,
  });
}

function detectProjectTargets(targets, seen, cwd, { provider, markerDir, skillsDirName, scope, labelPrefix }) {
  for (const dir of walkUp(cwd)) {
    const markerPath = path.join(dir, markerDir);
    const skillsPath = path.join(dir, markerDir, skillsDirName);

    if (!isDirectory(markerPath) && !isDirectory(skillsPath)) {
      continue;
    }

    const relative = dir === cwd ? 'projet courant' : path.relative(cwd, dir) || dir;

    addTarget(targets, seen, {
      key: `${provider}:${scope}:${dir}`,
      provider,
      scope,
      label: `${labelPrefix} (${relative})`,
      dir: skillsPath,
      source: isDirectory(skillsPath)
        ? `${markerDir}/${skillsDirName} existant`
        : `${markerDir} détecté`,
    });
  }
}

export function discoverInstallTargets({ cwd = process.cwd() } = {}) {
  const home = os.homedir();
  const targets = [];
  const seen = new Set();

  detectGlobalTarget(targets, seen, {
    provider: 'cursor',
    configDir: path.join(home, '.cursor'),
    skillsDir: path.join(home, '.cursor', 'skills'),
    scope: 'global',
    label: 'Cursor (personnel)',
  });

  detectGlobalTarget(targets, seen, {
    provider: 'claude',
    configDir: path.join(home, '.claude'),
    skillsDir: path.join(home, '.claude', 'skills'),
    scope: 'global',
    label: 'Claude Code (personnel)',
  });

  detectGlobalTarget(targets, seen, {
    provider: 'agents',
    configDir: path.join(home, '.agents'),
    skillsDir: path.join(home, '.agents', 'skills'),
    scope: 'global',
    label: 'Agents (personnel)',
  });

  detectProjectTargets(targets, seen, cwd, {
    provider: 'cursor',
    markerDir: '.cursor',
    skillsDirName: 'skills',
    scope: 'project',
    labelPrefix: 'Cursor',
  });

  detectProjectTargets(targets, seen, cwd, {
    provider: 'claude',
    markerDir: '.claude',
    skillsDirName: 'skills',
    scope: 'project',
    labelPrefix: 'Claude Code',
  });

  detectProjectTargets(targets, seen, cwd, {
    provider: 'agents',
    markerDir: '.agents',
    skillsDirName: 'skills',
    scope: 'project',
    labelPrefix: 'Agents',
  });

  return targets;
}

export function resolveInstallTarget({ targets, provider, scope, dir }) {
  if (dir) {
    return {
      key: 'custom',
      provider: provider ?? 'custom',
      scope: scope ?? 'custom',
      label: `Personnalisé (${dir})`,
      dir: path.resolve(dir),
      source: 'chemin explicite',
    };
  }

  if (!provider) {
    throw new Error('Provider obligatoire');
  }

  const matches = targets.filter((target) => target.provider === provider);
  if (!matches.length) {
    throw new Error(
      `Aucune installation ${PROVIDER_LABELS[provider] ?? provider} détectée sur cette machine`,
    );
  }

  if (scope) {
    const scoped = matches.filter((target) => target.scope === scope);
    if (scoped.length === 1) {
      return scoped[0];
    }
    if (scoped.length > 1) {
      throw new Error(
        `Plusieurs destinations ${provider} (${scope}) détectées. Précisez avec --dir`,
      );
    }
    throw new Error(`Aucune destination ${provider} (${scope}) détectée sur cette machine`);
  }

  if (matches.length === 1) {
    return matches[0];
  }

  throw new Error(
    `Plusieurs destinations ${PROVIDER_LABELS[provider] ?? provider} détectées. Précisez --scope project ou global, ou --dir`,
  );
}

export function formatInstallTarget(target) {
  return target.label;
}

export function hasSkillContent(dirPath) {
  return hasSkillEntries(dirPath);
}
