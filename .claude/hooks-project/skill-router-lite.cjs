#!/usr/bin/env node
'use strict';

// Project hook: skill-router-lite (UserPromptSubmit)
// Replaces the vendor skill-router-reminder in settings.json.
//
// Problem it fixes: the vendor hook injects the FULL ~20KB domain matrix into
// EVERY user prompt. Over a long session that is tens of thousands of wasted
// context tokens per turn, restating text that is already in context.
//
// Behavior:
//   - FIRST prompt of a session  → delegate to the vendor script and inject the
//     full matrix (single source of truth stays vendor-maintained).
//   - Subsequent prompts         → inject a compact (~25 line) reminder that
//     re-triggers classification and points back to the full matrix.
//
// Session tracking: a tmp lock file keyed by session_id (falls back to cwd hash
// when the harness provides no session_id — then "once per workspace/day").
//
// Escape hatches:
//   MSW_SKILL_ROUTER_DISABLE=1  → inject nothing
//   MSW_SKILL_ROUTER_FULL=1     → always inject the full vendor matrix

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

if (process.env.MSW_SKILL_ROUTER_DISABLE === '1') process.exit(0);

let input = {};
try {
  const raw = fs.readFileSync(0, 'utf8').trim();
  input = raw ? JSON.parse(raw) : {};
} catch (_) {}

function vendorScript() {
  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
  const candidate = path.join(root, '.claude', 'hooks', 'skill-router-reminder', 'skill-router-reminder.cjs');
  return fs.existsSync(candidate) ? candidate : null;
}

function emitFull() {
  const script = vendorScript();
  if (script) {
    const r = spawnSync(process.execPath, [script], {
      input: JSON.stringify(input),
      encoding: 'utf8',
      timeout: 4000,
      windowsHide: true,
    });
    if (!r.error && r.status === 0 && r.stdout) {
      process.stdout.write(r.stdout);
      return true;
    }
  }
  return false;
}

const LITE = `<msw-skill-router-reminder mode="lite">
Re-classify this message (full matrix: docs/reference/skill-routing.md). If it
touches a NEW MSW domain, load that skill before planning. Meta work (docs, git,
hooks/settings, Q&A) loads nothing — AGENTS.md P2. Never re-read what is in context.

Foundation (only when touching MSW game files, if not already in context):
  msw-general, msw-ui-system + platform.md/workspace.md/entity.md/authoring.md + platform-rect.md

Domain → additional skill:
  mlua/script/component/event  → msw-scripting (+datastorage.md if save/persist; verify-checklist.md every impl turn)
  sprite/sound/RUID search     → msw-search        | SpriteRUID/ImageRUID/thumbnail:// → msw-sprite-ruid
  avatar/costume/motion        → msw-avatar        | DefaultPlayer/speed/jump/camera   → msw-defaultplayer
  attack/hit/damage/monster    → msw-combat-system (+monster.md/hp-gauge.md/projectile.md/ai-bt.md per sub-trigger)
  inventory/shop/quest/ranking → msw-packages (catalog FIRST — never write standard systems from scratch)
                                 + msw-wiki: local mirrors docs/wiki/mswpackages/ (read INDEX.md before any GitHub fetch)
  official examples/obj pool/collision-detect choice/UI style packs → msw-wiki (docs/wiki/roguelike-world + mswpackages)
  NEW standalone game planning/GDD → msw-planning (in THIS repo "next task/continue" = docs/tasks.md → msw-project, NOT planning)
  popup/HUD/.ui                → msw-ui-system refs (+builder-protocol.md; docs/reference/game-ui-ux-theory.md §7 rubric)
  .map/.model/entity/platform  → msw-general refs (entity.md / model.md / platform*.md / troubleshooting.md)
  this repo's work loop        → msw-project (status → pitfalls check → implement → verify → record)

Project docs: docs/pitfalls.md (silent-failure traps — check quick index before implementing)
              docs/workflow.md (procedure) | docs/tasks.md (what to do) | docs/tile-scheme.md (terrain grammar)

Hard rules: load skills via the skill system (never Read workspace 'plugins/' paths);
Read references IN FULL with the Read tool (no offset/limit, no shell cat/head);
SKILL.md alone ≠ loaded when references/*.md exist; use Glob/Read/Grep — never
shell commands — for workspace exploration.
</msw-skill-router-reminder>
`;

function lockPath() {
  const key = String(input.session_id || '') ||
    crypto.createHash('sha1').update(process.cwd() + new Date().toDateString()).digest('hex');
  const id = crypto.createHash('sha1').update(key).digest('hex').slice(0, 16);
  return path.join(os.tmpdir(), `msw-router-full-${id}`);
}

if (process.env.MSW_SKILL_ROUTER_FULL === '1') {
  if (!emitFull()) process.stdout.write(LITE);
  process.exit(0);
}

const lock = lockPath();
if (!fs.existsSync(lock)) {
  try { fs.writeFileSync(lock, ''); } catch (_) {}
  if (!emitFull()) process.stdout.write(LITE);
} else {
  process.stdout.write(LITE);
}
process.exit(0);
