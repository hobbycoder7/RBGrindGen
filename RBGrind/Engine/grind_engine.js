const C = {
  bg:'#F5F0E8', surface:'#EDE8DC', border:'#D9D3C7',
  text:'#0D0B08', muted:'#6B6455', accent:'#1A3FD4',
  accentLight:'#E8EDFF', white:'#FFFFFF',
};

// ══ ENGINE (verified in isolation, 40/40 tests) ══════════════════════════════
const NEG_OK = new Set(['soul','acid','torquesoul','mizu','pornstar','mistrial','makio','sidewalk']);
const RT_OK  = new Set(['soul','acid','torquesoul','mizu','pornstar','mistrial','makio','xgrind','sidewalk']);

const BASE = [
  { id:'soul',      name:'Soul',        fam:'soul', lead:'Fastslide',     trail:'Makio',          soulFoot:'trail', topLead:'BS Fastslide', topTrail:'Fishbrain' },
  { id:'acid',      name:'Acid',        fam:'soul', lead:'BS Backslide',  trail:'Makio',          soulFoot:'trail', topLead:'Backslide',    topTrail:'Fishbrain' },
  { id:'torquesoul',name:'Torque Soul', fam:'soul', lead:'Torque',        trail:'Makio',          soulFoot:'trail', topLead:'BS Torque',    topTrail:'Fishbrain' },
  { id:'mizu',      name:'Mizu',        fam:'soul', lead:'Makio',         trail:'BS Pudslide',    soulFoot:'lead',  topLead:'Fishbrain',    topTrail:'Pudslide' },
  { id:'pornstar',  name:'Pornstar',    fam:'soul', lead:'Makio',         trail:'Torque',         soulFoot:'lead',  topLead:'Fishbrain',    topTrail:'BS Torque' },
  { id:'mistrial',  name:'Mistrial',    fam:'soul', lead:'Makio',         trail:'BS Backslide',   soulFoot:'lead',  topLead:'Fishbrain',    topTrail:'Backslide' },
  { id:'makio',     name:'Makio',       fam:'soul', lead:null,             trail:'Makio',          soulFoot:'trail', topLead:null,           topTrail:'Fishbrain' },
  { id:'xgrind',    name:'X-Grind',     fam:'soul', lead:'Fishbrain',     trail:'Makio',          soulFoot:'trail', noTop:true },
  { id:'teakettle', name:'Tea Kettle',  fam:'soul', lead:'Rough Makio',   trail:'Torque',         soulFoot:'lead',  gate:'rough', negName:'Negative Tea Kettle', noTop:true, noRT:true },
  { id:'hotdog',    name:'Hot Dog',     fam:'soul', lead:'Negative Makio',trail:'Negative Makio', soulFoot:'both',  gate:'negative', noTop:true, noNeg:true, noRT:true },
  { id:'stubsoul',  name:'Stub Soul',   fam:'soul', lead:'Negative Makio',trail:'Makio',          soulFoot:'trail', gate:'negative', noTop:true, noNeg:true, noRT:true },
  { id:'frontside', name:'Frontside',   fam:'groove', lead:'Fastslide',    trail:'Pudslide',   bsLead:'BS Fastslide', bsTrail:'BS Pudslide' },
  { id:'farv',      name:'Full Torque',        fam:'groove', lead:'Torque',       trail:'Pudslide',   bsLead:'BS Torque',    bsTrail:'BS Pudslide' },
  { id:'royale',    name:'Royale',      fam:'groove', lead:'Fastslide',    trail:'Backslide',  bsLead:'BS Fastslide', bsTrail:'BS Backslide' },
  { id:'cabdriver', name:'Cabdriver',   fam:'groove', lead:'Torque',       trail:'Backslide',  bsLead:'BS Torque',    bsTrail:'BS Backslide' },
  { id:'unity',     name:'Unity',       fam:'groove', lead:'Backslide',    trail:'Torque',     bsLead:'BS Backslide', bsTrail:'BS Torque' },
  { id:'savannah',  name:'Savannah',    fam:'groove', lead:'Backslide',    trail:'Torque',     bsLead:'BS Backslide', bsTrail:'BS Torque', fsName:'Savannah', bsName:'Backside Savannah', fsSub:'AO Unity', bsSub:'AO BS Unity' },
  { id:'pudslide',  name:'Pudslide',    fam:'groove', lead:null,           trail:'Pudslide',   bsLead:null,           bsTrail:'BS Pudslide', def:false },
  { id:'fastslide', name:'Fastslide',   fam:'groove', lead:'Fastslide',    trail:null,         bsLead:'BS Fastslide', bsTrail:null, def:false },
  { id:'torque_g',  name:'Torque',      fam:'groove', lead:'Torque',       trail:null,         bsLead:'BS Torque',    bsTrail:null },
  { id:'backslide', name:'Backslide',   fam:'groove', lead:null,           trail:'Backslide',  bsLead:null,           bsTrail:'BS Backslide' },
  { id:'tabernacle',name:'Tabernacle',  fam:'groove', lead:'Backslide',    trail:'BS Pudslide',bsLead:'BS Backslide', bsTrail:'Pudslide', def:false },
  { id:'bynsoul',   name:'Byn Soul',    fam:'groove', lead:'Fastslide',    trail:'BS Torque',  bsLead:'BS Fastslide', bsTrail:'Torque', def:false },
  { id:'ufo',       name:'UFO',         fam:'groove', lead:'Fastslide',    trail:'Pudslide',   bsLead:'BS Fastslide', bsTrail:'BS Pudslide' },
  { id:'darkslide', name:'Darkslide',   fam:'groove', lead:'BS Backslide', trail:'Backslide',  bsLead:'Backslide',    bsTrail:'BS Backslide', def:false },
  { id:'wheelbarrow',name:'Wheelbarrow', fam:'groove', lead:'Wheel',        trail:'Backslide',  bsLead:'Wheel',        bsTrail:'BS Backslide', def:false },
];

const SPECIAL = {
  'ao|torquesoul':'Soyale', 'mizu|top':'Sweatstance', 'makio|top':'Fishbrain',
  'ao|mizu|top':'Kindgrind',
};

// ═══ V3 POSE-ENGINE NAMING ═════════════════════════════════════════════════
// Compact port of grindModel.js naming, keyed by the app's grind id + flags.
// This is the real production namer (see "V3 IS NOW THE NAMER" below, ~line 513) —
// computeDisplay calls V3.name() for the grind-name core and alias resolution.
const V3 = (() => {
  // base display names by id
  const NAME = {
    soul:'Soul', acid:'Acid', torquesoul:'Torque Soul', mizu:'Mizu', pornstar:'Pornstar',
    mistrial:'Mistrial', makio:'Makio', xgrind:'X-Grind', teakettle:'Tea Kettle',
    citric:'Citric Acid', hotdog:'Hot Dog', stubsoul:'Stub Soul', sidewalk:'Sidewalk',
    frontside:'Frontside', farv:'Full Torque', royale:'Royale', cabdriver:'Cab Driver',
    unity:'Unity', savannah:'Savannah', pudslide:'Pudslide', fastslide:'Fastslide',
    torque_g:'Torque', backslide:'Backslide', tabernacle:'Tabernacle', bynsoul:'Byn Soul',
    ufo:'UFO', darkslide:'Darkslide', wheelbarrow:'Wheelbarrow',
  };
  const ALIASES = {
    'AO Torque Soul':'Soyale','AO Topside Mizu':'Kindgrind',
    'Topside Makio':'Fishbrain','Topside Mizu':'Sweatstance',
    'AO Unity':'Savannah','AO Backside Unity':'Backside Savannah',
  };
  const AO_PARTNER = { royale:'Full Torque', torque_g:'Backslide', fastslide:'Pudslide',
    backslide:'Torque', pudslide:'Fastslide', farv:'Royale' };
  const AO_SYMMETRIC = new Set(['frontside','cabdriver']);
  const HYBRID = { tabernacle:{rev:'backside',top:false}, darkslide:{rev:'backside',top:false,noTrue:true},
    bynsoul:{rev:'topside',top:true}, wheelbarrow:{rev:'backside',top:false} };
  const isSoul = id => ['soul','acid','torquesoul','mizu','pornstar','mistrial','makio',
    'xgrind','teakettle','citric','hotdog','stubsoul','sidewalk'].includes(id);

  // alias resolver: peel topside then AO on miss, prefix peeled + mods
  function nameWithFlags(base, f={}) {
    const { ao, topside, negative, rough, tough } = f;
    const key = (a,t)=>[a?'AO':null,t?'Topside':null,base].filter(Boolean).join(' ');
    const peeled=[]; let core=ALIASES[key(ao,topside)];
    if(!core && topside){ const h=ALIASES[key(ao,false)]; if(h){core=h;peeled.push('Topside');} }
    if(!core && ao){ const h=ALIASES[key(false,topside)]; if(h){core=h;peeled.push('AO');} }
    if(!core) core=key(ao,topside);
    const mods=[]; if(negative)mods.push('Negative'); if(rough)mods.push('Rough'); if(tough)mods.push('Tough');
    return [...mods,...peeled,core].join(' ');
  }
  function validity(id, f={}) {
    if(f.christ && f.antichrist) return 'no Christ + Antichrist together';
    if(id==='hotdog'){ if(f.topside)return 'no Topside Hot Dog'; if(f.negative)return 'Hot Dog always negative'; }
    if(id==='xgrind' && f.negative) return 'no Negative X-Grind';
    if(HYBRID[id] && f.negative) return 'no Negative '+NAME[id];
    if(HYBRID[id] && f.topside && !HYBRID[id].top) return 'no Topside '+NAME[id];
    return null;
  }
  // Christ/Antichrist: per Jim's slot order they sit immediately before the BASE word,
  // AFTER any leading orientation tokens (AO / Backside / Topside). When an alias has
  // absorbed the orientation (e.g. Topside Makio -> Fishbrain) there is no leading token
  // left, so christ leads: "Christ Fishbrain". "AO Fishbrain" -> "AO Christ Fishbrain".
  // Rule A (Jim). Implemented by splitting off the leading orientation run and inserting.
  const ORIENT = new Set(['AO','Backside','Topside']);
  function christPrefix(str, f={}) {
    const label = f.christ ? 'Christ' : (f.antichrist ? 'Anti Christ' : null);
    if(!label) return str;
    const toks = str.split(' ');
    let i = 0;
    while(i < toks.length && ORIENT.has(toks[i])) i++; // skip the leading orientation run
    if(i >= toks.length) i = toks.length - 1;          // all-orientation guard (never happens)
    toks.splice(i, 0, label);
    return toks.join(' ');
  }
  // main: id + flags → name (or a "blocked" note)
  // For grooves, `backside` (the FS/BS orientation) is distinct from soul AO.
  function name(id, f={}) {
    const v = validity(id,f); if(v) return '⚠ '+v;
    // christPrefix wraps the resolved name at the single exit below, so christ/antichrist
    // land right before the base/alias per the slot order (e.g. "Christ Fishbrain").
    return christPrefix(nameCore(id,f), f);
  }
  function nameCore(id, f={}) {
    const base = NAME[id] || id;
    if(!isSoul(id)) {
      // GROOVE / HYBRID
      if(HYBRID[id]) {
        // hybrids: soul-style naming. Reversal signalled via `backside`/`ao` from app.
        const r = HYBRID[id];
        let core = base;
        const reversed = f.backside || f.ao;
        // Byn Soul: treated soul-style. topside → "Topside Byn Soul";
        //   reversed → "AO Byn Soul"; both → "AO Topside Byn Soul".
        if(id==='bynsoul') {
          const parts = [];
          if(reversed) parts.push('AO');
          if(f.topside) parts.push('Topside');
          parts.push('Byn Soul');
          return parts.join(' ');
        }
        // Tabernacle / Darkslide / Wheelbarrow: reversal → Backside X
        if(reversed && r.rev==='backside') core = 'Backside '+core;
        return core;
      }
      // pure groove: backside is an orientation prefix (or a special BS name).
      // AO handled by partner table only when NOT backside (rare in practice).
      let core = base;
      // special backside names: BS Frontside → "Backside"; Unity → "Backside Unity"
      const BS_SPECIAL = { frontside:'Backside', unity:'Backside Unity', savannah:'Backside Savannah' };
      if(f.backside) {
        core = BS_SPECIAL[id] || ('Backside '+base);
        return core;
      }
      // forward groove, no backside: just the base (AO-partner naming only applies
      // to true reverse-travel, which the app expresses via `away`/BS, so bare here)
      return core;
    }
    return nameWithFlags(base,f);
  }
  return { name, validity };
})();
// ═══════════════════════════════════════════════════════════════════════════

