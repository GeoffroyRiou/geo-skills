#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE_DIR, PROVIDER_LABELS, PROVIDER_NAMES } from '../lib/constants.js';
import { discoverInstallTargets, resolveInstallTarget } from '../lib/discover.js';
import { ensureRepo } from '../lib/download.js';
import { installSkills } from '../lib/install.js';
import { chooseMany, chooseOne } from '../lib/prompt.js';
import { listSkills } from '../lib/skills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_REPO = path.resolve(__dirname, '..');

function printHelp() {
  console.log(`
geo-skills — installer des agent skills

Usage:
  npx github:GeoffroyRiou/geo-skills [install] [options]
  npx github:GeoffroyRiou/geo-skills detect
  npx github:GeoffroyRiou/geo-skills list
  npx github:GeoffroyRiou/geo-skills update

Options:
  -p, --provider <name>  cursor | claude | agents
      --scope <name>     project | global (si plusieurs destinations)
      --dir <path>       chemin explicite (contourne la détection)
  -s, --skills <names>   skills séparés par des virgules (défaut: tous)
  -y, --yes              écraser sans confirmation
  -h, --help             afficher cette aide

Exemples:
  npx github:GeoffroyRiou/geo-skills detect
  npx github:GeoffroyRiou/geo-skills install --provider cursor
  npx github:GeoffroyRiou/geo-skills install --provider agents --scope project
  npx github:GeoffroyRiou/geo-skills install --dir ~/.cursor/skills --skills implement
`);
}

function parseArgs(argv) {
  const args = {
    command: 'install',
    provider: null,
    scope: null,
    dir: null,
    skills: null,
    yes: false,
    help: false,
  };

  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '-h' || arg === '--help') {
      args.help = true;
      continue;
    }

    if (arg === '-y' || arg === '--yes') {
      args.yes = true;
      continue;
    }

    if (arg === '-p' || arg === '--provider') {
      args.provider = argv[++i]?.trim();
      continue;
    }

    if (arg.startsWith('--provider=')) {
      args.provider = arg.slice('--provider='.length).trim();
      continue;
    }

    if (arg === '--scope') {
      args.scope = argv[++i]?.trim();
      continue;
    }

    if (arg.startsWith('--scope=')) {
      args.scope = arg.slice('--scope='.length).trim();
      continue;
    }

    if (arg === '--dir') {
      args.dir = argv[++i]?.trim();
      continue;
    }

    if (arg.startsWith('--dir=')) {
      args.dir = arg.slice('--dir='.length).trim();
      continue;
    }

    if (arg === '-s' || arg === '--skills') {
      args.skills = argv[++i]?.split(',').map((value) => value.trim()).filter(Boolean);
      continue;
    }

    if (arg.startsWith('--skills=')) {
      args.skills = arg.slice('--skills='.length).split(',').map((value) => value.trim()).filter(Boolean);
      continue;
    }

    if (arg === '-t' || arg === '--target') {
      const legacy = argv[++i]?.trim();
      if (legacy === 'agents-global') {
        args.provider = 'agents';
        args.scope = 'global';
      } else if (legacy === 'agents') {
        args.provider = 'agents';
        args.scope = 'project';
      } else {
        args.provider = legacy;
      }
      continue;
    }

    positional.push(arg);
  }

  if (positional[0] && ['install', 'detect', 'list', 'update'].includes(positional[0])) {
    args.command = positional.shift();
  }

  return args;
}

function assertProvider(provider) {
  if (!provider || !PROVIDER_NAMES.includes(provider)) {
    throw new Error(`Provider invalide : ${provider ?? '(vide)'} (${PROVIDER_NAMES.join(' | ')})`);
  }
}

