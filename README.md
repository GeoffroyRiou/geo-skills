# geo-skills

CLI pour installer des [agent skills](https://docs.cursor.com/context/skills) dans **Cursor**, **Claude Code** ou **Agents**.

Les skills sont installés via des liens symboliques vers le dépôt source — pas de copie, pas de duplication.

## Installation rapide

Le package n’est **pas** publié sur npmjs. Lancer directement depuis GitHub :

```bash
npx github:GeoffroyRiou/geo-skills
```

Le CLI détecte automatiquement les destinations disponibles et propose un menu interactif.

## Prérequis

- Node.js ≥ 18
- `git` recommandé (sinon téléchargement via archive GitHub)

## Commandes

Préfixe recommandé pour toutes les commandes :

```bash
npx github:GeoffroyRiou/geo-skills <commande>
```

| Commande | Description |
|----------|-------------|
| *(aucune)* / `install` | Installe des skills |
| `detect` | Liste les destinations détectées sur la machine |
| `list` | Liste les skills disponibles dans le dépôt |
| `update` | Met à jour le cache local des skills |

### Options

```
-p, --provider <name>   cursor | claude | agents
    --scope <name>      project | global (si plusieurs destinations)
    --dir <path>        chemin explicite (contourne la détection)
-s, --skills <names>    skills séparés par des virgules (défaut : tous)
-y, --yes               écraser sans confirmation
-h, --help              afficher l'aide
```

### Exemples

```bash
# Détecter les providers installés
npx github:GeoffroyRiou/geo-skills detect

# Installer tous les skills pour Cursor (global)
npx github:GeoffroyRiou/geo-skills install --provider cursor

# Installer un skill précis pour Agents (projet courant)
npx github:GeoffroyRiou/geo-skills install --provider agents --scope project --skills implement

# Chemin personnalisé, mode non interactif
npx github:GeoffroyRiou/geo-skills install --dir ~/.cursor/skills --skills implement,to-issues -y
```

En mode non interactif (CI, script), précisez `--provider`, `--scope` ou `--dir`, et `--skills`.

## Mettre à jour les skills

Les skills installés sont des liens symboliques vers le cache local (`~/.cache/geo-skills/repo`). Après un push sur GitHub :

```bash
npx github:GeoffroyRiou/geo-skills update
```

Pour installer un **nouveau** skill ajouté au dépôt, relancer `install`.

## Destinations détectées

Le CLI cherche les dossiers skills à deux niveaux :

| Provider | Global (personnel) | Projet |
|----------|-------------------|--------|
| Cursor | `~/.cursor/skills` | `.cursor/skills` |
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Agents | `~/.agents/skills` | `.agents/skills` |

La détection remonte l’arborescence depuis le répertoire courant pour trouver les dossiers projet.

## Licence

MIT