// Book of Grinds reference links. URLs verified via search.
// Special-name grinds have their own dedicated BoG pages — link those when shown.
const BOG_BASE = 'https://bookofgrinds.com/';
const BOG_INDEX = BOG_BASE + 'index.html';
const BOG_LINKS = {
  // Soul grinds
  soul: BOG_BASE+'02.0_Soul.html',
  acid: BOG_BASE+'05.0_Acid.html',
  torquesoul: BOG_BASE+'08.0_Torque_Soul.html',
  mizu: BOG_BASE+'03.0_Mizou.html',
  pornstar: BOG_BASE+'04.0_PStar.html',
  mistrial: BOG_BASE+'07.0_Mistrial.html',
  makio: BOG_BASE+'01.0_Makio.html',
  xgrind: BOG_BASE+'06.0_X_Grind.html',
  citric: BOG_BASE+'05.1_Citric_Acid.html',
  teakettle: BOG_BASE+'13.0_Tea_Kettle.html',
  hotdog: BOG_BASE+'11.0_Hot_Dog.html',
  stubsoul: BOG_BASE+'10.0_Stub_Soul.html',
  sidewalk: BOG_BASE+'04.1_Sidewalk.html',
  // Groove grinds
  frontside: BOG_BASE+'01.0_Frontside.html',
  farv: BOG_BASE+'04.0_Full_Torque.html',
  royale: BOG_BASE+'03.0_Royale.html',
  cabdriver: BOG_BASE+'09.0_Cab_driver.html',
  unity: BOG_BASE+'07.0_Unity.html',
  pudslide: BOG_BASE+'11.0_Pudslide.html',
  fastslide: BOG_BASE+'10.0_Fastslide.html',
  torque_g: BOG_BASE+'05.0_Torque.html',
  backslide: BOG_BASE+'06.0_Backslide.html',
  tabernacle: BOG_BASE+'12.0_Tabernacle.html',
  ufo: BOG_BASE+'08.0_UFO_(Low_FS_or_BS).html',
  darkslide: BOG_BASE+'14.0_Darkslide.html',
  wheelbarrow: BOG_BASE+'15.0_Wheelbarrow.html',
  savannah: BOG_BASE+'09.0_Savannah_(AO_Unity).html',
};
// Special-name grinds → their dedicated BoG pages (keyed by display name)
const BOG_SPECIAL = {
  'Soyale': BOG_BASE+'04.0_Soyale_(AO_Torque_Soul).html',
  'Sweatstance': BOG_BASE+'02.0_Sweatstance_(Topside_Mizou).html',
  'Fishbrain': BOG_BASE+'01.0_Fishbrain_(Topside_Makio).html',
  'Kindgrind': BOG_BASE+'03.0_Kindgrind_(AO_Topside_Mizou).html',
  'AO Topside Mistrial': BOG_BASE+'07.0_Misfit_(AO_Topside_Mistrial).html',
  'Topside Mistrial': BOG_BASE+'10.0_Overpuss_(Topside_Mistrial).html',
  'Topside Pornstar': BOG_BASE+'05.0_Sunny_Day_(Topside_PStar).html',
  'AO Topside Pornstar': BOG_BASE+'06.0_Cloudy_Night_(AO_Topside_PStar).html',
  'Savannah': BOG_BASE+'09.0_Savannah_(AO_Unity).html',
  'Backside Savannah': BOG_BASE+'09.1_Backside_Savannah_(AO_BS_Unity).html',
  'Backside': BOG_BASE+'02.0_Backside.html',
};
// Resolve the best BoG link given the base trick and what's actually displayed.
const bogLink = (baseId, special) => {
  if(special && BOG_SPECIAL[special]) return BOG_SPECIAL[special];
  return BOG_LINKS[baseId] || BOG_INDEX;
};

const byName = (a,b) => a.name.localeCompare(b.name);
const SOUL_TRICKS = BASE.filter(b=>b.fam==='soul').sort(byName);
const GROOVE_TRICKS = BASE.filter(b=>b.fam==='groove').sort(byName);

const roll = (pct) => Math.random()*100 < pct;
const pick = (a) => a[Math.floor(Math.random()*a.length)];
const prefixFoot = (l,p) => l ? `${p} ${l}` : l;
const isSingleFoot = (t) => !t.lead || !t.trail;
// Entry degrees within [min,max]. Souls: 0/180/360/540 in range. Grooves: 90/270/450,
// but the 90° lock is their floor — a range that reaches down to/below 90 (e.g. 0–0,
// "no spin") still yields the basic 90° groove, since the lock is mandatory, not added spin.
// A range that starts above 90 (e.g. 180–180) excludes grooves entirely (souls-only).
const validInDeg = (fam, min, max) => {
  if(fam==='soul') return [0,180,360,540].filter(d => d>=min && d<=max);
  let g = [90,270,450].filter(d => d>=min && d<=max);
  if(min <= 90 && !g.includes(90)) g = [90, ...g];
  return g;
};
// Exit degrees within [min,max]. 0 = "no spin off", valid for both families when in range.
const validOutDeg = (fam, min, max) => {
  const set = fam==='soul' ? [0,180,360,540] : [0,90,270,450];
  return set.filter(d => d>=min && d<=max);
};

// topside eligibility: souls generally, plus Byn Soul specifically (a groove that
// takes topside per Jim's hybrid ruling — "Byn Soul reversed = AO Byn Soul; it
// takes topside not backside". Previously gated to fam==='soul' only in both
// generateTrick and enumerateVariants, which made "Topside Byn Soul" nameable but
// unreachable/uncounted — fixed by sharing this single definition between them.
const topEligible = (b) => (b.fam==='soul' && !b.noTop) || b.id==='bynsoul';
function generateTrick(F) {
  const { spins:SP, sliders:SL } = F;
  const pool = BASE.filter(b => {
    if(F.tricks[b.id] === false) return false;
    if(b.gate && SL[b.gate] <= 0) return false;
    // drop the trick if its family has no valid entry degree in the In-spin range
    if(validInDeg(b.fam, SP.inMin, SP.inMax).length === 0) return false;
    return true;
  });
  if(!pool.length) return null;

  // topside eligibility defined at module scope (topEligible, above) so both
  // generateTrick and enumerateVariants use the identical rule.

  // Population-fraction normalization: Switch is legal on every trick, while
  // Negative/Rough/Tough/Christ/Antichrist/Topside are only legal on a subset (souls,
  // single-foot grinds, etc). At equal slider values that dilutes the gated ones well
  // below their number while Switch lands at its full slider rate — Switch (and
  // anything stacked with it) then feels dramatically overrepresented. Scaling each
  // gated modifier's roll by 1/eligibleFraction (within the currently enabled pool)
  // makes every slider mean the same thing: "this % of ALL generated tricks",
  // uniformly, Switch included (which needs no scaling — already ~100% eligible).
  const frac = (test) => { const n = pool.filter(test).length; return n / pool.length; };
  const fTop = frac(topEligible) || 1;
  const fNeg = frac(b => NEG_OK.has(b.id) && !b.noNeg) || 1;
  const fRT  = frac(b => RT_OK.has(b.id) && !b.noRT) || 1;
  const fCA  = frac(b => isSingleFoot(b)) || 1;
  const scaledRoll = (slider, fEligible) => slider > 0 && roll(Math.min(100, slider / fEligible));

  const base = pick(pool);
  const fam = base.fam;
  const inDeg = pick(validInDeg(fam, SP.inMin, SP.inMax));
  const fakieIn = roll(SP.fakieIn);
  let away = fam==='soul' ? (SP.truespin ? Math.random()<0.5 : false) : Math.random()<0.5;
  let top = topEligible(base) && SL.topside>0 ? scaledRoll(SL.topside, fTop) : false;
  let neg = NEG_OK.has(base.id) && !base.noNeg && !top && SL.negative>0 ? scaledRoll(SL.negative, fNeg) : false;
  let rough=false, tough=false;
  if(RT_OK.has(base.id) && !base.noRT && !top) {
    const rHit = SL.rough>0 && scaledRoll(SL.rough, fRT);
    const tHit = SL.tough>0 && scaledRoll(SL.tough, fRT);
    if(rHit && tHit) (Math.random()<0.5 ? rough=true : tough=true);
    else { rough=rHit; tough=tHit; }
  }
  let christ=false, antichrist=false;
  if(!neg && !rough && !tough && isSingleFoot(base)) {
    const cHit = SL.christ>0 && scaledRoll(SL.christ, fCA);
    const aHit = SL.antichrist>0 && scaledRoll(SL.antichrist, fCA);
    if(cHit && aHit) (Math.random()<0.5 ? christ=true : antichrist=true);
    else { christ=cHit; antichrist=aHit; }
  }
  let sw = SL.switch>0 && roll(SL.switch);   // always-eligible on every trick — no scaling needed
  // exit degrees in range; if none valid (range excludes 0 and all family degrees), no spin off
  const outOpts = validOutDeg(fam, SP.outMin, SP.outMax);
  const outDeg = outOpts.length ? pick(outOpts) : 0;
  const rewind = outDeg>0 && SP.rewindOut>0 && roll(SP.rewindOut);
  return { baseId:base.id, fam, entry:{inDeg,fakieIn,away,top}, mods:{neg,rough,tough,christ,antichrist,sw}, exit:{outDeg,rewind} };
}

// Enumerate EVERY trick variant the generator can currently produce, mirroring the exact
// eligibility/blocking rules in generateTrick. Used to determine — deterministically — the
// full space of possible tricks (so "Pool Complete" is exact, not a random-sampling guess,
// even with rare modifiers). A probability of 0 means that modifier is off (only its absent
// value is possible); >0 means both present and absent are possible.
function enumerateVariants(F) {
  const { spins:SP, sliders:SL } = F;
  const out = [];
  const bases = BASE.filter(b => {
    if(F.tricks[b.id] === false) return false;
    if(b.gate && SL[b.gate] <= 0) return false;
    if(validInDeg(b.fam, SP.inMin, SP.inMax).length === 0) return false;
    return true;
  });
  const opts = (cond) => cond ? [false, true] : [false];   // [absent] or [absent, present]
  // Slider-aware version (v3.02 fix): at 100% a modifier is FORCED ON (drop the absent
  // case), at 1-99% both cases are possible, at 0% (or ineligible) only absent. Mirrors
  // generateTrick, where roll(100) is always true. `eligible` gates by base/rule.
  const optsP = (eligible, pct) => !eligible ? [false] : (pct >= 100 ? [true] : (pct > 0 ? [false, true] : [false]));
  // Mutually-exclusive pair (rough/tough, christ/antichrist). Returns [a,b] combos.
  // v3.02: if EITHER slider is 100%, the "neither" (plain) case is dropped — one of them
  // must appear. Both at 100% → keep both singles, drop plain (can't force both at once).
  // Below 100%, a possible modifier adds its single variant and plain stays in.
  const pairP = (eligA, pctA, eligB, pctB) => {
    const aPossible = eligA && pctA > 0;
    const bPossible = eligB && pctB > 0;
    const forced = (eligA && pctA >= 100) || (eligB && pctB >= 100);
    const combos = [];
    if(!forced) combos.push([false, false]);
    if(aPossible) combos.push([true, false]);
    if(bPossible) combos.push([false, true]);
    if(!combos.length) combos.push([false, false]); // neither eligible → plain only
    return combos;
  };
  const outDegs = (fam) => {
    const o = validOutDeg(fam, SP.outMin, SP.outMax);
    return o.length ? o : [0];
  };
  for(const base of bases) {
    const fam = base.fam;
    const inDegs = validInDeg(fam, SP.inMin, SP.inMax);
    const fakieOpts = opts(SP.fakieIn > 0);
    const awayOpts = fam==='soul' ? (SP.truespin ? [false,true] : [false]) : [false,true];
    const topOpts = optsP(topEligible(base), SL.topside);
    for(const inDeg of inDegs)
    for(const fakieIn of fakieOpts)
    for(const away of awayOpts)
    for(const top of topOpts) {
      // negative: only when eligible and not topside
      const negOpts = optsP(NEG_OK.has(base.id) && !base.noNeg && !top, SL.negative);
      for(const neg of negOpts) {
        // rough/tough: eligible, not topside; mutually exclusive on a single soul plate
        const rtEligible = RT_OK.has(base.id) && !base.noRT && !top;
        const rtCombos = pairP(rtEligible, SL.rough, rtEligible, SL.tough);
        for(const [rough,tough] of rtCombos) {
          // christ/antichrist: single-foot only, blocked by neg/rough/tough, mutually exclusive
          const caEligible = !neg && !rough && !tough && isSingleFoot(base);
          const caCombos = pairP(caEligible, SL.christ, caEligible, SL.antichrist);
          for(const [christ,antichrist] of caCombos)
          for(const sw of optsP(true, SL.switch))
          for(const outDeg of outDegs(fam))
          for(const rewind of (outDeg>0 && SP.rewindOut>0 ? [false,true] : [false])) {
            out.push({ baseId:base.id, fam, entry:{inDeg,fakieIn,away,top}, mods:{neg,rough,tough,christ,antichrist,sw}, exit:{outDeg,rewind} });
          }
        }
      }
    }
  }
  return out;
}

