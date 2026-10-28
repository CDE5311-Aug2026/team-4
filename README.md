# Downstairs · 99 Years of Everyday Life

A playable English edition of the HDB neighbourhood game prototype. Place the entire HDB neighbourhood on a vacant lot, then enter it to interact with residents, buildings and facilities.

**This is the default project in this repository**, matching the [shared English demo](https://downstairs-sunset-en.awaregiant.chatgpt.site), with construction fireworks and opening/closing envelopes.

```sh
git clone https://github.com/CDE5311-Aug2026/team-4.git
cd team-4
npm start
```

Open `http://127.0.0.1:4193/`. No dependency installation is needed. If you already have this repository, run `git pull`, then `npm start` from its root. `npm run dev` also starts this demo.

## Play offline

Open `index.html` in a browser that supports WebGL 2. All scripts and assets are included; no internet connection, installation, or API key is required.

With Node.js installed, run `npm start` and visit http://127.0.0.1:4193/ . After editing `scene-source.mjs`, run `npm run build` to rebuild the scene bundle. No dependency installation is needed.

## Team development

The repository root contains the current English demo, including construction fireworks and animated letter envelopes. The earlier HDB Eco Community project is preserved under [`legacy/hdb-eco-community/`](legacy/hdb-eco-community/); it is a separate prototype.

### Start

Install Node.js 22 or newer, then run from this directory:

```sh
npm start
```

Open `http://127.0.0.1:4193/`. There is no install step; the runtime and scene-building helper use bundled files and Node built-ins. You can also open `index.html` directly for offline play. Refresh the browser after editing.

### What to edit

| File | Responsibility |
| --- | --- |
| `app.js` | Interface, dialogs, player actions, letter-envelope state and optional local saves |
| `engine.js` | Game rules, cards, residents, letters and ending |
| `scene-source.mjs` | Three.js neighbourhood, click targets, camera and construction fireworks |
| `style.css`, `scene.css`, `english.css` | Layout and scene/interface styling |
| `envelope.css` | Layered envelope, hinged flap and paper animation |
| `art.js` | Facility art, portraits and memory illustrations |
| `vendor/` | Bundled Three.js source and its MIT licence |
| `scripts/build-scene.cjs` | Offline scene bundler |

After changing `scene-source.mjs`, rebuild and commit both source and bundle:

```sh
npm run build
```

Do not edit `scene.bundle.js` directly. Other JavaScript and CSS changes need only a browser refresh. The build uses a locally installed esbuild if available, otherwise the included offline bundler; it needs no machine-specific paths.

### Collaborate

Pull the latest `main`, create a branch for your changes, and open a pull request back to `main`. Edit the files at the repository root for this prototype. The former `demos/downstairs-en/` copy has been promoted here, so there is one current source location. No API keys or hosting credentials are needed. Browser saves stay on each player's device.

To work on the earlier prototype, enter `legacy/hdb-eco-community/` and follow its existing installation and run instructions there.

The shared playable build is [downstairs-sunset-en.awaregiant.chatgpt.site](https://downstairs-sunset-en.awaregiant.chatgpt.site). GitHub commits do not automatically redeploy that site.

## How to play

1. Choose a vacant lot and place the entire HDB neighbourhood. This opening step does not use an action.
2. Enter the neighbourhood. Click the building, residents' window markers, or facilities. Drag to rotate; use the wheel or buttons to zoom. Overview returns to the land view.
3. Read and answer the community letters. Replies do not use actions.
4. Each round gives you two actions: Build a facility, issue a Policy, or Visit a household. Select a facility, then click a space inside the neighbourhood to build it.
5. Once both actions are used, end the decade. Ten rounds cover a 99-year lease and end with a factual reflection on your decisions.
6. Each of the four badges holds up to three stars. Three, six, and nine total stars unlock one additional facility space each. Built facilities normally cannot be removed.
7. First visits reveal access barriers, collect a memory photo, and unlock residents' requests. Read a visited household's current situation for free, or spend an action on another visit.

Settings includes instructions, optional sound, optional saving on this device, the community log, JSON export, and restarting.

## Included

- Ten rounds, twenty actions, four badges, seven facility spaces.
- Seventeen facility/policy cards, five households, seventeen types of scheduled or conditional letters.
- Access barriers, housing restrictions, fading and restored photos, follow-up letters, and a factual ending.
- A placeable HDB scene with flats, corridors, a void deck, courtyard, roof, residents, and live facility construction.
- Warm pixel-style rendering, native scene hit testing, camera controls, English scene signs, portraits, and memory illustrations.
- Desktop and phone layouts, keyboard-accessible controls and dialogs.

## Prototype notes

The English edition preserves the original rules and scene interactions. The reference image's money system is not part of this proposal version. The Planning Assistant and ending use local rules and factual templates; they do not call an AI service. Saving is off by default and writes to browser storage only when enabled. English progress is separate from Chinese progress.

The original generated image is retained as a reference asset; it is not used as the game world's background. The game world uses independent Three.js objects. Three.js and its MIT licence are included under `vendor/`.
