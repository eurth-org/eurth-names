<script lang="ts">
  /*
   * The generator: one Svelte component, hydrated on the start page.
   *
   *   - The language lives in the link (?p=… or ?d=…), read safely on arrival and kept in step.
   *   - Nothing is stored: picks last for the visit; "save" is a link, a file or the profile.
   *   - Every batch has a written description, and a line for screen readers when it arrives.
   *   - Only tokens and eu- classes: no colour, font or spacing of its own.
   *
   * The logic is all in src/names/; this file only shows it.
   */
  import { faArrowsRotate, faCheck, faDice, faDownload, faFolderOpen, faLock, faLockOpen, faPlus, faRotateLeft, faStar, faTriangleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
  import { createProfile, getSection, setNation, setSection, type EurthProfile } from '@eurth/profile';
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { calm, copyText, download, fileSlug, playTones, toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import ShareButtons from '@eurth/style/components/ShareButtons.svelte';
  import { onMount } from 'svelte';
  import { announceBatch, describeBatch, describeLanguage, howMade, KIND_TITLES } from '../names/describe';
  import { batchNames, languageAsJson, languageFileName, languageFromJson, namesAsCsv, namesAsText, pickKey, picksAsText } from '../names/export';
  import { isPlanetName, PLANET_TOAST } from '../names/fun';
  import { generate, KINDS, newDraw, reroll, type Draw, type Kind, type Name } from '../names/generate';
  import { defaultState, presetOf, readLink, writeLink, type State } from '../names/link';
  import { cleanInt, formatAffixes, formatBanned, formatEndings, formatShapes, formatSounds, hasRoom, sanitise, toDraft, type Ending, type Language, type SurnamePattern } from '../names/model';
  import { PRESETS, presetById } from '../names/presets';
  import { fromSection, picksOf, toSection } from '../names/profile';
  import { cleanSeed, freshSeed } from '../names/random';
  import { review } from '../names/review';
  import ListField from './ListField.svelte';

  // Passed in by the page: browser code never imports eurth.config.mjs (see the note there).
  let { siteName, siteUrl }: { siteName: string; siteUrl: string } = $props();

  const start = defaultState();
  let language = $state.raw<Language>(start.language);
  let draw = $state.raw<Draw>(start.draw);
  let locked = $state(false);
  let picked = $state.raw<Name[]>([]);
  let addPicks = $state(false);
  let profile = $state.raw<EurthProfile | null>(null);
  let nation = $state('');
  let ready = $state(false);
  let announcement = $state('');
  /** The language as it was before a preset replaced it, for one step back. */
  let before = $state.raw<State | null>(null);
  let newEnding = $state('');
  let fileInput: HTMLInputElement | undefined = $state();

  const state = $derived<State>({ language, draw });
  const batch = $derived(generate(language, draw));
  const names = $derived(batchNames(batch));
  const notes = $derived(review(language));
  const preset = $derived(presetOf(language));
  const query = $derived(writeLink(state));
  const isDefault = $derived(query === writeLink(start));
  // Before the page has loaded there is no address to read: the site's own, then.
  const link = $derived(`${ready ? `${location.origin}${location.pathname}` : `${siteUrl}/`}${isDefault ? '' : `?${query}`}`);
  const title = $derived(`${language.name || 'A naming language'}, seed ${draw.seed}`);
  const pickedKeys = $derived(new Set(picked.map(pickKey)));
  const room = $derived(hasRoom(language));

  // ---- The typing effect: a new batch types itself in, letter by letter, fast. -------------
  const STEP = 16; // milliseconds a letter
  const STAGGER = 14; // milliseconds between one row and the next
  let typedFrom = $state<Record<Kind, number>>({ place: 0, given: 0, surname: 0 });
  let clock = $state(0);
  let frame = 0;

  function typeIn(kinds: readonly Kind[]) {
    // Nothing moves for reduced motion: the names are simply there.
    if (!ready || calm()) return;
    const now = performance.now();
    typedFrom = { ...typedFrom, ...Object.fromEntries(kinds.map((k) => [k, now])) };
    clock = now;
    cancelAnimationFrame(frame);
    const tick = (time: number) => {
      clock = time;
      // Under half a second, then every letter is in.
      if (time - now < 480) frame = requestAnimationFrame(tick);
      else typedFrom = { place: 0, given: 0, surname: 0 };
    };
    frame = requestAnimationFrame(tick);
    // The signature sound: two soft keys (silent until sound is switched on).
    playTones([[1568, 0, 0.012], [1245, 0.05, 0.01]], { length: 0.08 });
  }

  /** How many letters of a name are typed so far. */
  function typed(kind: Kind, row: number, length: number): number {
    const from = typedFrom[kind];
    if (from === 0) return length;
    return Math.max(0, Math.min(length, Math.floor((clock - from - row * STAGGER) / STEP)));
  }

  // ---- Arriving, and keeping the address in step ------------------------------------------
  onMount(() => {
    // A link is someone else's input: readLink never throws and clamps everything it reads.
    const arrived = readLink(location.search);
    ready = true;
    if (arrived.found === 'ok') {
      language = arrived.state.language;
      draw = arrived.state.draw;
      typeIn(KINDS);
    } else if (arrived.found === 'newer') {
      toast('That link was made with a newer version of Names. Reload the page to get it, then open the link again.');
    } else if (arrived.found === 'broken') {
      toast("That link didn't hold a language we could read, so here is one to start from.");
    }
    return () => cancelAnimationFrame(frame);
  });

  // The address bar follows the language, so the link can be copied from there too.
  $effect(() => {
    const search = isDefault ? '' : `?${query}`;
    if (ready && location.search !== search) history.replaceState(history.state, '', `${location.pathname}${search}`);
  });

  /** After new names: say so to screen readers, and look for the planet. */
  function arrived(kinds: readonly Kind[]) {
    typeIn(kinds);
    const next = generate(language, draw);
    announcement = announceBatch(next);
    if (kinds.some((kind) => next[kind].names.some((n) => isPlanetName(n.text)))) toast(PLANET_TOAST);
  }

  // ---- Actions ------------------------------------------------------------------------------
  function generateAll() {
    // A locked seed stays; the columns move on under it. Otherwise: a new seed.
    draw = locked
      ? { seed: draw.seed, rolls: { place: draw.rolls.place + 1, given: draw.rolls.given + 1, surname: draw.rolls.surname + 1 } }
      : newDraw(freshSeed(crypto.getRandomValues(new Uint32Array(1))[0]! / 4294967296));
    arrived(KINDS);
  }

  function rerollColumn(kind: Kind) {
    draw = reroll(draw, kind);
    arrived([kind]);
  }

  function setSeed(value: string) {
    draw = newDraw(cleanSeed(value, draw.seed));
    arrived(KINDS);
  }

  /** Changes part of the language. Whatever is typed goes through sanitise(). */
  function edit(change: Record<string, unknown>) {
    language = sanitise({ ...toDraft(language), ...change });
  }
  const part = (key: 'places' | 'given' | 'surnames' | 'length') => toDraft(language)[key] as Record<string, unknown>;
  const editPlaces = (change: Record<string, unknown>) => edit({ places: { ...part('places'), ...change } });
  const editGiven = (change: Record<string, unknown>) => edit({ given: { ...part('given'), ...change } });
  const editLength = (kind: Kind, at: 0 | 1, value: string) => {
    const spans = part('length') as Record<Kind, number[]>;
    const span = [...spans[kind]];
    span[at] = cleanInt(value, 1, 6, span[at] ?? 2);
    if (at === 0 && span[1]! < span[0]!) span[1] = span[0]!;
    if (at === 1 && span[0]! > span[1]!) span[0] = span[1]!;
    edit({ length: { ...spans, [kind]: span } });
  };
  const editSurname = (which: 'patronymic' | 'place' | 'trade', change: Record<string, unknown>) => {
    const surnames = part('surnames') as Record<string, Record<string, unknown>>;
    edit({ surnames: { ...surnames, [which]: { ...surnames[which], ...change } } });
  };

  function choosePreset(id: string) {
    const chosen = presetById(id);
    if (!chosen) return;
    if (!preset) before = state;
    language = chosen.language;
    // A locked seed stays, so two presets can be heard on the same draws.
    if (!locked) draw = newDraw(chosen.seed);
    arrived(KINDS);
  }

  function goBack() {
    if (!before) return;
    language = before.language;
    draw = before.draw;
    before = null;
    arrived(KINDS);
    toast('Your own language is back.');
  }

  // Syllable shapes: the common ones as switches, and whatever else the language has.
  const COMMON_SHAPES = ['CV', 'CVC', 'V', 'VC', 'CCV', 'CVV', 'CCVC', 'CVCC'];
  const shapeChoices = $derived([...COMMON_SHAPES, ...language.shapes.map((s) => s.pattern).filter((p) => !COMMON_SHAPES.includes(p))]);
  const shapeOn = (pattern: string) => language.shapes.some((s) => s.pattern === pattern && s.weight > 0);
  function toggleShape(pattern: string) {
    const shapes = shapeOn(pattern) ? language.shapes.filter((s) => s.pattern !== pattern) : [...language.shapes.filter((s) => s.pattern !== pattern), { pattern, weight: 10 }];
    edit({ shapes });
  }

  // Place endings: each one a switch (off keeps it, at weight 0), and a box to add another.
  function toggleEnding(ending: Ending) {
    editPlaces({ endings: language.places.endings.map((e) => (e.text === ending.text ? { ...e, weight: e.weight > 0 ? 0 : 10 } : e)) });
  }
  function addEnding() {
    const count = language.places.endings.length;
    editPlaces({ endings: [...language.places.endings, ...sanitise({ places: { endings: newEnding } }).places.endings] });
    if (language.places.endings.length > count) newEnding = '';
    else toast(newEnding.trim() ? 'That ending is there already, or has no letters in it.' : 'Type an ending first, such as -holm.');
  }

  // ---- Picks: for this visit only -----------------------------------------------------------
  function togglePick(name: Name) {
    const key = pickKey(name);
    picked = pickedKeys.has(key) ? picked.filter((n) => pickKey(n) !== key) : [...picked, name];
  }

  async function copyPicks() {
    toast((await copyText(picksAsText(picked))) ? `${picked.length === 1 ? '1 name' : `${picked.length} names`} copied.` : "That didn't copy. Your browser may not allow it here.");
  }

  // ---- Files --------------------------------------------------------------------------------
  const slug = $derived(fileSlug(language.name, 'names'));

  async function loadLanguage(file: File | undefined) {
    if (!file) return;
    const loaded = languageFromJson(file.size > 200_000 ? ' '.repeat(100_001) : await file.text().catch(() => null));
    if (fileInput) fileInput.value = '';
    if (!loaded.ok) return toast(loaded.message);
    language = loaded.state.language;
    draw = loaded.state.draw;
    arrived(KINDS);
    toast(`${language.name || 'The language'} is loaded.`);
  }

  function profileLoaded(next: EurthProfile) {
    profile = next;
    nation = next.meta.nation;
    // Read our own section; never change anyone else's.
    const held = fromSection(getSection(next, 'names'));
    if (held) {
      language = held.language;
      draw = held.draw;
      arrived(KINDS);
      toast(`${next.meta.nation || 'Your nation'} is loaded, with its naming language.`);
    } else {
      toast(`${next.meta.nation || 'Your nation'} is loaded. It has no naming language yet: this one will be saved with it.`);
    }
  }

  // What "Save profile" writes: our section, and nothing else touched.
  const saved = $derived.by(() => {
    const name = nation.trim();
    if (!name && !profile) return null;
    const base = profile ? (name && name !== profile.meta.nation ? setNation(profile, name) : profile) : createProfile(name);
    return setSection(base, 'names', toSection(state, { previous: getSection(base, 'names'), picks: addPicks ? picksOf(picked) : null }));
  });

  const span = (kind: Kind, at: 'min' | 'max') => language.length[kind][at];
  const noteOf = (name: Name): string => (name.kind === 'given' ? (name.gender && name.gender !== 'either' ? name.gender : '') : howMade(name));
  const SURNAMES: { key: 'patronymic' | 'place' | 'trade'; label: string; help: string }[] = [
    { key: 'patronymic', label: "From a parent's name", help: 'For example -sen, mac- or o\'-' },
    { key: 'place', label: 'From a place', help: 'For example -er, or van_ for a word of its own' },
    { key: 'trade', label: 'From a trade', help: 'For example -ar or -er' },
  ];
  const patternOf = (key: 'patronymic' | 'place' | 'trade'): SurnamePattern => language.surnames[key];
</script>

<div class="generator">
  <form class="eu-card controls" aria-labelledby="language-title" onsubmit={(e) => e.preventDefault()}>
    <h2 id="language-title" class="eu-visually-hidden">The language</h2>
    <label class="eu-field">
      <span class="eu-label">Start from a preset</span>
      <select class="eu-select" value={preset?.id ?? ''} onchange={(e) => choosePreset(e.currentTarget.value)}>
        {#if !preset}<option value="">Your own language</option>{/if}
        {#each PRESETS as p (p.id)}
          <option value={p.id}>{p.language.name} ({p.feel})</option>
        {/each}
      </select>
    </label>
    {#if before && preset}
      <button type="button" class="eu-btn" data-click="spin" onclick={goBack}><Icon icon={faRotateLeft} /> Back to my own language</button>
    {/if}

    <ListField id="consonants" label="Consonants" value={formatSounds(language.consonants)} onchange={(text) => edit({ consonants: text })} help="Sounds as you spell them, with spaces between: th and sh are one sound each." />
    <ListField id="vowels" label="Vowels" value={formatSounds(language.vowels)} onchange={(text) => edit({ vowels: text })} help="t*20 makes a sound twice as common. ng^0 never starts a word; h$0 never ends one." />

    <fieldset class="options">
      <legend class="eu-label">Syllable shapes</legend>
      <div class="eu-row">
        {#each shapeChoices as pattern (pattern)}
          <label class="eu-pill eu-data">
            <input type="checkbox" checked={shapeOn(pattern)} onchange={() => toggleShape(pattern)} />
            <span class="eu-check"><Icon icon={faCheck} /></span>
            {pattern}
          </label>
        {/each}
      </div>
      <span class="eu-help">C is a consonant, V a vowel.</span>
    </fieldset>

    <fieldset class="options">
      <legend class="eu-label">Place endings</legend>
      <div class="eu-row">
        {#each language.places.endings as ending (ending.text)}
          <label class="eu-pill eu-data">
            <input type="checkbox" checked={ending.weight > 0} onchange={() => toggleEnding(ending)} />
            <span class="eu-check"><Icon icon={faCheck} /></span>
            -{ending.text}
          </label>
        {/each}
      </div>
      <div class="add">
        <label class="eu-field">
          <span class="eu-visually-hidden">A new place ending</span>
          <input
            class="eu-input eu-input--data"
            bind:value={newEnding}
            placeholder="-grad"
            maxlength="12"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            disabled={!room}
            onkeydown={(e) => {
              if (e.key === 'Enter') addEnding();
            }}
          />
        </label>
        <button type="button" class="eu-btn" data-click="pop" onclick={addEnding} disabled={!room}><Icon icon={faPlus} /> Add</button>
      </div>
    </fieldset>

    <div class="eu-row">
      <button type="button" class="eu-btn eu-btn--primary" data-click="tumble" onclick={generateAll}><Icon icon={faDice} /> Generate 24 names</button>
      <button type="button" class="eu-btn" aria-pressed={locked} onclick={() => (locked = !locked)}>
        <Icon icon={locked ? faLock : faLockOpen} />
        {locked ? 'Seed locked' : 'Lock seed'}
      </button>
    </div>
    <p class="eu-help">
      {locked ? `Seed ${draw.seed} stays: Generate moves all three columns on under it, and a preset is heard on the same draws.` : 'Each Generate picks a new seed. Lock it to keep the one you have.'}
    </p>

    {#if notes.length > 0}
      <ul class="notes" aria-label="About this language">
        {#each notes as note (note.id)}
          <li class={note.level === 'problem' ? 'eu-error' : 'eu-help'}>
            <Icon icon={note.level === 'problem' ? faTriangleExclamation : faCircleInfo} />
            <span><strong>{note.level === 'problem' ? 'To fix:' : 'Note:'}</strong> {note.message}</span>
          </li>
        {/each}
      </ul>
    {/if}
    {#if !room}
      <p class="eu-help"><Icon icon={faCircleInfo} /> This language is as big as a link can carry. Take something out before adding more.</p>
    {/if}

    <details class="more">
      <summary class="eu-label">The language's name and seed</summary>
      <div class="eu-stack">
        <label class="eu-field">
          <span class="eu-label">Name of the language</span>
          <input class="eu-input" value={language.name} maxlength="40" autocomplete="off" oninput={(e) => edit({ name: e.currentTarget.value })} />
        </label>
        <label class="eu-field">
          <span class="eu-label">Seed</span>
          <input class="eu-input eu-input--data" value={draw.seed} inputmode="numeric" maxlength="10" autocomplete="off" aria-describedby="seed-help" onchange={(e) => setSeed(e.currentTarget.value)} />
          <span class="eu-help" id="seed-help">The same language and seed always give the same names.</span>
        </label>
      </div>
    </details>

    <details class="more">
      <summary class="eu-label">More about the sounds</summary>
      <div class="eu-stack">
        <ListField id="banned" label="Banned clusters" value={formatBanned(language.banned)} onchange={(text) => edit({ banned: text })} help="Runs of letters that never appear in a name, such as kt or sr." placeholder="kt sr" />
        <ListField id="shapes" label="Shapes, with weights" value={formatShapes(language.shapes)} onchange={(text) => edit({ shapes: text })} help="CV*60 CVC*30 makes CV twice as common as CVC." />
        <label class="eu-pill switch">
          <input type="checkbox" checked={language.vowelsMeet} onchange={(e) => edit({ vowelsMeet: e.currentTarget.checked })} />
          <span class="eu-check"><Icon icon={faCheck} /></span>
          Vowels may meet between syllables
        </label>
        <fieldset class="options">
          <legend class="eu-label">Syllables in a stem</legend>
          {#each KINDS as kind (kind)}
            <div class="lengths">
              <span>{KIND_TITLES[kind]}</span>
              <label class="eu-field"><span class="eu-help">Fewest</span>
                <select class="eu-select" value={String(span(kind, 'min'))} onchange={(e) => editLength(kind, 0, e.currentTarget.value)}>
                  {#each [1, 2, 3, 4, 5, 6] as n (n)}<option value={String(n)}>{n}</option>{/each}
                </select>
              </label>
              <label class="eu-field"><span class="eu-help">Most</span>
                <select class="eu-select" value={String(span(kind, 'max'))} onchange={(e) => editLength(kind, 1, e.currentTarget.value)}>
                  {#each [1, 2, 3, 4, 5, 6] as n (n)}<option value={String(n)}>{n}</option>{/each}
                </select>
              </label>
            </div>
          {/each}
        </fieldset>
      </div>
    </details>

    <details class="more">
      <summary class="eu-label">More about places and people</summary>
      <div class="eu-stack">
        <ListField id="place-endings" label="Place endings, with weights" value={formatEndings(language.places.endings)} onchange={(text) => editPlaces({ endings: text })} help="vin*20 holm makes -vin twice as common as -holm." />
        <label class="eu-field">
          <span class="eu-label">Places with no ending: <output class="eu-data">{language.places.bare}</output> in 100</span>
          <input class="eu-range" type="range" min="0" max="100" step="5" value={language.places.bare} style:--fill="{language.places.bare}%" oninput={(e) => editPlaces({ bare: e.currentTarget.value })} />
        </label>
        <label class="eu-pill switch">
          <input type="checkbox" checked={language.given.gendered} onchange={(e) => editGiven({ gendered: e.currentTarget.checked })} />
          <span class="eu-check"><Icon icon={faCheck} /></span>
          Given names come in feminine and masculine forms
        </label>
        {#if language.given.gendered}
          <ListField id="feminine" label="Feminine endings" value={formatEndings(language.given.feminine)} onchange={(text) => editGiven({ feminine: text })} placeholder="a ia" />
          <ListField id="masculine" label="Masculine endings" value={formatEndings(language.given.masculine)} onchange={(text) => editGiven({ masculine: text })} placeholder="o ir" />
        {/if}
        <ListField id="either" label={language.given.gendered ? 'Endings for either' : 'Given-name endings'} value={formatEndings(language.given.either)} onchange={(text) => editGiven({ either: text })} placeholder="in" />
        <label class="eu-field">
          <span class="eu-label">{language.given.gendered ? 'Names for either with no ending' : 'Given names with no ending'}: <output class="eu-data">{language.given.bare}</output> in 100</span>
          <input class="eu-range" type="range" min="0" max="100" step="5" value={language.given.bare} style:--fill="{language.given.bare}%" oninput={(e) => editGiven({ bare: e.currentTarget.value })} />
        </label>
      </div>
    </details>

    <details class="more">
      <summary class="eu-label">More about surnames</summary>
      <div class="eu-stack">
        <p class="eu-help">Write -sen for an ending, mac- for a beginning, and van_ for a word of its own. With none switched on, surnames are plain words of the language.</p>
        {#each SURNAMES as s (s.key)}
          <div class="eu-stack surname">
            <label class="eu-pill switch">
              <input type="checkbox" checked={patternOf(s.key).on} onchange={(e) => editSurname(s.key, { on: e.currentTarget.checked })} />
              <span class="eu-check"><Icon icon={faCheck} /></span>
              {s.label}
            </label>
            {#if patternOf(s.key).on}
              <ListField id="surname-{s.key}" label="Its affixes" value={formatAffixes(patternOf(s.key).affixes)} onchange={(text) => editSurname(s.key, { affixes: text })} help={s.help} />
              <label class="eu-field">
                <span class="eu-label">How common: <output class="eu-data">{patternOf(s.key).weight}</output></span>
                <input class="eu-range" type="range" min="1" max="30" value={Math.min(30, patternOf(s.key).weight)} style:--fill="{(Math.min(30, patternOf(s.key).weight) / 30) * 100}%" oninput={(e) => editSurname(s.key, { weight: e.currentTarget.value })} />
              </label>
            {/if}
          </div>
        {/each}
      </div>
    </details>
  </form>

  <section class="eu-card results" aria-labelledby="results-title">
    <div class="top">
      <h2 id="results-title" class="eu-kicker">{language.name || 'Your language'} · {names.length} {names.length === 1 ? 'result' : 'results'}</h2>
      <span class="eu-data eu-muted">seed {draw.seed}</span>
    </div>
    <p class="eu-visually-hidden" aria-live="polite">{announcement}</p>

    <div class="columns">
      {#each KINDS as kind (kind)}
        <div class="column">
          <div class="column-top">
            <h3 class="eu-kicker">{KIND_TITLES[kind]}</h3>
            <button type="button" class="eu-btn eu-btn--quiet eu-btn--icon" data-click="spin" aria-label="Re-roll {KIND_TITLES[kind].toLowerCase()}" data-tip="Re-roll {KIND_TITLES[kind].toLowerCase()}" onclick={() => rerollColumn(kind)}>
              <Icon icon={faArrowsRotate} />
            </button>
          </div>
          {#if batch[kind].names.length === 0}
            <p class="eu-help">No {KIND_TITLES[kind].toLowerCase()} yet: see what's noted about the language.</p>
          {:else}
            <ul class="names">
              {#each batch[kind].names as name, row (name.text)}
                {@const letters = Array.from(name.text)}
                {@const count = typed(kind, row, letters.length)}
                {@const isPicked = pickedKeys.has(pickKey(name))}
                <li>
                  <span class="name">
                    <span class="spelled">{letters.slice(0, count).join('')}<span class="untyped">{letters.slice(count).join('')}</span></span>
                    {#if isPlanetName(name.text)}<span class="planet"><Icon icon={faStar} label={PLANET_TOAST} /></span>{/if}
                    {#if noteOf(name)}<span class="eu-help">{noteOf(name)}</span>{/if}
                  </span>
                  <button type="button" class="eu-btn eu-btn--quiet eu-btn--icon star" data-click="pop" aria-pressed={isPicked} aria-label="{isPicked ? 'Unpick' : 'Pick'} {name.text}" onclick={() => togglePick(name)}>
                    <Icon icon={faStar} />
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    </div>

    <div class="picked">
      <h3 class="eu-label">Picked this visit · {picked.length}</h3>
      {#if picked.length === 0}
        <p class="eu-help">Press the star beside a name to keep it here while you look for more. Picks last for this visit only: nothing is stored.</p>
      {:else}
        <p class="picks">{picked.map((n) => n.text).join(' · ')}</p>
        <div class="eu-row">
          <button type="button" class="eu-btn" data-click="bounce" onclick={copyPicks}>Copy list</button>
          <button type="button" class="eu-btn" data-click="spin" onclick={() => (picked = [])}>Clear</button>
        </div>
      {/if}
    </div>

    <ShareButtons
      url={link}
      {title}
      text={`${describeLanguage(language).split('. ')[0]}. Made with ${siteName}.`}
      description={() => describeBatch(language, draw, batch)}
      heading={language.name ? `Share ${language.name}` : 'Share this language'}
      said={{ link: 'Link copied: the whole language is in it.', description: 'Description copied: the language and its 24 names.' }}
    />

    <div class="eu-row">
      <button type="button" class="eu-btn" data-click="bounce" disabled={names.length === 0} onclick={() => download(namesAsText(language, draw, names), `${slug}-${draw.seed}.txt`, 'text/plain')}><Icon icon={faDownload} /> List as text</button>
      <button type="button" class="eu-btn" data-click="bounce" disabled={names.length === 0} onclick={() => download(namesAsCsv(names, pickedKeys), `${slug}-${draw.seed}.csv`, 'text/csv')}><Icon icon={faDownload} /> List as CSV</button>
      <button type="button" class="eu-btn" data-click="bounce" onclick={() => download(languageAsJson(state), languageFileName(language), 'application/json')}><Icon icon={faDownload} /> Language as JSON</button>
      <button type="button" class="eu-btn" data-click="bounce" onclick={() => fileInput?.click()}><Icon icon={faFolderOpen} /> Load language</button>
      <input bind:this={fileInput} class="eu-visually-hidden" type="file" accept=".json,application/json" tabindex="-1" aria-hidden="true" onchange={(e) => loadLanguage(e.currentTarget.files?.[0])} />
    </div>

    <div class="profile">
      <label class="eu-field">
        <span class="eu-label">Your nation</span>
        <input class="eu-input" bind:value={nation} maxlength="80" autocomplete="off" placeholder="Name it to save a profile" aria-describedby="nation-help" />
      </label>
      <div class="eu-row">
        <ProfileButtons profile={saved} onload={profileLoaded} onerror={(errors) => toast(errors[0]?.message ?? "That file isn't a nation profile. Pick one that ends in .eurth.json.")} />
        <label class="eu-pill switch">
          <input type="checkbox" bind:checked={addPicks} />
          <span class="eu-check"><Icon icon={faCheck} /></span>
          Add my picked names
        </label>
      </div>
      <p class="eu-help" id="nation-help">
        The link holds the whole language. The profile file carries it, and the names you picked if you tick the box, from one Eurth tool to the next. Nothing is kept in this browser.
      </p>
    </div>
  </section>
</div>

<style>
  .generator {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    gap: var(--space-6);
    align-items: start;
  }

  .controls,
  .results {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .add {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-2);
    align-items: end;
  }

  .switch {
    justify-content: flex-start;
    align-self: flex-start;
    min-height: var(--size-target);
    height: auto;
    padding-block: var(--space-2);
    text-align: start;
  }

  .notes {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .notes li {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
  }

  .more {
    border-top: 1px solid var(--line-strong);
  }

  .more > summary {
    display: flex;
    align-items: center;
    min-height: var(--size-target);
    cursor: pointer;
  }

  .more > summary::before {
    content: '+';
    width: var(--space-5);
    font: var(--type-data);
  }

  .more[open] > summary::before {
    content: '−';
  }

  .more > summary::-webkit-details-marker {
    display: none;
  }

  .more > .eu-stack {
    padding-bottom: var(--space-4);
  }

  .surname + .surname {
    padding-top: var(--space-4);
    border-top: 1px solid var(--line);
  }

  .lengths {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-2);
    align-items: end;
  }

  .top,
  .column-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .top h2,
  .column-top h3 {
    margin: 0;
  }

  .columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
  }

  .column {
    min-width: 0;
  }

  .names {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .names li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-height: var(--size-target);
    border-top: 1px solid var(--line);
  }

  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: var(--space-1) 0;
  }

  .spelled {
    font: var(--type-lead);
    overflow-wrap: anywhere;
  }

  /* Letters still to be typed keep their room, so nothing jumps as the name arrives. */
  .untyped {
    opacity: 0;
  }

  .planet {
    display: inline-flex;
    width: var(--space-4);
    color: var(--highlight);
  }

  .planet :global(path) {
    stroke: var(--ink);
    stroke-width: 24px;
  }

  /* The star: an outline until picked, filled when picked. Shape and words carry it, not colour:
     the label reads "Pick" or "Unpick". */
  .star,
  .star[aria-pressed='true'] {
    flex: none;
    border-color: transparent;
    background: transparent;
    color: var(--ink);
  }

  .star :global(path) {
    fill: transparent;
    stroke: currentColor;
    stroke-width: 40px;
  }

  .star[aria-pressed='true'] :global(path) {
    fill: var(--highlight);
  }

  .star:hover {
    border-color: var(--ink);
    background: var(--hover);
  }

  .picked,
  .profile {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 1px solid var(--line-strong);
  }

  .picked h3,
  .picks {
    margin: 0;
  }

  .picks {
    overflow-wrap: anywhere;
  }

  @media (max-width: 900px) {
    .generator {
      grid-template-columns: minmax(0, 1fr);
    }

    /* On a phone the names come first: they are what the visitor came for. */
    .results {
      order: -1;
    }
  }

  @media (max-width: 560px) {
    .columns {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