// grind-facing landing stance from approach + total rotation (0=forward, 1=fakie)
function landFacing(fakieIn, totalDeg) {
  return ((fakieIn ? 1 : 0) + Math.round(totalDeg/180)) % 2;
}

// Returns the entry prefix word(s) WITHOUT the bare AO label (that's applied centrally),
// plus flags: landsFakie (=AO position on a soul), isBS (groove backside), isZero,
// namedDir (entry uses a direction word — Truespin/Inspin/Outspin — that already implies
// the fakie landing, so the bare "AO" label is suppressed).
function entryName(fam, e, detailed) {
  let word='', isBS=false, isZero=false, namedDir=false;
  const landsFakie = fam==='soul' && landFacing(e.fakieIn, e.inDeg) === 1;
  if(fam==='soul') {
    if(e.inDeg===0) {
      if(e.fakieIn) { word = detailed ? 'Zero Spin' : 'Zero'; isZero=true; }
    } else {
      // A 540 is a full 360 (back to square) plus a 180; the 180 component is what gets
      // named. Direction words (Truespin/Inspin/Outspin) show only at ODD half-rotations
      // (180, 540) — at 360 you're back to square, so no direction word. AO (fwd+toward)
      // is applied centrally. The degree is prefixed when >= 360.
      const deg = e.inDeg >= 360 ? String(e.inDeg) : '';
      const hasHalf = (e.inDeg / 180) % 2 === 1;   // 180 or 540
      let dir = '';
      if(hasHalf) {
        if(!e.fakieIn && !e.away) dir = '';                                // AO — added centrally
        else if(!e.fakieIn && e.away) { dir = detailed ? 'Truespin' : 'True'; namedDir=true; }
        else if(e.fakieIn && !e.away) { dir = 'Inspin'; namedDir=true; }
        else { dir = 'Outspin'; namedDir=true; }
      }
      // "Fakie" marks a backward approach, but only when no direction word already implies
      // it (Inspin/Outspin do). This covers the 360 case → "Fakie 360 Soul".
      const fk = (e.fakieIn && !namedDir) ? 'Fakie' : '';
      word = [fk, deg, dir].filter(Boolean).join(' ');
    }
  } else {
    // GROOVE: rail position (front/back) + backward-approach marker + degree at 270/450.
    // Backward approach at the bare 90 lock (no added spin) = "Zero" / "Zero Spin".
    // Backward approach with actual rotation (270/450) = "Fakie" (traveling fakie into the spin).
    const parts = [];
    if(e.fakieIn) {
      if(e.inDeg === 90) { parts.push(detailed ? 'Zero Spin' : 'Zero'); isZero = true; }
      else parts.push('Fakie');
    }
    if(e.inDeg !== 90) parts.push(String(e.inDeg));
    // Detail mode: label the spin DIRECTION (toward=Inspin, away=Outspin) after the
    // degree — display only, for readability. Only when there's an actual spin (not the
    // bare 90 lock). BS is kept separately below (backside is a distinct property).
    if(e.inDeg !== 90) parts.push(e.away ? 'Outspin' : 'Inspin');
    // Backside is the LANDED facing, not just the stored `away` flag. A groove's base
    // lock is 90 (frontside); every extra 180 of entry rotation flips FS<->BS. So a
    // forward 270 lands backside even with away=false. Combine the rotation flip with
    // the away flag (XOR).
    const rotFlip = (Math.round((e.inDeg - 90) / 180) % 2 + 2) % 2 === 1;
    const landsBackside = rotFlip !== !!e.away;
    if(landsBackside) { parts.push('BS'); isBS = true; }
    word = parts.join(' ');
  }
  return { word, landsFakie, isBS, isZero, namedDir };
}

function landingStance(entry, effectiveExitDeg) {
  const approach = entry.fakieIn ? 1 : 0;
  const total = entry.inDeg + effectiveExitDeg;
  const facing = (approach + Math.round(total/180)) % 2;
  return facing===0 ? 'to forward' : 'to fakie';
}

function exitName(fam, entry, exit, detailed) {
  if(exit.outDeg === 0) return '';
  const natural = fam==='soul' ? 180 : 90;
  const rewindDeg = fam==='soul' ? 180 : 270;
  if(exit.rewind) {
    const stance = landingStance(entry, natural);
    return detailed ? `${rewindDeg} rewind out ${stance}` : 'rewind out';
  }
  const stance = landingStance(entry, exit.outDeg);
  if(exit.outDeg === natural) return detailed ? `${exit.outDeg} out ${stance}` : stance;
  return detailed ? `${exit.outDeg} out ${stance}` : `${exit.outDeg} out`;
}

function computeDisplay(t, opts={}) {
  if(!t) return null;
  const { specialFirst=true, detailed=false, spellBackside=true } = opts;
  const base = BASE.find(b=>b.id===t.baseId);
  const { entry:e, mods:m, exit:x } = t;
  const fam = base.fam;
  const en = entryName(fam, e, detailed);
  const tags = [];
  if(e.top) tags.push('top');
  if(en.landsFakie && !en.isZero && !en.namedDir) tags.push('ao');   // AO only when no direction word already names it (Truespin/In/Out) and not a Zero
  const tagKey = [...tags, base.id].sort().join('|');
  const special = SPECIAL[tagKey] || null;

  let lead, trail;
  if(e.top && base.topLead!==undefined) { lead=base.topLead; trail=base.topTrail; }
  else if(en.isBS && base.bsLead!==undefined) { lead=base.bsLead; trail=base.bsTrail; }
  else { lead=base.lead; trail=base.trail; }
  const sf = base.soulFoot;
  const apply = (which,pre) => {
    if(which==='lead'||which==='both') lead=prefixFoot(lead,pre);
    if(which==='trail'||which==='both') trail=prefixFoot(trail,pre);
  };
  if(!e.top) {
    if(m.neg) apply(sf,'Negative');
    if(m.rough) apply(sf==='both'?'lead':sf,'Rough');
    if(m.tough) apply(sf==='both'?'trail':sf,'Tough');
  }

  // AO FOOT DISPLAY — when a soul is ridden alley-oop you've turned around, so the
  // foot that was leading now trails and vice-versa. The souling foot itself doesn't
  // change (AO keeps the same soul foot; only orientation reverses), so this is a pure
  // lead/trail relabel — same plate names, swapped positions — to show the feet as they
  // actually are when landed and grinding. Done AFTER modifier prefixes so Negative/
  // Rough/Tough land on the correct (soul) foot first, then the whole thing flips.
  if(en.landsFakie) { const tmp = lead; lead = trail; trail = tmp; }

  let core = base.name, usedNeg=false;
  if(m.neg && base.negName) { core=base.negName; usedNeg=true; }
  let customSub=null, word=en.word;
  if(base.fsName) {
    if(en.isBS) { core=base.bsName; customSub=base.bsSub; }
    else { core=base.fsName; customSub=base.fsSub; }
    // "Backside Savannah" already encodes BS — strip the BS token, keep Fakie/degree
    word = word.split(' ').filter(p => p !== 'BS').join(' ');
  }
  // A backside Frontside grind is just called a "Backside" — drop the redundant
  // "Frontside" word and the "BS" token (e.g. "BS Frontside" → "Backside").
  let backsideOverride = false;
  if(base.id==='frontside' && en.isBS) {
    core = 'Backside';
    word = word.split(' ').filter(p => p !== 'BS').join(' ');
    backsideOverride = true;
  }

  // Bare "AO" label: shown whenever a soul lands fakie (the grind position), regardless of
  // approach. "Fakie" (approach) and "AO" (grind position) are independent and can stack,
  // e.g. a fakie 360 → "Fakie 360 AO Soul". Suppressed only when a special name encodes the
  // position, the entry is Zero, or a direction word (Inspin/Outspin) already implies it.
  const showAO = en.landsFakie && !special && !en.isZero && !en.namedDir && !base.fsName;

  // ═══ V3 IS NOW THE NAMER ═══════════════════════════════════════════════
  // V3 owns the grind-name CORE (base + AO/backside + topside + negative + rough/
  // tough + alias resolution). The app keeps wrapping the spin word, Switch, Christ/
  // Antichrist, and the exit suffix around it — decorations V3 doesn't model.
  const _v3ao = fam==='soul' ? (en.landsFakie && !en.isZero && !en.namedDir) : false;
  const _v3backside = fam==='groove' ? en.isBS : false;
  const v3Core = V3.name(t.baseId, {
    ao:_v3ao, backside:_v3backside, topside:!!e.top,
    negative:!!m.neg, rough:!!m.rough, tough:!!m.tough,
    christ:!!m.christ, antichrist:!!m.antichrist,
  });
  // If V3 returns a validity block (⚠ …) fall back to the old core so nothing breaks.
  const v3Valid = v3Core && !v3Core.startsWith('⚠');

  const buildTech = () => {
    const p=[];
    if(m.sw) p.push('Switch');
    // V3 owns the Backside label, so strip a leading/standalone "BS" token from the
    // app's spin word to avoid "BS Backside …" doubling.
    let w = word;
    if(v3Valid && w) w = w.split(' ').filter(tok => tok !== 'BS').join(' ');
    if(w) p.push(w);
    if(v3Valid) {
      // V3 grind name — already includes AO/topside/neg/etc. AND the christ/antichrist
      // prefix (V3 owns it now; app no longer wraps it here).
      p.push(v3Core);
    } else {
      // fallback: old assembly (V3 returned invalid; app still names christ here).
      // Order preserved from the pre-parity code: christ/antichrist BEFORE the AO token.
      if(m.christ) p.push('Christ');
      if(m.antichrist) p.push('Anti Christ');
      if(showAO) p.push('AO');
      if(m.neg && !usedNeg) p.push('Negative');
      if(m.rough) p.push('Rough');
      if(m.tough) p.push('Tough');
      if(e.top) p.push('Topside');
      p.push(core);
    }
    return p.join(' ');
  };
  const buildSpecial = () => {
    const p=[];
    if(m.sw) p.push('Switch');
    // special name encodes AO/BS already; keep Fakie/degree tokens from the entry word
    const kept = word ? word.split(' ').filter(t => t!=='BS').join(' ') : '';
    if(kept) p.push(kept);
    if(m.neg) p.push('Negative');
    if(m.rough) p.push('Rough');
    if(m.tough) p.push('Tough');
    if(m.christ) p.push('Christ');
    if(m.antichrist) p.push('Anti Christ');
    p.push(special);
    return p.join(' ');
  };

  const exitSuffix = exitName(fam, e, x, detailed);
  let main, sub=null, specialName=null;
  if(v3Valid) {
    // V3 owns the name. It already resolved any alias (Soyale, Fishbrain, Savannah…),
    // so main = the V3-built tech string. specialName carries the alias/backside for
    // the BoG link routing when V3 produced one distinct from the plain base name.
    main = buildTech();
    const plain = (BASE.find(b=>b.id===t.baseId)||{}).name;
    if(v3Core && plain && v3Core !== plain && v3Core.indexOf(plain) === -1) specialName = v3Core;
    // Topside Pornstar / AO Topside Pornstar / Topside Mistrial / AO Topside Mistrial keep a
    // dedicated BoG page even though the literal name now contains the base name (Jim's
    // rename from Sunny Day/Cloudy Night/Overpuss/Misfit) — force the override past the
    // "contains base name" heuristic above so the link still resolves correctly.
    if(e.top && (t.baseId==='pornstar' || t.baseId==='mistrial')) specialName = v3Core;
    if(backsideOverride) specialName = 'Backside';
    if(customSub) sub = specialFirst ? customSub : null;
  } else if(special && !usedNeg) {
    specialName = special;
    if(specialFirst){ main=buildSpecial(); sub=buildTech(); }
    else { main=buildTech(); sub=buildSpecial(); }
  } else if(customSub) {
    specialName = core;
    main=buildTech();
    sub=specialFirst ? customSub : null;
  } else {
    main=buildTech();
  }
  if(backsideOverride) specialName = 'Backside';   // routes the BoG link to the Backside page
  if(exitSuffix) main = `${main} ${exitSuffix}`;
  // Detail OFF → abbreviate "Backside" to "BS" in the displayed name (Option A).
  // Exception: if "Backside" IS the whole name (a bare groove backside with no other
  // trick attached), keep it spelled out — a lone "BS" reads as a stray acronym.
  // Compound names ("Backside UFO") still abbreviate normally ("BS UFO").
  if(!spellBackside) {
    const abbr = s => { if(!s) return s; if(s === 'Backside') return s; return s.replace(/\bBackside\b/g, 'BS'); };
    main = abbr(main); sub = abbr(sub);
  }
  return { main, sub, lead, trail, specialName };
}

