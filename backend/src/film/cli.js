#!/usr/bin/env node
import path from 'path';
import * as stages from './stages.js';
import { writeReview } from './review.js';
import { getAccessToken, getKey } from './gcp.js';

const HELP = `Film production pipeline

  film new <slug> --script <file> [--bible <file>] [--from <earlier-slug>] [--title T] [--language L] [--style "…"]
                  [--aspect 16:9] [--resolution 720p] [--cap 250]
       --bible  the series bible (style, fixed character IDs, voices, sets); the breakdown obeys it
       --from   an earlier episode: reuse its approved characters, locations and reference images
  film breakdown <slug> [--force]                     script -> characters, locations, scenes
  film shots <slug> [--scene S01] [--force]           scenes -> shot lists
  film refs <slug> [--only characters|locations] [--id C01] [--count 3] [--redo]
  film pick <slug> <character|location> <id> <n>      lock candidate n as the reference
  film pick <slug> <character|location> <id> --file <image>   lock your own image
  film looks <slug> [--id KARTHIK_01] [--redo]        redraw each locked character in this episode's outfit
  film views <slug> [--id KARTHIK_01] [--only closeup,profileLeft] [--redo]   draw the reference-sheet views of each character
  film keyframes <slug> [--scene S01 | --shot S01-003] [--retake]
  film clips <slug> [--scene S01 | --shot S01-003] [--retake] [--parallel 3] [--takes 2]
       --takes  finished takes wanted per dialogue shot; pick the best performance with "select"
  film graphics <slug> [--scene S01 | --shot S01-003] [--redo]   render phone screens and title cards (free, exact text)
  film select <slug> <shot> <keyframe|clip> <take>    choose which take a shot uses
  film voices <slug> [--id KARTHIK_01] [--count 4] [--redo]   audition candidate voices for each character
  film voice <slug> <id> <voice>                      lock a character's permanent voice (e.g. Puck)
  film dub <slug> [--scene S01 | --shot S01-003] [--redo]    replace each dialogue clip's voice with the locked voices
  film assemble <slug> [--scene S01] [--original-voices]
  film status <slug>
  film estimate <slug> [--takes 3]
  film review <slug>                                  write review.html
  film cap <slug> <usd>                               change the spend cap
  film auth                                           check the Google Cloud key works (free)

Keyframes and clips cost money. Every paid step stops at the production's spend cap.
Music: put <slug>/music/S01.mp3 (per scene) or music/film.mp3 (whole film) before assembling.
Room sound: put <slug>/ambience/<locationId>.mp3 to use your own under dubbed dialogue; otherwise a soft room tone is used.`;

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[arg.slice(2)] = true;
    else flags[arg.slice(2)] = argv[++i];
  }
  return { positional, flags };
}

const money = (n) => `$${n.toFixed(2)}`;

