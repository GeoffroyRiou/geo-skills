import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, DEFAULT_BRANCH, REPO } from './constants.js';

function hasGit() {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function gitCloneOrPull() {
  const remote = `https://github.com/${REPO}.git`;

  if (fs.existsSync(path.join(CACHE_DIR, '.git'))) {
    execFileSync('git', ['-C', CACHE_DIR, 'fetch', '--depth', '1', 'origin', DEFAULT_BRANCH], {
      stdio: 'inherit',
    });
    execFileSync('git', ['-C', CACHE_DIR, 'reset', '--hard', `origin/${DEFAULT_BRANCH}`], {
      stdio: 'inherit',
    });
    return;
  }

  fs.mkdirSync(path.dirname(CACHE_DIR), { recursive: true });
  execFileSync('git', ['clone', '--depth', '1', '--branch', DEFAULT_BRANCH, remote, CACHE_DIR], {
    stdio: 'inherit',
  });
}

async function downloadTarball() {
  const url = `https://github.com/${REPO}/archive/refs/heads/${DEFAULT_BRANCH}.tar.gz`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de télécharger ${url} (${response.status})`);
  }

  const tmpDir = path.join(path.dirname(CACHE_DIR), 'tmp');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const tarPath = path.join(tmpDir, 'repo.tar.gz');
  fs.writeFileSync(tarPath, Buffer.from(await response.arrayBuffer()));

  execFileSync('tar', ['-xzf', tarPath, '-C', tmpDir], { stdio: 'inherit' });

  const extracted = fs
    .readdirSync(tmpDir)
    .find((entry) => entry.startsWith('geo-skills-') && fs.statSync(path.join(tmpDir, entry)).isDirectory());

  if (!extracted) {
    throw new Error('Archive GitHub invalide : dossier extrait introuvable');
  }

  fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  fs.renameSync(path.join(tmpDir, extracted), CACHE_DIR);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

export async function ensureRepo() {
  if (hasGit()) {
    gitCloneOrPull();
    return CACHE_DIR;
  }

  await downloadTarball();
  return CACHE_DIR;
}