// Stable identity for a trick: based on what's actually displayed (short form, default
// special-first), NOT raw entry flags. Two tricks that look identical (e.g. away=true vs
// away=false at 0°, which don't change the name) share one signature — so Hide Landed and
// bookmarks treat them as the same trick.
function trickSignature(t) {
  if(!t) return null;
  const d = computeDisplay(t, { specialFirst:true, detailed:false });
  return JSON.stringify([d.main, d.lead, d.trail]);
}

// ══ SWITCH-UP CHAINS ═════════════════════════════════════════════════════════
// A switch-up links 2–3 grinds on one obstacle. Model: { tricks:[t1,t2,...],
// transitions:[tr1,...] } where transitions[i] describes the spin INTO tricks[i+1].
// Only the LAST grind carries an exit (the landing).
//
// FACING PROPAGATION: the key to correct AO/Truespin naming. We walk the chain
// front-to-back tracking current facing (forward/fakie). Each grind's ENTRY is
// derived from (inherited facing) + (transition direction: toward=AO / away=blind)
// + (transition degree). We then let the normal computeDisplay name each grind —
// so AO, Truespin, half-cab, and SPECIAL renames (Soyale, Kindgrind…) all fall
// out of the existing engine, including the fakie-reverses-the-convention rule
// (a 180 toward the obstacle reads AO when forward, but flips when already fakie).
//
// A soul ridden AO keeps the SAME souling foot (only orientation reverses) — so
// no plate data changes; the entry flags carry the whole story. Grooves don't
// take AO; their transition is named by position/degree as usual.

// STAGE 1 — family-PAIR-aware transition degrees.
// The rotation to switch between two grinds depends on BOTH grinds' orientation:
//  • SAME family (soul→soul or groove→groove): both stances share an orientation
//    plane (souls along the rail / parallel, grooves across it / perpendicular).
//    The transition is a pure facing rotation within that plane: 0/180/360/540.
//    (For grooves both are already perpendicular, so the 90° locks cancel and the
//     NET rotation between them is 0/180/360 — not 90.)
//  • CROSS family (soul↔groove): the two stances are 90° apart in body orientation
//    (perpendicular vs parallel to the obstacle). So the minimum switch is a 90,
//    and you can add full half-turns on top: 90/270/450. A 90 is the tight "budget"
//    execution; 270 is the same switch done as a full body spin (Jim's Frontside→
//    Soul example — both land the same position, one via one-foot 90, one via 270).
// `min`/`max` still clip the menu to the user's Switch-Up Spin range.
const SOUL_DEGS  = [0, 180, 360, 540];
const CROSS_DEGS = [90, 270, 450];
function validSwitchDeg(prevFam, nextFam, min, max) {
  const sameFamily = prevFam === nextFam;
  const menu = sameFamily ? SOUL_DEGS : CROSS_DEGS;
  return menu.filter(d => d >= min && d <= max);
}

// STAGE 1 — DOUBLES ONLY. A switch-up is exactly two grinds: grind 1 (a normal
// grind with its own entry) and grind 2, reached by ONE transition. Per the
// positions-and-rotations model, grind 2's name is derived purely from that
// transition's rotation (degree + toward/away) — there is NO facing carried over
// from grind 1. (Triples are intentionally out of scope; an expert can extend by
// hand. Dropping them removes the need for any facing-propagation machinery.)
//
// Direction: toward the obstacle vs away/blind. For souls this reads AO (toward)
// vs Truespin (away). For grooves it reads Frontside (toward) vs Backside (away) —
// but FS/BS is already baked into which groove base/name is chosen, so a groove
// grind 2 is named by its position + degree, not an AO/True word.
function generateChain(F) {
  const { spins:SP } = F;
  // Grind 1: a normal generated grind, but it does NOT land (only grind 2 lands),
  // so zero its exit.
  const first = generateTrick(F);
  if(!first) return null;
  first.exit = { outDeg:0, rewind:false };

  // Grind 2: the grind we switch into.
  const base = generateTrick(F);
  if(!base) return null;
  const fam = base.fam;

  // Transition degree from the family-PAIR-aware menu (same-family 0/180/360,
  // cross-family soul↔groove 90/270/450), clipped to the user's Switch-Up range.
  const opts = validSwitchDeg(first.fam, fam, SP.suMin, SP.suMax);
  const suDeg = opts.length ? pick(opts) : (first.fam===fam ? 0 : 90);
  // toward (AO/Frontside) vs away/blind (Truespin/Backside). Random for variety;
  // if Truespin is OFF, only the toward direction is used.
  const away = SP.truespin ? (Math.random()<0.5) : false;
  const rewind = suDeg>0 && SP.suRewind>0 && roll(SP.suRewind);

  // Set grind 2's ENTRY so computeDisplay names it from the transition alone.
  // The transition's rotation determines the AO/Truespin/Fakie label — grind 1's
  // orientation is NOT an input (positions-and-rotations model). A rotation that
  // reverses you (soul 180/540) reads AO (toward) or Truespin (away); a bare lock
  // (soul 0 / groove 90) adds no rotation and names the grind plain.
  const soulFloor = 0, grooveFloor = 90;
  const addsRotation = fam==='soul' ? suDeg>0 : suDeg>grooveFloor;
  if(addsRotation) {
    const entryAway = fam==='soul' ? away : false;
    base.entry = { inDeg: suDeg, fakieIn:false, away: entryAway, top: base.entry.top };
  } else {
    base.entry = { inDeg: fam==='soul' ? soulFloor : grooveFloor, fakieIn:false, away:false, top: base.entry.top };
  }

  return { tricks: [first, base], transitions: [{ suDeg, away, rewind }] };
}

// The core name of a single grind WITHOUT its own exit/landing suffix — used for
// every grind in a chain (the chain applies one landing at the very end instead).
// Reuses computeDisplay, then strips the exit suffix it bakes into `main`.
function chainCoreName(t, specialFirst, detailed) {
  const full = computeDisplay(t, { specialFirst, detailed });
  if(!full) return { main:'', lead:null, trail:null, specialName:null, baseId:null };
  // computeDisplay appends the exit suffix to main; rebuild main from a zero-exit
  // clone so a chain grind never shows its own "180 out to fakie" mid-sequence.
  const noExit = { ...t, exit:{ outDeg:0, rewind:false } };
  const core = computeDisplay(noExit, { specialFirst, detailed });
  return { main:core.main, lead:core.lead, trail:core.trail, specialName:core.specialName, baseId:t.baseId };
}

// Final landing direction. Accumulate REAL rotation family-aware: each groove grind's
// Final landing direction for a DOUBLE. Sum grind 1's approach facing + each grind's
// real rotation + grind 2's exit spin. Groove grinds lock in at 90° for free (the 90
// doesn't rotate you), so a groove contributes (inDeg-90); souls contribute inDeg
// directly (including a cross-family 90/270 into a soul, which is real rotation).
function chainLanding(chain) {
  const { tricks } = chain;
  const approach = tricks[0].entry.fakieIn ? 1 : 0;
  let total = 0;
  tricks.forEach(t => {
    total += t.fam==='groove' ? Math.max(0, t.entry.inDeg - 90) : t.entry.inDeg;
  });
  const last = tricks[tricks.length-1];
  total += last.exit.rewind ? (last.fam==='soul'?180:90) : last.exit.outDeg;
  const facing = (approach + Math.round(total/180)) % 2;
  return facing===0 ? 'to forward' : 'to fakie';
}

// Compose the full chain display. Each grind is named FULLY by computeDisplay —
// its entry now encodes the transition (degree + AO/Truespin direction), so the
// AO/True/half-cab label and any SPECIAL rename (Soyale, Kindgrind) appear directly
// in the grind's name. We just join the grind names with "to". Short form: no landing.
// Detailed: adds the final grind's exit degree and the landing direction.
function computeChainDisplay(chain, opts={}) {
  if(!chain || !chain.tricks || !chain.tricks.length) return null;
  const { specialFirst=true, detailed=false, spellBackside=true } = opts;
  const { tricks } = chain;
  const cores = tricks.map(t => chainCoreName(t, specialFirst, detailed));
  const parts = [];
  cores.forEach((c,i) => { parts.push(i>0 ? `to ${c.main}` : c.main); });
  // final grind's own exit spin degree (only in detailed) WITHOUT its stance — the single
  // authoritative landing comes from chainLanding, which accounts for all transitions too.
  if(detailed) {
    const last = tricks[tricks.length-1];
    if(last.exit.outDeg > 0) {
      if(last.exit.rewind) {
        const rd = last.fam==='soul' ? 180 : 270;
        parts.push(`${rd} rewind out`);
      } else {
        parts.push(`${last.exit.outDeg} out`);
      }
    }
    parts.push(chainLanding(chain));
  }
  let main = parts.join(' ');
  if(!spellBackside) main = main.replace(/\bBackside\b/g, 'BS');
  // per-grind lead/trail lines for the detail panel (one row per grind)
  const legs = cores.map((c,i) => ({ label:`Grind ${i+1}`, name:c.main, lead:c.lead, trail:c.trail, baseId:c.baseId, specialName:c.specialName }));
  return { main, legs };
}

// Stable identity for a chain — its short-form composed name.
function chainSignature(chain) {
  if(!chain) return null;
  const d = computeChainDisplay(chain, { specialFirst:true, detailed:false });
  return d ? JSON.stringify(d.main) : null;
}