async function main() {
  const { positional, flags } = parse(process.argv.slice(2));
  const [command, slug, ...rest] = positional;

  if (!command || command === 'help' || flags.help) {
    console.log(HELP);
    return;
  }
  if (command === 'auth') {
    await getAccessToken();
    console.log(`Google Cloud key works. Project: ${getKey().project_id}`);
    return;
  }
  if (!slug) throw new Error(`Missing production name. Run "film help".`);

  switch (command) {
    case 'new': {
      const film = stages.createFilm({
        slug,
        scriptPath: flags.script && path.resolve(flags.script),
        biblePath: flags.bible && path.resolve(flags.bible),
        from: flags.from,
        title: flags.title,
        language: flags.language,
        style: flags.style,
        aspectRatio: flags.aspect,
        resolution: flags.resolution,
        capUsd: flags.cap ? Number(flags.cap) : undefined,
      });
      console.log(`Created "${film.slug}" with a ${money(film.budget.capUsd)} spend cap.`);
      break;
    }
    case 'breakdown':
      await stages.breakdown(slug, { force: Boolean(flags.force) });
      break;
    case 'shots':
      await stages.planShots(slug, { sceneIds: flags.scene ? [flags.scene] : undefined, force: Boolean(flags.force) });
      break;
    case 'refs':
      await stages.generateRefs(slug, { only: flags.only, id: flags.id, count: flags.count ? Number(flags.count) : 3, redo: Boolean(flags.redo), noAnchor: Boolean(flags['no-anchor']) });
      break;
    case 'pick': {
      const [kind, id, candidate] = rest;
      if (!kind || !id || (!candidate && !flags.file)) throw new Error('Usage: film pick <slug> <character|location> <id> <n>  (or --file <image>)');
      const item = stages.pickRef(slug, kind, id, { candidate: Number(candidate), file: flags.file && path.resolve(flags.file) });
      console.log(`Locked ${item.id} ${item.name} -> ${item.ref}`);
      break;
    }
    case 'looks':
      await stages.generateLooks(slug, { id: flags.id, redo: Boolean(flags.redo) });
      break;
    case 'views':
      await stages.generateViews(slug, { id: flags.id, redo: Boolean(flags.redo), only: flags.only ? String(flags.only).split(',') : undefined });
      break;
    case 'keyframes':
      await stages.generateKeyframes(slug, { sceneId: flags.scene, shotId: flags.shot, retake: Boolean(flags.retake) });
      break;
    case 'clips':
      await stages.generateClips(slug, { sceneId: flags.scene, shotId: flags.shot, retake: Boolean(flags.retake), concurrency: flags.parallel ? Number(flags.parallel) : 3, minTakes: flags.takes ? Number(flags.takes) : 1 });
      break;
    case 'graphics':
      await stages.generateGraphics(slug, { sceneId: flags.scene, shotId: flags.shot, redo: Boolean(flags.redo) });
      break;
    case 'select': {
      const [shotId, kind, take] = rest;
      if (!shotId || !kind || !take) throw new Error('Usage: film select <slug> <shot> <keyframe|clip> <take>');
      stages.selectTake(slug, shotId, kind, Number(take));
      console.log(`${shotId} now uses ${kind} take ${take}.`);
      break;
    }
    case 'voices':
      await stages.generateVoiceSamples(slug, { id: flags.id, count: flags.count ? Number(flags.count) : 4, redo: Boolean(flags.redo) });
      break;
    case 'voice': {
      const [characterId, voice] = rest;
      if (!characterId || !voice) throw new Error('Usage: film voice <slug> <id> <voice>');
      const character = stages.setVoice(slug, characterId, voice);
      console.log(`${character.id} ${character.name} now always speaks as ${character.voiceId}.`);
      break;
    }
    case 'dub':
      await stages.dubClips(slug, { sceneId: flags.scene, shotId: flags.shot, redo: Boolean(flags.redo) });
      break;
    case 'assemble': {
      const file = await stages.assemble(slug, { sceneId: flags.scene, originalVoices: Boolean(flags['original-voices']) });
      console.log(file ? `Wrote ${file}` : 'Nothing to assemble yet: no shots have a selected clip.');
      break;
    }
    case 'status': {
      const s = stages.status(slug);
      console.log(`${s.film.title} — spent ~${money(s.spentUsd)} of ${money(s.capUsd)} cap`);
      const unlocked = s.refs.filter((r) => !r.locked);
      console.log(`References: ${s.refs.length - unlocked.length}/${s.refs.length} locked${unlocked.length ? ` (missing: ${unlocked.map((r) => r.id).join(', ')})` : ''}`);
      s.scenes.forEach((sc) => console.log(`  ${sc.id}  shots ${String(sc.shots).padStart(3)}  ${String(sc.seconds).padStart(4)}s  keyframes ${sc.keyframes}/${sc.shots}  clips ${sc.clips}/${sc.shots}${sc.pending ? `  (${sc.pending} rendering)` : ''}  ${sc.heading}`));
      const seconds = s.scenes.reduce((sum, sc) => sum + sc.seconds, 0);
      console.log(`Planned runtime: ${Math.floor(seconds / 60)}m ${seconds % 60}s`);
      break;
    }
    case 'estimate': {
      const e = stages.estimate(slug, { takes: flags.takes ? Number(flags.takes) : 3 });
      console.log(`${e.shots} shots, ${Math.floor(e.seconds / 60)}m ${e.seconds % 60}s of film, assuming ${e.takes} takes per shot:`);
      console.log(`  video ~${money(e.videoUsd)}  +  keyframes ~${money(e.imageUsd)}  =  ~${money(e.totalUsd)}`);
      console.log(`  already spent ~${money(e.spentUsd)}; cap ${money(e.capUsd)}. Prices are estimates; check film.json -> pricing.`);
      break;
    }
    case 'cap': {
      const cap = Number(rest[0]);
      if (!Number.isFinite(cap) || cap <= 0) throw new Error('Usage: film cap <slug> <usd>');
      stages.setCap(slug, cap);
      console.log(`Spend cap for "${slug}" is now ${money(cap)}.`);
      break;
    }
    case 'review':
      break;
    default:
      throw new Error(`Unknown command "${command}". Run "film help".`);
  }

  // Keep the review page current after anything that changes the production.
  if (!['status', 'estimate'].includes(command)) console.log(`Review page: ${writeReview(slug)}`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