async function resolveTargetChoice(args, targets) {
  if (args.dir) {
    return resolveInstallTarget({
      targets,
      provider: args.provider ?? undefined,
      scope: args.scope ?? undefined,
      dir: args.dir,
    });
  }

  if (args.provider) {
    assertProvider(args.provider);
    return resolveInstallTarget({
      targets,
      provider: args.provider,
      scope: args.scope ?? undefined,
    });
  }

  if (!targets.length) {
    throw new Error(
      'Aucun provider détecté sur cette machine (Cursor, Claude Code ou Agents).\n' +
        'Installez un outil compatible ou utilisez --dir pour indiquer le dossier skills.',
    );
  }

  return chooseOne({
    title: 'Où installer les skills ?',
    options: targets.map((target) => ({
      value: target.key,
      label: `${target.label} → ${target.dir} (${target.source})`,
    })),
  }).then((key) => targets.find((target) => target.key === key));
}

async function resolveRepo() {
  const isDevCheckout = fs.existsSync(path.join(LOCAL_REPO, '.git'));
  if (isDevCheckout && process.env.GEO_SKILLS_USE_LOCAL !== '0') {
    return LOCAL_REPO;
  }

  console.log('Téléchargement des skills…');
  return ensureRepo();
}

function printResults(results) {
  for (const result of results) {
    if (result.status === 'linked') {
      console.log(`✓ ${result.skill} → ${result.linkPath} (${result.targetLabel})`);
    } else if (result.status === 'skipped') {
      console.log(`· ${result.skill} déjà lié (${result.targetLabel})`);
    } else {
      console.log(`! ${result.skill} existe déjà : ${result.linkPath} (${result.targetLabel})`);
    }
  }
}

async function runDetect() {
  const targets = discoverInstallTargets();

  if (!targets.length) {
    console.log('Aucun dossier provider détecté sur cette machine.');
    console.log('\nDossiers recherchés :');
    console.log('  ~/.cursor, ~/.claude, ~/.agents');
    console.log('  .cursor, .claude, .agents (depuis le répertoire courant)');
    return;
  }

  console.log('Destinations détectées :\n');
  for (const target of targets) {
    console.log(`  ${target.label}`);
    console.log(`    provider : ${target.provider} (${target.scope})`);
    console.log(`    dossier  : ${target.dir}`);
    console.log(`    source   : ${target.source}\n`);
  }
}

async function runInstall(args) {
  const repoDir = await resolveRepo();
  const available = listSkills(repoDir);

  if (!available.length) {
    throw new Error('Aucun skill trouvé dans le dépôt');
  }

  const targets = discoverInstallTargets();
  const target = await resolveTargetChoice(args, targets);

  let skills = args.skills;
  if (!skills?.length) {
    skills = await chooseMany({
      title: 'Quels skills installer ?',
      options: available.map((name) => ({ value: name, label: name })),
    });
  }

  const results = installSkills({
    repoDir,
    target,
    skills,
    force: args.yes,
  });

  const conflicts = results.filter((result) => result.status === 'exists');
  if (conflicts.length && !args.yes) {
    console.log('\nCertains liens existent déjà. Relancez avec --yes pour écraser.');
  }

  printResults(results);
  console.log(`\nProvider : ${PROVIDER_LABELS[target.provider] ?? target.provider} (${target.scope})`);
  console.log(`Destination : ${target.dir}`);
  console.log(`Cache : ${repoDir === LOCAL_REPO ? LOCAL_REPO : CACHE_DIR}`);
}

async function runList() {
  const repoDir = await resolveRepo();
  const skills = listSkills(repoDir);
  console.log('Skills disponibles :');
  for (const skill of skills) {
    console.log(`  - ${skill}`);
  }
}

async function runUpdate() {
  console.log('Mise à jour du cache…');
  await ensureRepo();
  console.log(`Cache à jour : ${CACHE_DIR}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.command === 'detect') {
    await runDetect();
    return;
  }

  if (args.command === 'list') {
    await runList();
    return;
  }

  if (args.command === 'update') {
    await runUpdate();
    return;
  }

  await runInstall(args);
}

main().catch((error) => {
  console.error(`Erreur : ${error.message}`);
  process.exit(1);
});