// ══ FILTERS / DEFAULTS ═══════════════════════════════════════════════════════
// makeInitFilters(testMode): normal defaults when off (actual use), fully cranked
// when on (exercises every naming path — all grinds, all modifiers, full spins).
const makeInitFilters = (testMode = false) => {
  const tricks = {};
  const offByDefault = testMode
    ? new Set([])   // test mode: every base grind can generate
    : new Set([]);  // normal mode: every base grind can generate (all tricks enabled by default)
  BASE.forEach(b => { tricks[b.id] = !offByDefault.has(b.id); });
  if (testMode) {
    return {
      tricks, testMode:true,
      spins: { inMin:0, inMax:540, outMin:0, outMax:540, fakieIn:50, truespin:true, rewindOut:40, suMin:0, suMax:540, suRewind:40 },
      sliders: { switch:50, topside:50, negative:50, christ:40, antichrist:40, rough:50, tough:50 },
      hideLanded:false, practice:false, workOnly:false, specialFirst:true, switchUp:0, practiceScope:'all',
    };
  }
  return {
    tricks, testMode:false,
    spins: { inMin:0, inMax:270, outMin:0, outMax:270, fakieIn:10, truespin:true, rewindOut:10, suMin:0, suMax:180, suRewind:10 },
    sliders: { switch:5, topside:5, negative:5, christ:5, antichrist:5, rough:5, tough:5 },
    hideLanded:true, practice:false, workOnly:false, specialFirst:true, switchUp:0, practiceScope:'all',
  };
};

// ── Drill-scope segmented control (pure, node-testable) ──────────────────────
// Off-drill: two pills bound to `switchUp` (generation mode: Single / Switch Up).
// On-drill (Practice or Work-On Only): three pills bound to `practiceScope`
// ('single' | 'double' | 'all'), a FILTER over the saved pool. `switchUp` is
// never touched while drilling, so flipping drill off returns you to your last
// generation mode. The All pill simply doesn't exist off-drill (hidden).
const SEG_GEN   = [{ v:0, l:'Single' }, { v:2, l:'Switch Up' }];
const SEG_DRILL = [{ v:'single', l:'Single' }, { v:'double', l:'Switch Up' }, { v:'all', l:'All' }];
const segModel = (F) => {
  const drillOn = !!(F.practice || F.workOnly);
  return drillOn
    ? { drillOn, pills: SEG_DRILL, value: F.practiceScope }
    : { drillOn, pills: SEG_GEN,   value: F.switchUp };
};
const segApply = (F, v) => segModel(F).drillOn ? { ...F, practiceScope: v } : { ...F, switchUp: v };
// Turning a drill mode ON resets the scope filter to All (per spec); turning it
// off leaves everything else alone.
const drillToggle = (F, key, on) => on ? { ...F, [key]: true, practiceScope: 'all' } : { ...F, [key]: false };

// ── Drill pool builder (pure, node-testable) ────────────────────────────────
// Composes the replay pool for a drill mode. Source:
//   practice  → landed ∪ working
//   workonly  → working only
// Each saved entry is either a single ({trick}) or a chain ({chain, isChain}).
// `scope` filters that pool: 'single' keeps singles, 'double' keeps chains,
// 'all' keeps both. Legacy name-only entries (no trick and no chain) can't be
// replayed and are dropped. Deduped by sig (landed wins over a working dupe
// because landed is iterated first). Returns [{ v: entry, sig }] — v is the WHOLE
// entry so the consumer can branch entry.trick vs entry.chain when replaying.
function buildDrillPool(landed, working, mode, scope) {
  const source = mode === 'workonly' ? working : [...landed, ...working];
  const seen = new Set();
  const pool = [];
  for (const e of source) {
    const isChain = !!e.chain;
    const isSingle = !!e.trick;
    if (!isChain && !isSingle) continue;                 // legacy name-only — unplayable
    if (scope === 'single' && !isSingle) continue;
    if (scope === 'double' && !isChain) continue;
    if (seen.has(e.sig)) continue;                       // dedupe by signature
    seen.add(e.sig);
    pool.push({ v: e, sig: e.sig });
  }
  return pool;
}

// ══ PROGRESSION MODE ═════════════════════════════════════════════════════════
// A guided skill tree. Nodes = whole tricks (base id + flags); edges = unlock
// prerequisites. Reuses the live engine: a node's canonical NO-SPIN trick yields
// the SAME sig the generator produces for that base+flags, so landed is shared.
// (Pure logic below verified in isolation before wiring — see build notes.)

// Base tree — authored family by family (Jim). Parents use AND/OR GROUPS:
//   parents = list of AND-groups, OR'd together. [] = root.
//   OR:  [['a'],['b']]      AND: [['a','b']]      single: [['a']]
// Tiles = poses (base grind / topside / backside); spins (AO included) live in
// each pose's drawer, full-named. AO is a spin chip, not a tile — EXCEPT three
// topside+AO combos with real trick names (Kindgrind, Misfit, Cloudy Night),
// promoted to their own tiles below since a named trick buried in a drawer reads
// as confusing. True/Inspin/Outspin at those same spots have no special name, so
// they stay as drawer chips.
const AO_SPIN = { inDeg:180, fakieIn:false, away:false };
const PROG_NODES = [
  // ── SOUL ──
  { id:'makio',      base:'makio',      parents:[] },
  { id:'soul',       base:'soul',       parents:[] },
  { id:'mizu',       base:'mizu',       parents:[] },
  { id:'acid',       base:'acid',       parents:[['soul']] },
  { id:'xgrind',     base:'xgrind',     parents:[['soul']] },
  { id:'stubsoul',   base:'stubsoul',   parents:[['soul']] },
  { id:'pornstar',   base:'pornstar',   parents:[['mizu']] },
  { id:'mistrial',   base:'mistrial',   parents:[['mizu','acid'],['pornstar']] },  // (Mizu & Acid) or Pornstar
  { id:'torquesoul', base:'torquesoul', parents:[['soul'],['farv']] },             // Soul or Full Torque
  { id:'teakettle',  base:'teakettle',  parents:[['pornstar']] },
  { id:'hotdog',     base:'hotdog',     parents:[['soul']] },
  // topside tiles (pose hubs — drawer holds that pose's spins). Skip X-Grind & Hot Dog (no topside).
  { id:'fishbrain',    base:'makio',      flags:{ topside:true }, parents:[['makio']] },
  { id:'sweatstance',  base:'mizu',       flags:{ topside:true }, parents:[['mizu']] },
  { id:'overpuss',     base:'mistrial',   flags:{ topside:true }, parents:[['mistrial']] },
  { id:'sunnyday',     base:'pornstar',   flags:{ topside:true }, parents:[['pornstar']] },
  // named topside+AO combos, promoted out of their hub's drawer into their own tile
  { id:'kindgrind',    base:'mizu',       flags:{ topside:true }, spin:AO_SPIN, parents:[['mizu']] },
  { id:'misfit',       base:'mistrial',   flags:{ topside:true }, spin:AO_SPIN, parents:[['overpuss']] },
  { id:'cloudynight',  base:'pornstar',   flags:{ topside:true }, spin:AO_SPIN, parents:[['sunnyday']] },
  { id:'ts_soul',      base:'soul',       flags:{ topside:true }, parents:[['soul']] },
  { id:'ts_acid',      base:'acid',       flags:{ topside:true }, parents:[['acid']] },
  { id:'ts_torquesoul',base:'torquesoul', flags:{ topside:true }, parents:[['torquesoul']] },
  // ── GROOVE ──
  { id:'frontside',  base:'frontside',  parents:[] },
  { id:'backside',   base:'frontside',  flags:{ backside:true }, parents:[['frontside']] },  // Backside pose = its own tile + hub
  { id:'royale',     base:'royale',     parents:[['frontside']] },
  { id:'farv',       base:'farv',       parents:[['frontside']] },
  { id:'backslide',  base:'backslide',  parents:[['royale']] },
  { id:'torque_g',   base:'torque_g',   parents:[['farv']] },
  { id:'cabdriver',  base:'cabdriver',  parents:[['backslide'],['torque_g']] },    // Backslide or Torque
  { id:'unity',      base:'unity',      parents:[['pornstar']] },
  { id:'savannah',   base:'savannah',   parents:[['unity']] },                     // Savannah (its own base) ← Unity
  // backside tiles + hubs — each unlocks from its own base grind (do the base, unlock its backside)
  { id:'bs_backslide', base:'backslide', flags:{ backside:true }, parents:[['backslide']] },
  { id:'bs_farv',      base:'farv',      flags:{ backside:true }, parents:[['farv']] },
  { id:'bs_torque',    base:'torque_g',  flags:{ backside:true }, parents:[['torque_g']] },
  { id:'bs_unity',     base:'unity',     flags:{ backside:true }, parents:[['unity']] },
  { id:'bs_royale',    base:'royale',    flags:{ backside:true }, parents:[['royale']] },
  { id:'bs_cabdriver', base:'cabdriver', flags:{ backside:true }, parents:[['cabdriver']] },
  { id:'bs_ufo',       base:'ufo',       flags:{ backside:true }, parents:[['ufo']] },
  { id:'bs_tabernacle',base:'tabernacle',flags:{ backside:true }, parents:[['tabernacle']] },
  { id:'bs_darkslide', base:'darkslide', flags:{ backside:true }, parents:[['darkslide']] },
  { id:'bs_wheelbarrow',base:'wheelbarrow',flags:{ backside:true }, parents:[['wheelbarrow']] },
  { id:'bs_savannah',  base:'savannah',  flags:{ backside:true }, parents:[['savannah']] },
  { id:'ts_bynsoul',   base:'bynsoul',   flags:{ topside:true },  parents:[['bynsoul']] },  // Byn Soul takes topside (not backside — its flip is AO)
  { id:'ufo',        base:'ufo',        parents:[['frontside']] },
  { id:'fastslide',  base:'fastslide',  parents:[['frontside']] },
  { id:'pudslide',   base:'pudslide',   parents:[['frontside']] },
  { id:'tabernacle', base:'tabernacle', parents:[['acid','frontside']] },          // Acid and Frontside
  { id:'bynsoul',    base:'bynsoul',    parents:[['soul']] },
  { id:'darkslide',  base:'darkslide',  parents:[['acid','backslide']] },          // Acid and Backslide
  { id:'wheelbarrow',base:'wheelbarrow',parents:[['royale'],['backslide']] },      // Royale or Backslide
];
const PROG_BY_ID = Object.fromEntries(PROG_NODES.map(n => [n.id, n]));
// parent helpers for the group model
const progFlatParents = (n) => [...new Set(n.parents.flat())];

// node → canonical plain trick (verified: same sig as generator for this base+flags)
function progNodeTrick(node) {
  const base = BASE.find(b => b.id === node.base);
  const soul = base.fam === 'soul';
  const f = node.flags || {};
  // a node may carry an explicit spin (e.g. AO tile at 180°); else it's the plain base pose
  const e = node.spin
    ? { inDeg: node.spin.inDeg, fakieIn: node.spin.fakieIn, away: node.spin.away, top: !!f.topside }
    : { inDeg: soul ? 0 : 90, fakieIn: false, away: soul ? false : !!f.backside, top: !!f.topside };
  return {
    baseId: node.base, fam: base.fam,
    entry: e,
    mods:  { neg:!!f.negative, rough:!!f.rough, tough:!!f.tough, christ:!!f.christ, antichrist:!!f.antichrist, sw:!!f.switch },
    exit:  { outDeg: 0, rewind: false },
  };
}
const progFam  = (node) => (BASE.find(b => b.id === node.base) || {}).fam;
const progSig  = (node) => trickSignature(progNodeTrick(node));
// tile/footer label — abbreviate "Backside"→"BS" (decision 6); sig is unaffected
const progName = (node) => { const n = computeDisplay(progNodeTrick(node), { specialFirst:true, detailed:false, spellBackside:false }).main; return n === 'BS' ? 'Backside' : n; };
const progBog  = (node) => { const d = computeDisplay(progNodeTrick(node), { specialFirst:true, detailed:false }); return bogLink(node.base, d.specialName); };
// lead/trail foot positions for the detail footer (helps beginners see what each foot does)
const progLegs = (node) => { const d = computeDisplay(progNodeTrick(node), { specialFirst:true, detailed:false, spellBackside:true }); return { lead: d.lead, trail: d.trail }; };

