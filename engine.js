(function (root) {
  'use strict';

  const badges = {
    lively: { name: 'Vibrancy', icon: '🎉' }, green: { name: 'Green', icon: '🌿' },
    tidy: { name: 'Tidiness', icon: '✨' }, standard: { name: 'Compliance', icon: '📜' }
  };
  const cards = [
    { id: 'club', name: 'Community Club', icon: '🏛️', kind: 'facility', needs: ['🤝'], stars: { lively: 1 }, description: 'A place for activities, neighbours and everyday gatherings downstairs.' },
    { id: 'smart', name: 'Smart Community Hub', icon: '📱', kind: 'facility', needs: ['🤝'], stars: { tidy: 1, standard: 1 }, description: 'Book activities and manage community services through one system.' },
    { id: 'hawker', name: 'Hawker Centre', icon: '🍜', kind: 'facility', needs: ['🍜'], stars: { lively: 1 }, description: 'Bring the aroma of food and daily life back downstairs.' },
    { id: 'walkway', name: 'Covered Walkway', icon: '🛤️', kind: 'facility', needs: ['🚌'], stars: { lively: 1 }, description: 'A sheltered route through rain and shine.' },
    { id: 'bus', name: 'Bus Stop', icon: '🚌', kind: 'facility', needs: ['🚌'], stars: { lively: 1 }, description: 'Connect the town to the wider city.' },
    { id: 'roof', name: 'Rooftop Garden', icon: '🌱', kind: 'facility', needs: [], stars: { green: 1 }, description: 'Make room for plants on the rooftop.' },
    { id: 'solar', name: 'Solar Panels', icon: '☀️', kind: 'facility', needs: [], stars: { green: 1 }, description: 'Power the community with sunlight.' },
    { id: 'rain', name: 'Rain Garden', icon: '💧', kind: 'facility', needs: [], stars: { green: 1 }, description: 'Collect rainwater and add green space.' },
    { id: 'childcare', name: 'Childcare Centre', icon: '🧸', kind: 'facility', needs: ['🧒'], stars: { standard: 1 }, description: 'Provide childcare places for young families.' },
    { id: 'daycare', name: 'Day Centre', icon: '🫖', kind: 'facility', needs: ['🪑', '🤝'], stars: { standard: 1 }, description: 'Day care and activities available after registration.' },
    { id: 'feedback', name: 'Feedback Kiosk', icon: '📮', kind: 'facility', needs: [], stars: { standard: 1 }, description: 'Send online feedback into the community management system.' },
    { id: 'cleanup', name: 'Clean-up Drive', icon: '🧹', kind: 'policy', needs: [], stars: { tidy: 1 }, repeatable: true, description: 'Clear clutter and standardise the layout of shared spaces.' },
    { id: 'rest', name: 'Rest Shelter', icon: '🪑', kind: 'facility', needs: ['🪑'], stars: {}, unlockResident: 'kumar', description: 'A shady place to sit and rest.' },
    { id: 'canteen', name: 'Affordable Canteen', icon: '🍜', kind: 'facility', needs: ['🍜'], stars: {}, unlockResident: 'mei', description: 'A place where everyone can afford a meal together.' },
    { id: 'blank', name: 'Open Space', icon: '🌤️', kind: 'facility', needs: ['🪑', '🤝', '🎊'], stars: {}, unlockResident: 'aisyah', description: 'Leave a plot for the everyday life that has yet to be planned.' },
    { id: 'register', name: 'Registration Visits', icon: '🗂️', kind: 'policy', needs: [], stars: {}, unlockResident: 'chen', description: 'Community workers visit homes to help with registration.' },
    { id: 'flexible', name: 'Flexible Quota', icon: '⚖️', kind: 'policy', needs: [], stars: { standard: -1 }, unlockLetter: 'L04', description: 'Request flexibility so a household facing restrictions can move on.' }
  ];
  const residents = [
    { id: 'chen', name: 'Mdm Chen', short: 'Mdm Chen', subtitle: 'Older resident · Lives alone', icon: '👵', needs: ['🪑', '🤝'], photo: 'The Chess Corner', scene: 'chess', barriers: ['📱', '📝'], quote: 'People used to set up chess tables downstairs. Activities now need a booking on a phone. I do not know how to use it, or that I need to register first.' },
    { id: 'lin', name: 'The Lin Family', short: 'Lin Family', subtitle: 'Young family · Parents and child', icon: '👨‍👩‍👧', needs: ['🧒', '🚌'], photo: 'Weekend Skateboarding', scene: 'skate', barriers: [], quote: 'We can use all the facilities. We need someone to care for our child and transport to work. The paths downstairs need to be easy to get around, too.' },
    { id: 'aisyah', name: 'Aisyah’s Family', short: 'Aisyah', subtitle: 'Ethnic minority residents · Family', icon: '🏮', needs: ['🎊', '🍜'], photo: 'The Hari Raya Table', scene: 'feast', barriers: ['🍲', '💲'], quote: 'A lively place does not always have food we can eat. During festivals, we used to put a long table downstairs. Is there still room for it now?' },
    { id: 'mei', name: 'Mei’s Family', short: 'Mei', subtitle: 'New citizens · Recently moved in', icon: '🧳', needs: ['🍜', '🤝'], photo: 'The First Knock Next Door', scene: 'door', barriers: ['🗣', '💲'], quote: 'I still find it hard to understand the language used for club activities. I hope there is somewhere we can afford to eat, and a neighbour willing to knock and say hello.' },
    { id: 'kumar', name: 'Kumar & Friends', short: 'Kumar', subtitle: 'Migrant workers · Non-resident users', icon: '👷', needs: ['🪑', '🍜'], photo: 'Shade at Lunchtime', scene: 'shade', barriers: ['🚫', '💲', '📝'], quote: 'We clean and maintain this place every day, but have nowhere to sit at lunchtime. Some places are for residents only; others are too expensive.' }
  ];
  const barrierNames = { '📱': 'Phone booking required', '📝': 'Registration required', '💲': 'Too expensive', '🗣': 'Activity language barrier', '🚫': 'Residents only', '🍲': 'No halal options' };
  const cardById = Object.fromEntries(cards.map(c => [c.id, c]));
  const residentById = Object.fromEntries(residents.map(r => [r.id, r]));
  const fadeOrder = ['kumar', 'aisyah', 'mei', 'chen'];
  const titles = ['A New Town', 'Young Families Move In', 'Quota Review', 'Finding a Rhythm', 'New Requirements', 'Growing Traffic', 'An Ageing Community', 'Talk of Redevelopment', 'The Last Everyday Moments', 'The Lease Nears Its End'];

  function totalStars(s) { return Object.values(s.stars).reduce((a, b) => a + b, 0); }
  function changeStars(s, values) {
    Object.keys(badges).forEach(k => { s.stars[k] = Math.max(0, Math.min(3, s.stars[k] + (values[k] || 0))); });
    const total = totalStars(s);
    s.unlocked = Math.max(s.unlocked, 4 + [3, 6, 9].filter(n => total >= n).length);
  }
  function plotFor(s, id) { return s.plots.findIndex(p => p && p.cardId === id); }
  function has(s, id) { return plotFor(s, id) >= 0; }
  function emptyPlot(s) { return s.plots.findIndex((p, i) => i < s.unlocked && !p); }
  function entry(s, type, message, extra) { s.log.push(Object.assign({ round: s.round, type, message }, extra || {})); }
  function fail(message) { return { ok: false, message }; }
  function guard(s) {
    if (s.ended) return fail('This lease has ended. You can start a new game.');
    if (s.letters.length) return fail('Reply to this round’s community letters first. Replies use no actions.');
    if (s.actions < 1) return fail('Both actions are complete. Advance to the next decade.');
    return null;
  }
  function fade(s, id) {
    const target = id || fadeOrder.find(r => !s.photos[r].faded);
    if (!target) return null;
    s.photos[target].faded = true;
    return target;
  }
  function restore(s) {
    const target = fadeOrder.find(r => s.photos[r].faded);
    if (target) s.photos[target].faded = false;
    return target || null;
  }
  function reveal(s, residentId, automatic) {
    const r = residentById[residentId];
    const wasSeen = s.visited[residentId];
    s.visited[residentId] = true;
    s.photos[residentId].known = true;
    const unlocked = cards.filter(c => c.unlockResident === residentId && !s.unlockedCards.includes(c.id)).map(c => c.id);
    s.unlockedCards.push(...unlocked);
    if (automatic) entry(s, 'autoVisit', 'A community worker shared an update about ' + r.name + '.', { residentId, unlocked });
    return { residentId, quote: r.quote, photo: r.photo, unlocked, firstVisit: !wasSeen, automatic: !!automatic };
  }
  function hiddenAccess(s, cardId, residentId) {
    const c = cardById[cardId], r = residentById[residentId];
    if (!c || !r) return { ok: false, reason: 'Unknown facility or resident.', barriers: [] };
    let barriers = [];
    if (cardId === 'club') barriers = residentId === 'chen' ? ['📱'] : residentId === 'mei' ? ['🗣'] : [];
    if (cardId === 'smart') barriers = residentId === 'chen' && !s.flags.humanWindow ? ['📱'] : residentId === 'kumar' ? ['🚫'] : [];
    if (cardId === 'hawker') {
      if (residentId === 'aisyah') barriers.push('🍲');
      if (s.flags.rent && ['aisyah', 'mei', 'kumar'].includes(residentId)) barriers.push('💲');
    }
    if (['childcare', 'daycare'].includes(cardId) && (residentId === 'kumar' || (residentId === 'chen' && !s.flags.registration))) barriers.push('📝');
    if (cardId === 'feedback' && residentId === 'chen') barriers.push('📱');
    return { ok: !barriers.length, barriers, reason: barriers.map(b => b + ' ' + barrierNames[b]).join('; ') || 'Can use this facility' };
  }
  function access(s, cardId, residentId) {
    if (!s.visited[residentId]) return { ok: null, unknown: true, reason: 'Not yet visited', barriers: [] };
    return Object.assign({ unknown: false }, hiddenAccess(s, cardId, residentId));
  }
  function actualStatus(s, residentId) {
    const r = residentById[residentId];
    if (!r) return { met: [], missing: [], face: '？', reason: 'Unknown resident' };
    const provided = new Set();
    s.plots.forEach(p => {
      if (!p || !cardById[p.cardId] || !hiddenAccess(s, p.cardId, residentId).ok) return;
      cardById[p.cardId].needs.forEach(n => provided.add(n));
    });
    if (s.flags.selfCook && ['mei', 'kumar'].includes(residentId)) provided.add('🍜');
    const met = r.needs.filter(n => provided.has(n)), missing = r.needs.filter(n => !provided.has(n));
    const forcedSad = (residentId === 'aisyah' && s.flags.trapped) || (residentId === 'kumar' && s.flags.heatDeferred && !has(s, 'rest') && !has(s, 'blank'));
    return { met, missing, face: forcedSad ? '😟' : met.length === r.needs.length ? '🙂' : met.length ? '😐' : '😟', forcedSad: !!forcedSad,
      reason: residentId === 'aisyah' && s.flags.trapped ? 'The tighter quota still prevents the family from selling their flat.' : residentId === 'kumar' && forcedSad ? 'There is still nowhere to rest in the afternoon heat.' : missing.length ? 'Still needed: ' + missing.join(' ') : 'Both needs are met.' };
  }
  function residentStatus(s, residentId) {
    if (!s.visited[residentId]) return { met: [], missing: [], face: '？', unknown: true, reason: 'Visit to find out whether the facilities work for them.' };
    return Object.assign({ unknown: false }, actualStatus(s, residentId));
  }
  function availableCards(s) {
    return cards.filter(c => !c.unlockResident && !c.unlockLetter || s.unlockedCards.includes(c.id)).map(c => Object.assign({}, c, {
      used: !!s.usedCards[c.id], locked: false,
      disabled: !!s.usedCards[c.id] && !c.repeatable || (c.id === 'flexible' && !s.flags.trapped)
    }));
  }
  function canUse(s, id, kind) {
    const c = cardById[id];
    if (!c || c.kind !== kind) return fail('Choose a ' + (kind === 'facility' ? 'facility card.' : 'policy card.'));
    if ((c.unlockResident || c.unlockLetter) && !s.unlockedCards.includes(id)) return fail('This card is still locked. Visit a resident or read the relevant letter first.');
    if (s.usedCards[id] && !c.repeatable) return fail('This card has already been used. Facilities cannot be built twice or freely removed.');
    if (id === 'flexible' && !s.flags.trapped) return fail('No household is currently held back by the quota.');
    return null;
  }
  function place(s, id, index, free, replace) {
    const c = cardById[id];
    s.plots[index] = { cardId: id, builtRound: s.round };
    s.usedCards[id] = true;
    changeStars(s, c ? c.stars : {});
    const faded = id === 'smart' ? fade(s, 'chen') : null;
    const recovered = id === 'blank' ? restore(s) : null;
    entry(s, 'build', (replace ? 'Open Space converted to ' : 'Built ') + (c ? c.name : id === 'soundproof' ? 'Noise Barriers' : 'Energy Retrofit') + '.', { cardId: id, plotIndex: index, free: !!free, replace: !!replace, faded, recovered });
    return { faded, recovered };
  }
  function build(s, cardId, plotIndex) {
    const blocked = guard(s) || canUse(s, cardId, 'facility');
    if (blocked) return blocked;
    const index = plotIndex == null ? emptyPlot(s) : Number(plotIndex);
    if (!Number.isInteger(index) || index < 0 || index >= s.unlocked || s.plots[index]) return fail('Choose an unlocked, empty plot.');
    const result = place(s, cardId, index, false, false);
    s.actions -= 1;
    return Object.assign({ ok: true, message: cardById[cardId].name + ' is ready.', plotIndex: index }, result);
  }
  function applyPolicy(s, cardId) {
    const c = cardById[cardId];
    s.usedCards[cardId] = true;
    changeStars(s, c.stars);
    const faded = cardId === 'cleanup' ? fade(s) : null;
    if (cardId === 'register') s.flags.registration = true;
    if (cardId === 'flexible') s.flags.trapped = false;
    return faded;
  }
  function enact(s, cardId) {
    const blocked = guard(s) || canUse(s, cardId, 'policy');
    if (blocked) return blocked;
    const faded = applyPolicy(s, cardId);
    s.actions -= 1;
    entry(s, 'policy', 'Enacted ' + cardById[cardId].name + '.', { cardId, faded });
    return { ok: true, message: cardById[cardId].name + ' is now in effect.', faded };
  }
  function visit(s, residentId) {
    const blocked = guard(s);
    if (blocked) return blocked;
    if (!residentById[residentId]) return fail('This resident could not be found.');
    const result = reveal(s, residentId, false);
    s.actions -= 1;
    entry(s, 'visit', 'Visited ' + residentById[residentId].name + '.', { residentId, firstVisit: result.firstVisit, unlocked: result.unlocked });
    return Object.assign({ ok: true, message: 'You spent time with ' + residentById[residentId].name + '.', status: actualStatus(s, residentId) }, result);
  }

  function opt(id, label, extra) { return Object.assign({ id, label }, extra || {}); }
  function spaceOption(s, id, label) { return opt(id, label, { disabled: emptyPlot(s) < 0, hint: emptyPlot(s) < 0 ? 'Requires an unlocked, empty plot' : 'Uses one plot · No action needed' }); }
  function letter(s, code) {
    const number = s.letterHistory.filter(l => l.code === code).length + 1;
    const urgent = code === 'L02' && number > 1;
    const definitions = {
      L01: ['The Authorities', 'A New Town', 'A new HDB town is now in your hands. Vibrancy, Green, Tidiness and Compliance will be recorded on four achievement badges. The next ninety-nine years will also be recorded in the lives of everyone downstairs.', [opt('A', 'Understood. Start building')]],
      L02: ['The Lin Family', urgent ? 'Childcare Waiting List: Another Decade' : 'The Childcare Wait Is Too Long', urgent ? 'Our child has waited a long time, and more families are joining the queue. There is still no childcare centre. Can it go into this decade’s plan?' : 'We both work, and the childcare waiting list is too long. Could we have a childcare centre downstairs?', [spaceOption(s, 'A', 'Approve a Childcare Centre now'), opt('B', 'Monitor the situation for now')]],
      L03: ['The Authorities', 'Ethnic Quota Review', 'This review recommends tighter ethnic quota controls, applied consistently under the rules. How will you respond?', [opt('A', 'Tighten quota controls'), opt('B', 'Keep the current arrangements')]],
      L04: [s.visited.aisyah ? 'Aisyah’s Family' : 'Residents’ Committee, on their behalf', 'Our Flat Has Been Listed for Six Months', 'Since the quota was tightened, this family has been unable to sell their flat. Changes in their lives are on hold too. Could they apply for a flexible arrangement?', [opt('A', 'Apply for flexibility'), opt('B', 'Maintain the current quota')]],
      L05: ['Community Worker', 'She Cannot Use the Booking System', 'Mdm Chen says she cannot use the Smart Community Hub’s booking system. I have brought her story and an old photo of the chess corner. The photo has already faded.', [opt('A', 'Add an assisted booking counter'), opt('B', 'Keep promoting online booking')]],
      L06: ['Hawker', 'Hawker Centre Rents', 'The Hawker Centre is getting livelier, and stall rents are due to rise. Several affordable stalls hope they can stay.', [opt('A', 'Allow stall rents to rise'), opt('B', 'Retain affordable stalls')]],
      L07: ['Residents', 'Complaints About Meals Downstairs', 'After prices rose at the Hawker Centre, some people began setting up tables and cooking downstairs. Some find it convenient; others complain about the clutter. How will you arrange this shared space?', [opt('A', 'Clear and tidy the space'), opt('B', 'Set aside a corner for cooking')]],
      L08: ['The Lin Family', 'Too Much Clutter Downstairs', 'Our child fell off a bicycle after hitting clutter downstairs. Shared spaces need clear paths, and some neighbours also want to keep using them together.', [opt('A', 'Run a Clean-up Drive'), opt('B', 'Mark out areas and keep shared uses'), opt('C', 'Leave it for now')]],
      L09: ['The Authorities', 'A Lower Carbon Emissions Target', 'The new carbon emissions target requires energy-saving upgrades across the community. A full retrofit needs a plot of its own.', [spaceOption(s, 'A', 'Carry out a full Energy Retrofit'), opt('B', 'Run a demonstration project only'), opt('C', 'Continue with the original plan')]],
      L10: ['Cleaning Team', 'Greenery Needs More Hands', 'The Rooftop Garden, Solar Panels and Rain Garden are complete, and maintenance work has grown. The cleaning team is asking for more staff and would like you to hear about the workers’ daily lives.', [opt('A', 'Approve and hear from the workers'), opt('B', 'Keep staffing at the current level')]],
      L11: ['Cleaning Team', 'The Afternoon Heat', 'When the sun is at its strongest, the cleaning and maintenance workers have to stand and wait. There is no shelter to rest in downstairs, or shade set aside for people.', (s.unlockedCards.includes('rest') && !s.usedCards.rest ? [spaceOption(s, 'A', 'Build a shaded Rest Shelter')] : []).concat([opt('B', 'Note it for later')])],
      L12: ['Residents', '“Gatherings” at the Rest Shelter', 'Some residents say workers often gather at the Rest Shelter and want it removed. Others point out that it is their only place to sit during lunch breaks.', [opt('A', 'Keep it and explain to residents'), opt('B', 'Remove the Rest Shelter')]],
      L13: ['Lower-Floor Residents', 'Traffic and Night-Time Noise', 'The Bus Stop has made travelling easier, but traffic and night-time noise are so loud that we rarely open our windows now.', [opt('A', 'Reduce bus frequency'), spaceOption(s, 'B', 'Use a plot for Noise Barriers'), opt('C', 'Continue to prioritise commuting')]],
      L14: ['The Authorities', 'Why Is It Still Empty?', 'The Open Space has remained unbuilt for three decades. Please explain its use or allocate a facility to it.', [opt('A', 'Explain its shared use and keep it open')].concat(availableCards(s).filter(c => c.kind === 'facility' && !c.disabled && c.id !== 'blank').map(c => opt('replace:' + c.id, 'Convert to ' + c.name, { hint: 'Replaces Open Space · No action needed' })), [opt('C', 'Do not respond yet')])],
      L15: ['The Authorities', 'Ageing-in-Place Pilot', 'The community may apply for a place in an ageing-in-place pilot. If a plot is available, the authorities will support the construction of a Day Centre.', [Object.assign(spaceOption(s, 'A', 'Apply for a Day Centre'), { disabled: emptyPlot(s) < 0 || !!s.usedCards.daycare, hint: s.usedCards.daycare ? 'The community already has a Day Centre' : emptyPlot(s) < 0 ? 'Requires an empty plot' : 'Place a Day Centre for free' }), opt('B', 'Do not apply')]],
      L16: ['Residents', 'We Hear This Place Will Be Redeveloped', 'People downstairs say redevelopment is coming soon. Do you remember what it looked like when you first moved in? Everyone has begun looking through old photographs.', [opt('A', 'Understood. Carry on with everyday life')]],
      L17: ['The Authorities', 'The Lease Nears Its End', 'The ninety-nine-year lease is nearing its end, and a redevelopment notice has been issued. This is the final round. After your last two actions, look back at what the town has kept.', [opt('A', 'Understood. Walk through the final decade')]]
    };
    const d = definitions[code];
    return { id: code + '-' + s.round + '-' + number, code, from: d[0], title: d[1], text: d[2], options: d[3], round: s.round, occurrence: number };
  }
  function collectLetters(s) {
    const candidates = [];
    const seen = code => !!s.eventSeen[code];
    const add = (code, condition) => { if (condition && !s.pendingLetters.includes(code)) candidates.push(code); };
    const fixed = { 1: 'L01', 3: 'L03', 5: 'L09', 7: 'L15', 8: 'L16', 10: 'L17' }[s.round];
    if (fixed && !seen(fixed)) candidates.push(fixed);
    add('L02', s.round >= 2 && !has(s, 'childcare') && (!seen('L02') || s.repeatLetters.L02));
    add('L04', s.flags.trapped && s.round > s.flags.quotaRound && !seen('L04'));
    add('L05', has(s, 'smart') && s.round > s.plots[plotFor(s, 'smart')].builtRound && !s.visited.chen && !seen('L05'));
    add('L06', s.stars.lively >= 2 && has(s, 'hawker') && !seen('L06'));
    add('L07', s.flags.rent && !has(s, 'canteen') && !seen('L07'));
    add('L08', s.round >= 2 && (s.round === 4 || s.stars.tidy <= 1 || s.repeatLetters.L08) && (!seen('L08') || s.repeatLetters.L08));
    add('L10', ['roof', 'solar', 'rain'].filter(id => has(s, id)).length >= 3 && !seen('L10'));
    add('L11', s.round >= 5 && !has(s, 'rest') && !has(s, 'blank') && !seen('L11'));
    add('L12', has(s, 'rest') && s.round > s.plots[plotFor(s, 'rest')].builtRound && !seen('L12'));
    add('L13', has(s, 'bus') && s.round >= s.plots[plotFor(s, 'bus')].builtRound + 2 && (!seen('L13') || s.repeatLetters.L13));
    add('L14', has(s, 'blank') && s.round >= s.plots[plotFor(s, 'blank')].builtRound + 3 && (!seen('L14') || s.repeatLetters.L14));
    const queue = (fixed ? [fixed] : []).concat(s.pendingLetters, candidates).filter((c, i, a) => a.indexOf(c) === i && !(c === fixed && seen(c)));
    // Conditional letters can wait behind fixed notices; they are rechecked before delivery.
    const valid = queue.filter(code => {
      if (code === 'L02') return !has(s, 'childcare');
      if (code === 'L04') return s.flags.trapped;
      if (code === 'L05') return has(s, 'smart') && !s.visited.chen;
      if (code === 'L07') return s.flags.rent && !has(s, 'canteen');
      if (code === 'L11') return !has(s, 'rest') && !has(s, 'blank');
      if (code === 'L12') return has(s, 'rest');
      if (code === 'L13') return has(s, 'bus');
      if (code === 'L14') return has(s, 'blank');
      return true;
    });
    const delivered = valid.slice(0, 3);
    s.pendingLetters = valid.slice(3);
    s.letters = delivered.map(code => {
      s.eventSeen[code] = true;
      s.repeatLetters[code] = false;
      if (code === 'L05') reveal(s, 'chen', true);
      if (code === 'L04' && !s.unlockedCards.includes('flexible')) s.unlockedCards.push('flexible');
      return letter(s, code);
    });
  }
  function refreshOptions(s) {
    // Multiple free builds in the same postbag cannot claim the same last plot.
    s.letters.forEach(l => {
      const fresh = letter(s, l.code);
      l.options = fresh.options;
    });
  }
  function respond(s, letterId, optionId) {
    if (s.ended) return fail('The lease has ended.');
    const index = s.letters.findIndex(l => l.id === letterId || l.code === letterId);
    if (index < 0) return fail('This letter has already been answered or is not in this round’s post.');
    const l = s.letters[index], o = l.options.find(item => item.id === optionId);
    if (!o || o.disabled) return fail(o && o.hint || 'This option is not available now.');
    const code = l.code;
    let message = 'Your reply has been sent.', revealResult = null, faded = null, recovered = null;
    const freeBuild = id => {
      const spot = emptyPlot(s);
      if (spot < 0 || s.usedCards[id]) return false;
      const result = place(s, id, spot, true, false);
      faded = result.faded; recovered = result.recovered; return true;
    };
    if (code === 'L02') {
      if (optionId === 'A') { if (!freeBuild('childcare')) return fail('There is no empty plot for a Childcare Centre.'); message = 'The Childcare Centre was approved and placed on an empty plot.'; }
      else s.repeatLetters.L02 = true;
    }
    if (code === 'L03' && optionId === 'A') { s.flags.trapped = true; s.flags.quotaRound = s.round; changeStars(s, { standard: 1 }); message = 'The quota is tighter. Residents’ lives will continue into the next round.'; }
    if (code === 'L04' && optionId === 'A') { s.flags.trapped = false; changeStars(s, { standard: -1 }); message = 'The flexible arrangement was approved. The quota no longer prevents the flat sale.'; }
    if (code === 'L05' && optionId === 'A') { s.flags.humanWindow = true; changeStars(s, { tidy: -1 }); message = 'The assisted booking counter is open. Mdm Chen can now use the Smart Community Hub.'; }
    if (code === 'L06') {
      if (optionId === 'A') { s.flags.rent = true; message = 'The rent rise was approved. Meals at the Hawker Centre are now harder to afford.'; }
      else { changeStars(s, { lively: -1 }); message = 'The affordable stalls can stay.'; }
    }
    if (['L07', 'L08'].includes(code) && optionId === 'A') { changeStars(s, { tidy: 1 }); faded = fade(s); message = 'The shared space has been cleared and tidied.'; }
    if (code === 'L07' && optionId === 'B') { s.flags.selfCook = true; changeStars(s, { standard: -1 }); message = 'The cooking corner remains. Mei and Kumar have a place to eat.'; }
    if (code === 'L08' && optionId === 'C') s.repeatLetters.L08 = true;
    if (code === 'L09') {
      if (optionId === 'A') { if (!freeBuild('retrofit')) return fail('There is no empty plot for a full Energy Retrofit.'); changeStars(s, { green: 1 }); message = 'The full Energy Retrofit was approved and uses one plot.'; }
      if (optionId === 'C') changeStars(s, { standard: -1 });
    }
    if (code === 'L10') {
      if (optionId === 'A') { revealResult = reveal(s, 'kumar', true); message = 'The cleaning team has more staff and has shared the workers’ situation. Rest Shelter unlocked.'; }
      else { changeStars(s, { green: -1 }); message = 'Staffing stays the same. Greenery maintenance is falling short.'; }
    }
    if (code === 'L11') {
      if (optionId === 'A') { if (!freeBuild('rest')) return fail('There is no empty plot for a Rest Shelter.'); s.flags.heatDeferred = false; message = 'The shaded Rest Shelter is ready.'; }
      else { faded = fade(s, 'kumar'); s.flags.heatDeferred = true; message = 'The workers’ lunch break is still on hold.'; }
    }
    if (code === 'L12' && optionId === 'B') { const spot = plotFor(s, 'rest'); if (spot >= 0) s.plots[spot] = null; changeStars(s, { standard: 1 }); entry(s, 'remove', 'Removed the Rest Shelter following complaints.', { cardId: 'rest', plotIndex: spot }); message = 'The Rest Shelter has been removed, leaving the plot empty again.'; }
    if (code === 'L13') {
      if (optionId === 'A') changeStars(s, { lively: -1 });
      if (optionId === 'B') { if (!freeBuild('soundproof')) return fail('There is no empty plot for Noise Barriers.'); message = 'The Noise Barriers have been installed.'; }
      if (optionId === 'C') s.repeatLetters.L13 = true;
    }
    if (code === 'L14') {
      if (optionId === 'A') changeStars(s, { standard: -1 });
      if (optionId === 'C') s.repeatLetters.L14 = true;
      if (optionId.startsWith('replace:')) {
        const id = optionId.slice(8), spot = plotFor(s, 'blank'), blocked = canUse(s, id, 'facility');
        if (blocked) return blocked;
        if (spot < 0) return fail('The Open Space is no longer on the board.');
        const result = place(s, id, spot, true, true); faded = result.faded; recovered = result.recovered;
        message = 'The Open Space is now ' + cardById[id].name + '. Photos already restored remain intact.';
      }
    }
    if (code === 'L15' && optionId === 'A') { if (!freeBuild('daycare')) return fail('A Day Centre cannot be placed now.'); message = 'The Day Centre is complete. The community has joined the ageing-in-place pilot.'; }
    s.letterHistory.push(Object.assign({}, l, { response: optionId, responseLabel: o.label }));
    entry(s, 'letter', 'Replied to ' + l.from + ': ' + o.label + '.', { letterCode: code, letterId: l.id, optionId });
    s.letters.splice(index, 1);
    refreshOptions(s);
    return { ok: true, message, reveal: revealResult, faded, recovered };
  }
  function initialState() {
    const s = {
      version: 1, round: 1, actions: 2, ended: false, turnLabel: titles[0], stars: { lively: 0, green: 0, tidy: 0, standard: 0 },
      unlocked: 4, plots: Array(7).fill(null), usedCards: {}, unlockedCards: [], visited: {}, photos: {}, flags: { rent: false, trapped: false, quotaRound: 0, registration: false, humanWindow: false, selfCook: false, heatDeferred: false },
      letters: [], pendingLetters: [], eventSeen: {}, repeatLetters: {}, letterHistory: [], log: []
    };
    residents.forEach(r => { s.visited[r.id] = false; s.photos[r.id] = { known: false, faded: false, name: r.photo, scene: r.scene }; });
    collectLetters(s);
    return s;
  }
  function nextRound(s) {
    if (s.ended) return fail('This lease has ended.');
    if (s.letters.length) return fail('There are still letters waiting for a reply this round.');
    if (s.actions > 0) return fail('You have ' + s.actions + ' action(s) left this round. Keep building, enacting policies or visiting residents.');
    if (s.round === 10) { s.ended = true; entry(s, 'end', 'The ninety-nine-year lease has come to an end.'); return { ok: true, ended: true, message: 'The lease is ending. Look back at life downstairs.', ending: ending(s) }; }
    s.round += 1; s.actions = 2; s.turnLabel = titles[s.round - 1];
    collectLetters(s);
    return { ok: true, ended: false, message: 'Another decade. Welcome to round ' + s.round + '.', letters: s.letters };
  }
  function advisor(s) {
    const candidates = availableCards(s).filter(c => !c.disabled && (c.kind === 'policy' || emptyPlot(s) >= 0));
    const scored = candidates.map(c => ({ c, gain: Object.keys(c.stars).reduce((n, k) => n + Math.max(0, Math.min(3, s.stars[k] + c.stars[k]) - s.stars[k]), 0) })).sort((a, b) => b.gain - a.gain);
    const best = scored[0], source = 'Source: online survey, 3/5 households responded (The Lin Family, Aisyah’s Family and Mei’s Family)';
    if (!best || best.gain === 0) return { cardId: null, name: 'No more stars available right now', icon: '🤖', gain: 0, stars: {}, text: 'According to the dashboard, none of the available actions will add stars.', source };
    const detail = Object.keys(best.c.stars).filter(k => best.c.stars[k] > 0 && s.stars[k] < 3).map(k => badges[k].icon + ' ' + badges[k].name + ' +' + Math.min(best.c.stars[k], 3 - s.stars[k])).join(', ');
    return { cardId: best.c.id, name: best.c.name, icon: best.c.icon, gain: best.gain, stars: best.c.stars, text: 'Consider ' + (best.c.kind === 'policy' ? 'enacting ' : 'building ') + best.c.name + ' to gain ' + best.gain + ' star(s): ' + detail + '.', source };
  }
  function ending(s) {
    const visits = s.log.filter(e => e.type === 'visit');
    const manualBuilds = s.log.filter(e => e.type === 'build' && !e.free);
    const policies = s.log.filter(e => e.type === 'policy');
    const unseen = residents.filter(r => !s.visited[r.id]);
    const statuses = residents.map(r => Object.assign({ id: r.id, name: r.name }, actualStatus(s, r.id)));
    const faded = residents.filter(r => s.photos[r.id].faded);
    const fromCounts = {};
    s.letterHistory.forEach(l => { fromCounts[l.from] = (fromCounts[l.from] || 0) + 1; });
    const structures = s.plots.filter(Boolean).map(p => cardById[p.cardId] ? cardById[p.cardId].name : p.cardId === 'soundproof' ? 'Noise Barriers' : 'Energy Retrofit');
    const full = statuses.filter(r => r.face === '🙂'), partly = statuses.filter(r => r.face === '😐'), unmet = statuses.filter(r => r.face === '😟');
    const paragraphs = [];
    paragraphs.push('Over this ninety-nine-year lease, the town was allocated ' + s.unlocked + ' plots and ended with ' + structures.length + ' facilities' + (structures.length ? ': ' + structures.join(', ') : '') + '. The four achievement badges recorded ' + s.stars.lively + ' Vibrancy stars, ' + s.stars.green + ' Green stars, ' + s.stars.tidy + ' Tidiness stars and ' + s.stars.standard + ' Compliance stars.');
    paragraphs.push('Of your twenty actions, ' + manualBuilds.length + ' were used to build, ' + policies.length + ' to enact policies and ' + visits.length + ' to visit residents. ' + (unseen.length ? 'You never visited or heard an update about: ' + unseen.map(r => r.name).join(', ') + '. ' : 'You came to know all five households and groups who use the space downstairs. ') + (s.unlocked < 7 ? (7 - s.unlocked) + ' plots were never allocated.' : 'All additional plots were allocated.'));
    const needsSummary = [];
    if (full.length) needsSummary.push('both needs were met for ' + full.map(r => r.name).join(', '));
    if (partly.length) needsSummary.push('one need remained unmet for ' + partly.map(r => r.name).join(', '));
    if (unmet.length) needsSummary.push(unmet.some(r => r.forcedSad) ? 'daily life remained difficult for ' + unmet.map(r => r.name).join(', ') : 'neither need was met for ' + unmet.map(r => r.name).join(', '));
    paragraphs.push('On the final board, ' + needsSummary.join('; ') + '.' + (s.flags.trapped ? ' The quota still prevents Aisyah’s Family from selling their flat.' : ''));
    paragraphs.push('You received and answered ' + s.letterHistory.length + ' letters' + ((fromCounts['The Lin Family'] || 0) ? ', including ' + fromCounts['The Lin Family'] + ' from The Lin Family' : '') + '. None came directly from Kumar & Friends; their situation entered the record only through the cleaning team and your visits. ' + (faded.length ? 'On the memory wall, “' + faded.map(r => r.photo).join('”, “') + '” had faded.' : 'All five photographs on the memory wall remained clear.'));
    return { title: 'Ninety-Nine Years On: What Remains Downstairs?', text: paragraphs.join('\n\n'), paragraphs, question: 'Is this the town you hoped for?', facts: {
      round: s.round, years: 99, unlockedPlots: s.unlocked, structures, stars: Object.assign({}, s.stars), visitCount: visits.length,
      visits: visits.map(e => residentById[e.residentId].name), autoVisitCount: s.log.filter(e => e.type === 'autoVisit').length,
      builds: manualBuilds.length, policies: policies.length, unseen: unseen.map(r => r.name), residentStatuses: statuses,
      letters: s.letterHistory.length, letterSources: fromCounts, fadedPhotos: faded.map(r => r.photo), trapped: s.flags.trapped
    } };
  }
  root.Downstairs = { version: '1.0.0', cards, residents, badges, barrierNames, initialState, availableCards, access, residentStatus, build, enact, visit, nextRound, respond, ending, advisor, totalStars };
})(typeof window !== 'undefined' ? window : globalThis);