// Tile glyphs (the 2-letter code shown on each tile). A naive "first 2 characters"
// collides badly whenever names share a prefix (Torque/Torque Soul both -> "TO";
// every "Topside X" -> "TO"; every "BS X" -> "BS" — 11-way collision). This assigns
// each node a candidate list (word-initials, last-word start, first+last-word
// initials, raw prefix, then any substring pair) and picks the first one not
// already claimed, walking nodes in a fixed order — deterministic, globally unique.
// Manual reservations for tiles where a specific abbreviation should win outright
// (checked before the auto-fill below, and excluded from anything else's candidate
// pool). Jim's forced picks, plus Misfit as a readability tweak (would otherwise
// fall through to "ISF" once Mistrial claims "MIS").
const PROG_GLYPH_OVERRIDES = {
  frontside:'FS', backside:'BS', ufo:'UFO', soul:'SOL', acid:'ACD', pornstar:'PRN',
  farv:'FTQ', backslide:'BSL', torque_g:'TRQ', torquesoul:'TQS', bynsoul:'BYN',
  fastslide:'FSL', sunnyday:'TP', ts_acid:'TA', wheelbarrow:'WB', cabdriver:'CAB',
  cloudynight:'ATP', teakettle:'TEA', hotdog:'HTD',
  darkslide:'DSL', ts_soul:'TS', misfit:'ATM', stubsoul:'SS',
  fishbrain:'FSH', bs_royale:'BRO', bs_ufo:'BFO', sweatstance:'SWT', kindgrind:'KND',
  bs_torque:'BTQ', bs_unity:'BUN', ts_bynsoul:'TBN', bs_wheelbarrow:'BWB',
  overpuss:'TM', bs_savannah:'BSV', bs_darkslide:'BDS', bs_tabernacle:'BTB',
};
function progComputeGlyphs(nodes) {
  const used = new Set(Object.values(PROG_GLYPH_OVERRIDES));
  const glyphs = { ...PROG_GLYPH_OVERRIDES };
  const words = (s) => s.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).filter(Boolean);
  nodes.forEach(n => {
    if (glyphs[n.id]) return;
    const name = progName(n); const w = words(name);
    const candidates = [];
    if (w.length >= 3) candidates.push((w[0][0] + w[1][0] + w[2][0]).toUpperCase());              // 3-word initials
    if (w.length === 2) candidates.push((w[0].slice(0, 2) + w[1][0]).toUpperCase());              // first2 + initial
    if (w.length === 2) candidates.push((w[0][0] + w[1].slice(0, 2)).toUpperCase());              // initial + first2
    if (w.length === 1) candidates.push(w[0].slice(0, 3).toUpperCase());                          // first 3 of the one word
    candidates.push(name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase());                    // raw prefix fallback
    const compact = name.replace(/[^A-Za-z]/g, '').toUpperCase();
    for (let i = 0; i < compact.length - 2; i++) candidates.push(compact[i] + compact[i+1] + compact[i+2]);
    let picked = candidates.find(c => c.length === 3 && !used.has(c));
    if (!picked) picked = (name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'XX') + used.size;
    used.add(picked); glyphs[n.id] = picked;
  });
  return glyphs;
}
const PROG_GLYPHS = progComputeGlyphs(PROG_NODES);
// a full landed-list entry synthesised from a node (same shape the generator writes)
const progEntry = (node) => {
  const d = computeDisplay(progNodeTrick(node), { specialFirst:true, detailed:false, spellBackside:false });
  return { sig: progSig(node), display: d.main, lead: d.lead, trail: d.trail, at: Date.now(), trick: progNodeTrick(node) };
};

// tier = longest path from any root (so a node sits below ALL its parents)
// ── hand-authored layout (Jim's worksheet) ────────────────────────────────────
// Coach-designed 11-row curriculum (all 49 tiles pinned; left→right = easiest→
// riskiest within each row). Difficulty from community consensus (SkaMiDan tiers,
// Book of Grinds, ZeroGravity) + Jim's coaching principles:
//  · Buck Factor — frontside Torque/Full Torque are toe-catch risky on ledges, so
//    they sit late/right; their backsides are EASIER locks and come right after.
//  · Lock difficulty over "blindness" — BS Torque/BS Full Torque/BS Cab Driver are
//    front-foot, full-view, low-commit (early); BS Backslide is back-foot,
//    rotate-and-commit (late, advanced per SkaMiDan).
//  · Fastslide/Pudslide are friction slides, not locked grinds — SkaMiDan hardest
//    tier, so they live at row 10 despite unlocking off Frontside.
//  · Stability before contortion; topsides gate through the two-footed Topside
//    Soul / Topside Acid (row 6) — Fishbrain's one-foot topside is more commit,
//    so it comes after (row 7), per Jim.
const PROG_ROWS = [
  ['makio', 'frontside'],
  ['soul', 'backside', 'mizu', 'ufo', 'royale'],
  ['acid', 'xgrind', 'pornstar', 'bs_ufo', 'bs_royale'],
  ['mistrial', 'bynsoul', 'unity', 'backslide', 'farv', 'hotdog'],
  ['torquesoul', 'ts_bynsoul', 'bs_unity', 'torque_g', 'bs_farv', 'stubsoul'],
  ['ts_torquesoul', 'ts_soul', 'ts_acid', 'bs_torque', 'cabdriver', 'sunnyday', 'kindgrind'],
  ['savannah', 'wheelbarrow', 'teakettle', 'tabernacle', 'bs_cabdriver', 'overpuss', 'sweatstance'],
  ['bs_savannah', 'bs_wheelbarrow', 'fishbrain', 'bs_tabernacle', 'cloudynight', 'misfit', 'bs_backslide'],
  ['darkslide', 'fastslide'],
  ['bs_darkslide', 'pudslide'],
];
const PROG_PINNED_TIER = {};
const PROG_PINNED_ORDER = {};
PROG_ROWS.forEach((row, t) => row.forEach((id, i) => { PROG_PINNED_TIER[id] = t; PROG_PINNED_ORDER[id] = i; }));

function progTiers(nodes) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const memo = {};
  const tier = (id) => {
    if (memo[id] != null) return memo[id];
    if (PROG_PINNED_TIER[id] != null) { memo[id] = PROG_PINNED_TIER[id]; return memo[id]; }
    const p = progFlatParents(byId[id]);
    memo[id] = p.length === 0 ? 0 : 1 + Math.max(...p.map(tier));
    return memo[id];
  };
  return Object.fromEntries(nodes.map(n => [n.id, tier(n.id)]));
}

const PROG_TILE = 56;
const PROG_MINGAP = 80;        // min center-to-center within a tier
const PROG_TIER_Y0 = 42, PROG_TIER_GAP = 132;

function progLayoutX(nodes, tiers) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const maxTier = Math.max(...Object.values(tiers));
  const rows = Array.from({ length: maxTier + 1 }, () => []);
  nodes.forEach(n => rows[tiers[n.id]].push(n.id));

  // pinned nodes keep Jim's explicit left-to-right order; any auto-attached
  // (derived) tile sharing that tier is appended after them, alphabetically —
  // position among those doesn't matter, per the worksheet.
  const x = {};
  const LEFT = PROG_TILE / 2 + 8;
  for (let t = 0; t <= maxTier; t++) {
    const pinned = rows[t].filter(id => PROG_PINNED_TIER[id] === t).sort((a, b) => PROG_PINNED_ORDER[a] - PROG_PINNED_ORDER[b]);
    const auto = rows[t].filter(id => PROG_PINNED_TIER[id] !== t).sort((a, b) => progName(byId[a]).localeCompare(progName(byId[b])));
    [...pinned, ...auto].forEach((id, i) => { x[id] = LEFT + i * PROG_MINGAP; });
  }
  return x;
}

// ── state (landedIds/skippedIds are NODE ids) ─────────────────────────────────
// unlock = DNF: any AND-group fully landed (parents = OR of AND-groups)
const progUnlocked = (node, landedIds) =>
  node.parents.length === 0 || node.parents.some(grp => grp.every(p => landedIds.has(p)));
const progStateOf = (node, landedIds, skippedIds) =>
  landedIds.has(node.id) ? 'landed'
  : skippedIds.has(node.id) ? 'skipped'
  : progUnlocked(node, landedIds) ? 'available' : 'locked';
const progDone = (nodes, landedIds, skippedIds) =>
  nodes.every(n => landedIds.has(n.id) || skippedIds.has(n.id));
const progCanSkip = (node) => node.parents.length > 0;   // roots can't be skipped

// reachability fixpoint (landed seed reachable) → how many tricks a skip strands
function progReachWith(nodes, landedIds, skippedIds, extraSkip) {
  const sk = new Set([...skippedIds, ...(extraSkip ? [extraSkip] : [])]);
  const reach = {};
  nodes.forEach(n => { reach[n.id] = landedIds.has(n.id); });
  for (let i = 0; i <= nodes.length; i++) {
    nodes.forEach(n => {
      if (reach[n.id] || sk.has(n.id)) return;
      const ok = n.parents.length === 0 ? true : n.parents.some(grp => grp.every(p => reach[p]));
      if (ok) reach[n.id] = true;
    });
  }
  return reach;
}
function progStrandedBy(nodes, landedIds, skippedIds, id) {
  const before = progReachWith(nodes, landedIds, skippedIds, null);
  const after  = progReachWith(nodes, landedIds, skippedIds, id);
  return nodes.filter(n => n.id !== id && !landedIds.has(n.id) && before[n.id] && !after[n.id]).length;
}

// ── SPIN LAYER (drawer chips, full-named) ─────────────────────────────────────
// Tiles are poses (base / topside / backside); each pose's drawer holds its spins.
// Souls: Zero, AO, True, Inspin, Outspin, 360, Fakie 360 (topside hub applies top).
// Grooves: split by landed facing — a base grind with a Backside tile shows its
// frontside-facing spins; the Backside tile shows the backside-facing ones.
// Chips share the landed sig with the generator, exactly like tiles.
const SOUL_SPINS = [
  { key:'zero',   label:'Zero',      inDeg:0,   fakieIn:true,  away:false },
  { key:'ao',     label:'AO',        inDeg:180, fakieIn:false, away:false },
  { key:'true',   label:'True',      inDeg:180, fakieIn:false, away:true  },
  { key:'in',     label:'Inspin',    inDeg:180, fakieIn:true,  away:false },
  { key:'out',    label:'Outspin',   inDeg:180, fakieIn:true,  away:true  },
  { key:'360',    label:'360',       inDeg:360, fakieIn:false, away:false },
  { key:'f360',   label:'Fakie 360', inDeg:360, fakieIn:true,  away:false },
];
const GROOVE_SPINS = [
  { key:'zero',      label:'Zero',          inDeg:90,  fakieIn:true,  away:false, facing:'frontside' },
  { key:'right',     label:'Backside',      inDeg:90,  fakieIn:false, away:true,  facing:'backside'  },
  { key:'zeroright', label:'Zero Backside', inDeg:90,  fakieIn:true,  away:true,  facing:'backside'  },
  { key:'270a',      label:'270',           inDeg:270, fakieIn:false, away:false, facing:'backside'  },
  { key:'270b',      label:'270',           inDeg:270, fakieIn:false, away:true,  facing:'frontside' },
  { key:'270c',      label:'Fakie 270',     inDeg:270, fakieIn:true,  away:false, facing:'backside'  },
  { key:'270d',      label:'Fakie 270',     inDeg:270, fakieIn:true,  away:true,  facing:'frontside' },
];
function spinTrick(baseId, s, top=false) {
  const b = BASE.find(x => x.id === baseId);
  return { baseId, fam:b.fam,
    entry:{ inDeg:s.inDeg, fakieIn:s.fakieIn, away:s.away, top:!!top },
    mods:{ neg:false, rough:false, tough:false, christ:false, antichrist:false, sw:false },
    exit:{ outDeg:0, rewind:false } };
}
const spinSig  = (baseId, s, top=false) => trickSignature(spinTrick(baseId, s, top));
const spinName = (baseId, s, top=false) => computeDisplay(spinTrick(baseId, s, top), { specialFirst:true, detailed:false, spellBackside:true }).main;
const spinBog  = (baseId, s, top=false) => { const d = computeDisplay(spinTrick(baseId, s, top), { specialFirst:true, detailed:false }); return bogLink(baseId, d.specialName); };
const spinEntry = (baseId, s, top=false) => {
  const d = computeDisplay(spinTrick(baseId, s, top), { specialFirst:true, detailed:false, spellBackside:true });
  return { sig: spinSig(baseId, s, top), display: d.main, lead: d.lead, trail: d.trail, at: Date.now(), trick: spinTrick(baseId, s, top) };
};
// each pose-tile is a spin hub. Returns the spin configs for a node's drawer.
const spinsForNode = (node) => {
  const flags = node.flags || {};
  if (node.spin) return [];
  if (flags.topside) {                                                              // topside hub (chips rendered with top:true)
    const set = progFam(node) === 'soul' ? SOUL_SPINS : GROOVE_SPINS;                // groove bases (Byn Soul) use groove spins
    const hasAoTile = PROG_NODES.some(n => n.spin && n.base === node.base && n.flags && n.flags.topside);
    return hasAoTile ? set.filter(s => s.key !== 'ao') : set;                        // AO promoted to its own tile (Kindgrind/Misfit/Cloudy Night) — no duplicate chip
  }
  if (flags.backside) return GROOVE_SPINS.filter(s => s.facing === 'backside' && s.key !== 'right'); // backside hub (minus the plain Backside = the tile)
  if (Object.keys(flags).length) return [];
  if (progFam(node) === 'soul') return SOUL_SPINS;                                   // base soul: all soul spins (AO included)
  const hasBsTile = PROG_NODES.some(n => n.flags && n.flags.backside && n.base === node.base);
  return hasBsTile ? GROOVE_SPINS.filter(s => s.facing === 'frontside') : GROOVE_SPINS; // base groove: frontside-facing if it has a Backside tile, else all
};
// is this node's drawer a topside hub? (chips need the topside pose)
const nodeDrawerTop = (node) => !!(node.flags && node.flags.topside);

// ── VARIATIONS LAYER (drawer chips, above Spins) ──────────────────────────────
// Single-modifier variations of a pose: Switch, Negative, Christ, Antichrist,
// Rough, Tough. One modifier per chip (not stacked), same shared-sig pattern as
// spins. Eligibility mirrors the generator's validity rules exactly (NEG_OK/
// RT_OK/noNeg/noRT/!topside for neg+rough+tough; isSingleFoot for christ/anti —
// no topside guard there, matching the engine) so a chip never lands a sig the
// generator itself couldn't produce.
const MOD_DEFS = [
  { key:'sw',         label:'Switch' },
  { key:'neg',        label:'Negative' },
  { key:'christ',     label:'Christ' },
  { key:'antichrist', label:'Anti Christ' },
  { key:'rough',      label:'Rough' },
  { key:'tough',      label:'Tough' },
];
function modTrick(node, key) {
  const base = BASE.find(x => x.id === node.base);
  const soul = base.fam === 'soul';
  const f = node.flags || {};
  return { baseId: node.base, fam: base.fam,
    entry:{ inDeg: soul ? 0 : 90, fakieIn:false, away: soul ? false : !!f.backside, top: !!f.topside },
    mods:{ neg:key==='neg', rough:key==='rough', tough:key==='tough', christ:key==='christ', antichrist:key==='antichrist', sw:key==='sw' },
    exit:{ outDeg:0, rewind:false } };
}
const modSig  = (node, key) => trickSignature(modTrick(node, key));
const modName = (node, key) => computeDisplay(modTrick(node, key), { specialFirst:true, detailed:false, spellBackside:true }).main;
const modEntry = (node, key) => {
  const d = computeDisplay(modTrick(node, key), { specialFirst:true, detailed:false, spellBackside:true });
  return { sig: modSig(node, key), display: d.main, lead: d.lead, trail: d.trail, at: Date.now(), trick: modTrick(node, key) };
};
const modsForNode = (node) => {
  if (node.spin) return [];
  const base = BASE.find(x => x.id === node.base);
  const top = !!(node.flags && node.flags.topside);
  const out = [MOD_DEFS[0]]; // Switch — always legal
  if (NEG_OK.has(node.base) && !base.noNeg && !top) out.push(MOD_DEFS[1]);
  if (isSingleFoot(base)) out.push(MOD_DEFS[2], MOD_DEFS[3]);
  if (RT_OK.has(node.base) && !base.noRT && !top) out.push(MOD_DEFS[4], MOD_DEFS[5]);
  return out;
};

const nameFontSize = (name='') => {
  const n = name.length;
  if(n<=4) return '84px'; if(n<=6) return '72px'; if(n<=9) return '58px';
  if(n<=13) return '46px'; if(n<=18) return '38px'; if(n<=26) return '30px';
  if(n<=36) return '24px'; if(n<=48) return '19px'; return '16px';
};
const fmtDate = (ts) => {
  const d=new Date(ts), now=new Date(), diff=Math.floor((now-d)/86400000);
  if(diff===0) return 'Today'; if(diff===1) return 'Yesterday';
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
};

// ═══════════════════════════════════════════════════════════════════════════
// NATIVE BRIDGE (iOS) — appended below the untouched engine slice.
// Everything above this line is byte-identical to rb-trick-gen-v3_05.jsx
// lines 3–1202. Everything below is the Swift↔JS boundary: each function
// takes and returns JSON strings. Swift owns persistence and UI; this layer
// owns engine calls AND the list-mutation invariants (landed/working/skipped
// exclusivity), ported verbatim from the web App() handlers.
// ═══════════════════════════════════════════════════════════════════════════

function __parse(s, fallback) { try { return s == null ? fallback : JSON.parse(s); } catch (e) { return fallback; } }

// ── filters ──────────────────────────────────────────────────────────────────
function nativeDefaultFilters() { return JSON.stringify(makeInitFilters(false)); }

// merge saved filters over defaults — mirrors the web app's rbrg_filters load
// (spread + nested tricks/spins/sliders merges), so partial/older saves are safe.
function nativeMergeFilters(savedJSON) {
  const prev = makeInitFilters(false);
  const f = __parse(savedJSON, null);
  if (!f) return JSON.stringify(prev);
  const merged = { ...prev, ...f,
    tricks:  { ...prev.tricks,  ...(f.tricks  || {}) },
    spins:   { ...prev.spins,   ...(f.spins   || {}) },
    sliders: { ...prev.sliders, ...(f.sliders || {}) } };
  return JSON.stringify(merged);
}

// ── display ──────────────────────────────────────────────────────────────────
function __displayFor(trick, chain, specialFirst, detailed) {
  if (chain) {
    const d = computeChainDisplay(chain, { specialFirst, detailed, spellBackside: detailed });
    return { main: d.main, sub: null, lead: null, trail: null, specialName: null,
             legs: d.legs.map(l => ({ label: l.label, name: l.name, lead: l.lead, trail: l.trail,
                                      bog: bogLink(l.baseId, l.specialName) })) };
  }
  const d = computeDisplay(trick, { specialFirst, detailed, spellBackside: detailed });
  return { main: d.main, sub: d.sub, lead: d.lead, trail: d.trail,
           specialName: d.specialName, legs: null, bog: bogLink(trick.baseId, d.specialName) };
}

function __result(trick, chain, filters) {
  const sig = chain ? chainSignature(chain) : trickSignature(trick);
  return JSON.stringify({
    status: 'ok', isChain: !!chain, trick: trick || null, chain: chain || null, sig,
    displayShort:    __displayFor(trick, chain, filters.specialFirst, false),
    displayDetailed: __displayFor(trick, chain, filters.specialFirst, true),
  });
}

// ── generate — full port of the web App() generate() decision flow ───────────
// payload: { filters, landed, working, skipped, currentSig?, extraSkipSig? }
// returns: { status:'ok', ... } | { status:'empty', emptyKey }
function nativeGenerate(payloadJSON) {
  const P = __parse(payloadJSON, {});
  const filters = P.filters;
  const landed = P.landed || [], working = P.working || [], skipped = P.skipped || [];
  const currentSig = P.currentSig || null;
  const extraSkipSig = P.extraSkipSig || null;

  // "any base enabled?" guard (non-drill only)
  if (!filters.workOnly && !filters.practice) {
    const enabled = BASE.filter(b => {
      if (filters.tricks[b.id] === false) return false;
      if (b.gate && filters.sliders[b.gate] <= 0) return false;
      if (validInDeg(b.fam, filters.spins.inMin, filters.spins.inMax).length === 0) return false;
      return true;
    });
    if (!enabled.length) return JSON.stringify({ status: 'empty', emptyKey: 'disabled' });
  }

  // skipped ("too hard") tricks are always excluded from generation
  const skipSigs = new Set(skipped.map(l => l.sig));
  if (extraSkipSig) skipSigs.add(extraSkipSig);
  const pickAvoidingCurrent = (pairs) => {
    if (!pairs.length) return null;
    const others = currentSig ? pairs.filter(p => p.sig !== currentSig) : pairs;
    const pool = others.length ? others : pairs;   // if current was the only one, keep it
    return pool[Math.floor(Math.random() * pool.length)].v;
  };

  // DRILL MODES (Work-On Only, Practice) — replay saved pool, filters ignored
  if (filters.workOnly || filters.practice) {
    const mode = filters.workOnly ? 'workonly' : 'practice';
    const pool = buildDrillPool(landed, working, mode, filters.practiceScope);
    const emptyKey = (mode === 'workonly' ? 'workonly-empty' : 'practice-empty')
      + (filters.practiceScope === 'double' ? '-double' : '');
    if (!pool.length) return JSON.stringify({ status: 'empty', emptyKey });
    const entry = pickAvoidingCurrent(pool);
    if (!entry) return JSON.stringify({ status: 'empty', emptyKey });
    if (entry.chain) return __result(null, entry.chain, filters);
    return __result(entry.trick, null, filters);
  }

  // SWITCH-UP MODE — fresh 2-grind chain; avoid repeating the current one
  if (filters.switchUp === 2) {
    let ch = generateChain(filters);
    let tries = 0;
    while (ch && currentSig && chainSignature(ch) === currentSig && tries < 40) { ch = generateChain(filters); tries++; }
    if (!ch) return JSON.stringify({ status: 'empty', emptyKey: 'disabled' });
    return __result(null, ch, filters);
  }

  // SINGLES
  let t;
  if (filters.hideLanded) {
    const landedSigs = new Set(landed.map(l => l.sig));
    const bad2 = (x) => { const s = trickSignature(x); return landedSigs.has(s) || skipSigs.has(s) || (currentSig && s === currentSig); };
    let tt = generateTrick(filters);
    let tries2 = 0;
    while (tt && bad2(tt) && tries2 < 400) { tt = generateTrick(filters); tries2++; }
    if (tt && !bad2(tt)) {
      t = tt;
    } else {
      const unlanded = enumerateVariants(filters)
        .map(v => ({ v, sig: trickSignature(v) }))
        .filter(p => !landedSigs.has(p.sig) && !skipSigs.has(p.sig));
      if (!unlanded.length) return JSON.stringify({ status: 'empty', emptyKey: 'complete' });
      t = pickAvoidingCurrent(unlanded);
    }
  } else {
    const bad = (x) => { const s = trickSignature(x); return skipSigs.has(s) || (currentSig && s === currentSig); };
    t = generateTrick(filters);
    let tries = 0;
    while (t && bad(t) && tries < 60) { t = generateTrick(filters); tries++; }
    if (t && bad(t)) {
      const avail = enumerateVariants(filters)
        .map(v => ({ v, sig: trickSignature(v) }))
        .filter(p => !skipSigs.has(p.sig));
      t = pickAvoidingCurrent(avail);
    }
  }
  if (!t) return JSON.stringify({ status: 'empty', emptyKey: 'complete' });
  return __result(t, null, filters);
}

// re-display an existing result (detail toggle / specialFirst change re-render)
function nativeRedisplay(payloadJSON) {
  const P = __parse(payloadJSON, {});
  return __result(P.trick || null, P.chain || null, P.filters);
}

// ── generator list actions — mirror toggleLanded/toggleWorking/skipTrick ─────
// entry shape matches web makeEntry(): chains store {chain,isChain}; singles {trick}.
// `detailed` picks which display string is stamped, matching the web app (curMain
// reflects the on-screen display mode).
function __genEntry(result, detailed) {
  const d = detailed ? result.displayDetailed : result.displayShort;
  if (result.isChain) return { sig: result.sig, display: d.main, lead: null, trail: null, at: Date.now(), chain: result.chain, isChain: true };
  return { sig: result.sig, display: d.main, lead: d.lead, trail: d.trail, at: Date.now(), trick: result.trick };
}

function nativeToggleLanded(payloadJSON) {
  const P = __parse(payloadJSON, {});
  let landed = P.lists.landed || [], working = P.lists.working || [], skipped = P.lists.skipped || [];
  const sig = P.result.sig;
  if (landed.some(l => l.sig === sig)) {
    landed = landed.filter(l => l.sig !== sig);
  } else {
    landed = [...landed, __genEntry(P.result, !!P.detailed)];
    working = working.filter(l => l.sig !== sig);
    skipped = skipped.filter(l => l.sig !== sig);
  }
  return JSON.stringify({ landed, working, skipped });
}

function nativeToggleWorking(payloadJSON) {
  const P = __parse(payloadJSON, {});
  let landed = P.lists.landed || [], working = P.lists.working || [], skipped = P.lists.skipped || [];
  const sig = P.result.sig;
  if (working.some(l => l.sig === sig)) {
    working = working.filter(l => l.sig !== sig);
  } else {
    working = [...working, __genEntry(P.result, !!P.detailed)];
    landed = landed.filter(l => l.sig !== sig);
    skipped = skipped.filter(l => l.sig !== sig);
  }
  return JSON.stringify({ landed, working, skipped });
}

// "Too hard" — record skip (singles only; chains record nothing), clear other states.
function nativeSkipTrick(payloadJSON) {
  const P = __parse(payloadJSON, {});
  let landed = P.lists.landed || [], working = P.lists.working || [], skipped = P.lists.skipped || [];
  const sig = P.result.sig;
  if (!P.result.isChain) {
    if (!skipped.some(s => s.sig === sig)) {
      const d = P.detailed ? P.result.displayDetailed : P.result.displayShort;
      skipped = [...skipped, { sig, display: d.main, lead: d.lead, trail: d.trail, at: Date.now() }];
    }
    landed = landed.filter(l => l.sig !== sig);
    working = working.filter(l => l.sig !== sig);
  }
  return JSON.stringify({ landed, working, skipped });
}

// remove an entry by sig from one list ('landed' | 'working' | 'skipped')
function nativeRemoveBySig(payloadJSON) {
  const P = __parse(payloadJSON, {});
  const lists = { landed: P.lists.landed || [], working: P.lists.working || [], skipped: P.lists.skipped || [] };
  if (lists[P.which]) lists[P.which] = lists[P.which].filter(l => l.sig !== P.sig);
  return JSON.stringify(lists);
}

// ── progression: static tree (compute once) ──────────────────────────────────
function nativeProgTree() {
  const tiers = progTiers(PROG_NODES);
  const xs = progLayoutX(PROG_NODES, tiers);
  const maxTier = Math.max(...Object.values(tiers));
  const nodes = PROG_NODES.map(n => ({
    id: n.id, base: n.base, fam: progFam(n),
    name: progName(n), glyph: PROG_GLYPHS[n.id], sig: progSig(n),
    x: xs[n.id], y: PROG_TIER_Y0 + tiers[n.id] * PROG_TIER_GAP, tier: tiers[n.id],
    parents: n.parents, parentsFlat: progFlatParents(n),
    parentNames: n.parents.map(grp => grp.map(pid => progName(PROG_BY_ID[pid]))),
    canSkip: progCanSkip(n), isSpinTile: !!n.spin,
    legs: progLegs(n), bog: progBog(n),
  }));
  const canvasW = Math.max(...nodes.map(n => n.x)) + PROG_TILE / 2 + 24;
  const canvasH = PROG_TIER_Y0 + maxTier * PROG_TIER_GAP + PROG_TILE + 46;
  return JSON.stringify({ nodes, canvasW, canvasH,
    tile: PROG_TILE, minGap: PROG_MINGAP, tierY0: PROG_TIER_Y0, tierGap: PROG_TIER_GAP, colors: C });
}

// ── progression: dynamic state from persisted lists ──────────────────────────
// payload: { landed:[entries], progSkip:[nodeIds] }
function nativeProgState(payloadJSON) {
  const P = __parse(payloadJSON, {});
  const landedSigSet = new Set((P.landed || []).map(l => l.sig));
  const landedIds = new Set(PROG_NODES.filter(n => landedSigSet.has(progSig(n))).map(n => n.id));
  const skipSet = new Set(P.progSkip || []);
  const states = {};
  PROG_NODES.forEach(n => { states[n.id] = progStateOf(n, landedIds, skipSet); });
  return JSON.stringify({ states, allDone: progDone(PROG_NODES, landedIds, skipSet), landedIds: [...landedIds] });
}

// skip-confirm helper: how many unlanded tricks skipping this node would strand
function nativeProgStranded(payloadJSON) {
  const P = __parse(payloadJSON, {});
  const landedSigSet = new Set((P.landed || []).map(l => l.sig));
  const landedIds = new Set(PROG_NODES.filter(n => landedSigSet.has(progSig(n))).map(n => n.id));
  const skipSet = new Set(P.progSkip || []);
  return JSON.stringify({ stranded: progStrandedBy(PROG_NODES, landedIds, skipSet, P.id) });
}

// drawer content for one node: spin chips + variation chips, with landed flags
// payload: { id, landed:[entries] }
function nativeProgDrawer(payloadJSON) {
  const P = __parse(payloadJSON, {});
  const node = PROG_BY_ID[P.id];
  if (!node) return JSON.stringify({ spins: [], mods: [] });
  const landedSigSet = new Set((P.landed || []).map(l => l.sig));
  const top = nodeDrawerTop(node);
  const spins = spinsForNode(node).map(s => {
    const sig = spinSig(node.base, s, top);
    return { key: s.key, label: s.label, name: spinName(node.base, s, top), sig,
             landed: landedSigSet.has(sig), bog: spinBog(node.base, s, top) };
  });
  const mods = modsForNode(node).map(m => {
    const sig = modSig(node, m.key);
    return { key: m.key, label: m.label, name: modName(node, m.key), sig, landed: landedSigSet.has(sig) };
  });
  return JSON.stringify({ spins, mods });
}

// progression actions — mirror progMarkLanded/progUnmark/progDoSkip/progUnskip/
// progMarkSpin/progUnmarkSpin/progMarkMod/progUnmarkMod, preserving the
// exclusive-state invariant (landing clears working + too-hard for that sig).
// payload: { action, id, spinKey?, modKey?, lists:{landed,working,skipped}, progSkip:[] }
function nativeProgAction(payloadJSON) {
  const P = __parse(payloadJSON, {});
  let landed = (P.lists && P.lists.landed) || [], working = (P.lists && P.lists.working) || [], skipped = (P.lists && P.lists.skipped) || [];
  let progSkip = P.progSkip || [];
  const node = PROG_BY_ID[P.id];
  if (!node) return JSON.stringify({ landed, working, skipped, progSkip });
  const top = nodeDrawerTop(node);
  const findSpin = (key) => spinsForNode(node).find(s => s.key === key);
  const addShared = (sig, entry) => {
    if (landed.some(l => l.sig === sig)) return;
    landed = [...landed, entry];
    working = working.filter(l => l.sig !== sig);
    skipped = skipped.filter(l => l.sig !== sig);
  };
  const removeShared = (sig) => { landed = landed.filter(l => l.sig !== sig); };
  switch (P.action) {
    case 'markLanded': addShared(progSig(node), progEntry(node)); break;
    case 'unmark':     removeShared(progSig(node)); break;
    case 'skip':       if (progCanSkip(node) && !progSkip.includes(node.id)) progSkip = [...progSkip, node.id]; break;
    case 'unskip':     progSkip = progSkip.filter(id => id !== node.id); break;
    case 'markSpin':   { const s = findSpin(P.spinKey); if (s) addShared(spinSig(node.base, s, top), spinEntry(node.base, s, top)); break; }
    case 'unmarkSpin': { const s = findSpin(P.spinKey); if (s) removeShared(spinSig(node.base, s, top)); break; }
    case 'markMod':    addShared(modSig(node, P.modKey), modEntry(node, P.modKey)); break;
    case 'unmarkMod':  removeShared(modSig(node, P.modKey)); break;
  }
  return JSON.stringify({ landed, working, skipped, progSkip });
}

// ── theme + misc ──────────────────────────────────────────────────────────────
function nativeTheme() { return JSON.stringify({ colors: C }); }
function nativeNameFontSize(name) { return parseInt(nameFontSize(name || ''), 10); }

// ── self-test — Phase 1 milestone evidence + regression harness ──────────────
function nativeSelfTest() {
  const out = { pass: true, checks: [], tiles: [], samples: [] };
  const ok = (name, cond, extra) => { out.checks.push({ name, pass: !!cond, extra: extra === undefined ? null : extra }); if (!cond) out.pass = false; };

  // 1) generator produces named tricks at default filters
  const F = makeInitFilters(false);
  const names = [];
  for (let i = 0; i < 50; i++) { const d = computeDisplay(generateTrick(F), { specialFirst: true, detailed: false }); names.push(d.main); }
  ok('generator-names-nonempty', names.every(n => typeof n === 'string' && n.length > 0));
  out.samples = names.slice(0, 8);

  // 2) Switch at 100% forces Switch on every result
  const F2 = makeInitFilters(false); F2.sliders = { ...F2.sliders, switch: 100 };
  let allSw = true;
  for (let i = 0; i < 300; i++) { const d = computeDisplay(generateTrick(F2), { specialFirst: true, detailed: false }); if (!/^Switch\b/.test(d.main)) { allSw = false; break; } }
  ok('switch-100-forces-switch', allSw);

  // 3) tree shape: 49 nodes, 10 rows, every node pinned
  ok('node-count-49', PROG_NODES.length === 49, PROG_NODES.length);
  ok('rows-10', PROG_ROWS.length === 10, PROG_ROWS.length);
  ok('rows-cover-all-49', PROG_ROWS.flat().length === PROG_NODES.length && PROG_NODES.every(n => PROG_PINNED_TIER[n.id] != null));

  // 4) zero sig / glyph collisions
  const sigs = PROG_NODES.map(progSig);
  ok('sigs-unique', new Set(sigs).size === sigs.length);
  const gl = PROG_NODES.map(n => PROG_GLYPHS[n.id]);
  ok('glyphs-unique', new Set(gl).size === gl.length);

  // 5) empty state: exactly the four roots available, everything else locked
  const empty = new Set();
  const roots = PROG_NODES.filter(n => n.parents.length === 0).map(n => n.id).sort();
  ok('roots-are-4', JSON.stringify(roots) === JSON.stringify(['frontside', 'makio', 'mizu', 'soul']), roots);
  ok('roots-available', roots.every(r => progStateOf(PROG_BY_ID[r], empty, empty) === 'available'));
  ok('nonroots-locked', PROG_NODES.filter(n => n.parents.length > 0).every(n => progStateOf(n, empty, empty) === 'locked'));

  // 6) unlock propagation: landing makio unlocks fishbrain
  ok('makio-unlocks-fishbrain', progStateOf(PROG_BY_ID['fishbrain'], new Set(['makio']), empty) === 'available');

  // 7) shared-sig invariant: prog tile sig === generator sig for the same trick
  ok('prog-sig-matches-engine', progSig(PROG_BY_ID['makio']) === trickSignature(progNodeTrick(PROG_BY_ID['makio'])));

  // 8) full tile listing (milestone evidence)
  const tiers = progTiers(PROG_NODES);
  out.tiles = PROG_NODES
    .map(n => ({ id: n.id, name: progName(n), glyph: PROG_GLYPHS[n.id], row: tiers[n.id] }))
    .sort((a, b) => a.row - b.row || a.name.localeCompare(b.name));
  return JSON.stringify(out);
}
