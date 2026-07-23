import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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
  // Byn Soul's own 4-slot plate table (forward / topside / AO-reversed /
  // AO-reversed+topside) — confirmed with Jim; NOT derivable from a lead/
  // trail swap the way real souls' AO plates are (see computeDisplay).
  // Zero and Truespin land on the bsLead/bsTrail (or bsTopLead/bsTopTrail)
  // pair too — they're landsFakie states just like AO. Inspin/Outspin land
  // forward-facing (landsFakie false), so they use lead/trail or topLead/
  // topTrail like the plain/topside states.
  { id:'bynsoul',   name:'Byn Soul',    fam:'groove', lead:'Fastslide',    trail:'BS Torque',
    topLead:'BS Pudslide', topTrail:'Torque',
    bsLead:'BS Backslide', bsTrail:'Pudslide',
    bsTopLead:'Backslide', bsTopTrail:'BS Pudslide', def:false },
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
  // Byn Soul included: mechanically a groove, but its rotation/naming is
  // fully soul-style (see the module-scope rotFam() used by the rest of
  // the engine for the same idea outside this closure) — so it routes
  // through nameWithFlags exactly like a real soul, no custom branch needed.
  const isSoul = id => ['soul','acid','torquesoul','mizu','pornstar','mistrial','makio',
    'xgrind','teakettle','citric','hotdog','stubsoul','sidewalk','bynsoul'].includes(id);

  // alias resolver: peel topside then AO on miss, prefix peeled + mods
  // NOTE: `key()` builds the ALIAS LOOKUP key and always uses the full word
  // "Topside" — ALIASES is keyed on that literal string ("Topside Makio",
  // "AO Topside Mizu", ...), so the lookup itself must never see the compact
  // "Top" form or every alias hit (Fishbrain, Sweatstance, Kindgrind, Soyale,
  // Savannah, Backside Savannah) would silently break in compact mode. Only
  // the actually-RENDERED literal "Topside" tokens (the peeled prefix, and
  // the no-alias-at-all fallback core) use `topWord`, which is compact/
  // detailed-aware — mirroring the True/Truespin `detailed ? … : …` split.
  function nameWithFlags(base, f={}) {
    const { ao, topside, negative, rough, tough, detailed } = f;
    const topWord = detailed ? 'Topside' : 'Top';
    const key = (a,t)=>[a?'AO':null,t?'Topside':null,base].filter(Boolean).join(' ');
    const peeled=[]; let core=ALIASES[key(ao,topside)];
    if(!core && topside){ const h=ALIASES[key(ao,false)]; if(h){core=h;peeled.push(topWord);} }
    if(!core && ao){ const h=ALIASES[key(false,topside)]; if(h){core=h;peeled.push('AO');} }
    if(!core) core=[ao?'AO':null, topside?topWord:null, base].filter(Boolean).join(' ');
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
        // Tabernacle / Darkslide / Wheelbarrow: reversal → Backside X
        // (Byn Soul used to be handled here too — it's soul-style now, see
        // isSoul above, so it routes through nameWithFlags like a real soul
        // instead. Still left in HYBRID below for validity()'s topside/
        // negative gating, which is independent of naming dispatch.)
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
// Rotation-family override: Byn Soul is mechanically a groove (stays listed
// under Groove Tricks in the UI; BASE.fam is 'groove') but its ENTRY/EXIT
// rotation and naming are fully soul-style — reusing the exact degree menu,
// Zero/AO/Truespin/Inspin/Outspin naming, and exit math souls already have,
// rather than re-deriving them by hand (which is how the last few rounds of
// Byn Soul naming bugs happened). Every rotation-dispatch site — validInDeg/
// validOutDeg, entryName's family check, landsFakie, _v3ao, the away-roll,
// switch-up transitions — uses rotFam(base) instead of the raw base.fam.
const rotFam = (b) => (b.fam==='soul' || b.id==='bynsoul') ? 'soul' : b.fam;
function generateTrick(F) {
  const { spins:SP, sliders:SL } = F;
  const pool = BASE.filter(b => {
    if(F.tricks[b.id] === false) return false;
    if(b.gate && SL[b.gate] <= 0) return false;
    // drop the trick if its family has no valid entry degree in the In-spin range
    if(validInDeg(rotFam(b), SP.inMin, SP.inMax).length === 0) return false;
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
  // Rotation family: 'soul' for real souls AND Byn Soul (see rotFam) — this
  // single line is what makes Byn Soul reuse the entire soul degree menu,
  // Zero/AO/Truespin/Inspin/Outspin naming, and exit math below, with no
  // custom gating code. (base.fam itself stays 'groove', untouched — that's
  // what keeps Byn Soul under Groove Tricks in the UI.)
  const fam = rotFam(base);
  const inDeg = pick(validInDeg(fam, SP.inMin, SP.inMax));
  const fakieIn = roll(SP.fakieIn);
  // A single away roll serves double duty exactly like a real soul's: at a
  // half-rotation (180/540) it's the AO-vs-Truespin switch; at inDeg=0
  // (Zero) it's simply unread (entryName's soul branch never checks `away`
  // there, and _v3ao's own !isZero guard already suppresses AO/Truespin
  // regardless of what away rolled to) — so "Zero AO"/"Zero Tru" can't
  // happen without any Byn-Soul-specific gating needed.
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
    if(validInDeg(rotFam(b), SP.inMin, SP.inMax).length === 0) return false;
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
    // Rotation family: 'soul' for real souls AND Byn Soul (see rotFam) — one
    // line, same as generateTrick, so the enumerator can never drift out of
    // sync with what the generator actually produces (the exact class of
    // bug this project has hit before with Hide Landed).
    const fam = rotFam(base);
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
    // Direction word (toward=Inspin, away=Outspin) only on a FAKIE spin — same
    // convention as the soul branch's Inspin/Outspin (only shown when they add
    // information beyond the degree). A forward (non-fakie) spin's direction
    // is unambiguous from degree + BS alone, so it stays bare: "270 Royale",
    // not "270 Outspin Royale". namedDir mirrors the soul branch's own flag
    // (set whenever a direction word is pushed) — wired here for Byn Soul's
    // spin-suppression logic to reuse. BS is kept separately below (backside
    // is a distinct property).
    if(e.inDeg !== 90 && e.fakieIn) { parts.push(e.away ? 'Outspin' : 'Inspin'); namedDir = true; }
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
  // Rotation family: 'soul' for real souls AND Byn Soul (rotFam) — routes
  // Byn Soul through the exact same entryName branch, exit math, and _v3ao
  // computation real souls use below, no custom logic needed for any of it.
  const fam = rotFam(base);
  const en = entryName(fam, e, detailed);
  const tags = [];
  if(e.top) tags.push('top');
  if(en.landsFakie && !en.isZero && !en.namedDir) tags.push('ao');   // AO only when no direction word already names it (Truespin/In/Out) and not a Zero
  const tagKey = [...tags, base.id].sort().join('|');
  const special = SPECIAL[tagKey] || null;

  let lead, trail;
  if(t.baseId==='bynsoul') {
    // Byn Soul's own 4-slot plate table — NOT a lead/trail swap like real
    // souls use below (its reversed-position plates are a genuinely
    // different plate family — BS Backslide/Pudslide, not a reordering of
    // Fastslide/BS Torque — confirmed by Jim), so it skips the generic
    // landsFakie swap entirely and picks the already-correct pair directly.
    if(e.top && en.landsFakie && base.bsTopLead!==undefined) { lead=base.bsTopLead; trail=base.bsTopTrail; }
    else if(e.top && base.topLead!==undefined) { lead=base.topLead; trail=base.topTrail; }
    else if(en.landsFakie && base.bsLead!==undefined) { lead=base.bsLead; trail=base.bsTrail; }
    else { lead=base.lead; trail=base.trail; }
  }
  else if(e.top && base.topLead!==undefined) { lead=base.topLead; trail=base.topTrail; }
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
  if(en.landsFakie && t.baseId!=='bynsoul') { const tmp = lead; lead = trail; trail = tmp; }

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
  // fam is rotFam-resolved above, so this is the real soul formula for BOTH
  // real souls and Byn Soul — landsFakie/isZero/namedDir already came out of
  // entryName's soul branch for Byn Soul too, so AO is correctly suppressed
  // at Zero and whenever a direction word (Truespin/Inspin/Outspin) already
  // names it, with no Byn-Soul-specific flags needed here at all.
  const _v3ao = fam==='soul' ? (en.landsFakie && !en.isZero && !en.namedDir) : false;
  const _v3backside = fam==='groove' ? en.isBS : false;
  const v3Core = V3.name(t.baseId, {
    ao:_v3ao, backside:_v3backside, topside:!!e.top,
    negative:!!m.neg, rough:!!m.rough, tough:!!m.tough,
    christ:!!m.christ, antichrist:!!m.antichrist,
    detailed,
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
      if(e.top) p.push(detailed ? 'Topside' : 'Top');
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
  const soul = rotFam(base) === 'soul';   // true for real souls AND Byn Soul
  const f = node.flags || {};
  // a node may carry an explicit spin (e.g. AO tile at 180°); else it's the plain base pose
  const e = node.spin
    ? { inDeg: node.spin.inDeg, fakieIn: node.spin.fakieIn, away: node.spin.away, top: !!f.topside }
    : { inDeg: soul ? 0 : 90, fakieIn: false, away: soul ? false : !!f.backside, top: !!f.topside };
  return {
    baseId: node.base, fam: rotFam(base),
    entry: e,
    mods:  { neg:!!f.negative, rough:!!f.rough, tough:!!f.tough, christ:!!f.christ, antichrist:!!f.antichrist, sw:!!f.switch },
    exit:  { outDeg: 0, rewind: false },
  };
}
const progFam  = (node) => (BASE.find(b => b.id === node.base) || {}).fam;
// rotation-family for drawer dispatch (Byn Soul reads as 'soul' here even though
// progFam/tile-dot color stays 'groove' — see rotFam)
const progRotFam = (node) => rotFam(BASE.find(b => b.id === node.base) || {});
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
  return { baseId, fam:rotFam(b),
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
  let list;
  if (flags.topside) {                                                              // topside hub (chips rendered with top:true)
    const set = progRotFam(node) === 'soul' ? SOUL_SPINS : GROOVE_SPINS;             // Byn Soul rotates soul-style -> soul spins, real grooves -> groove spins
    const hasAoTile = PROG_NODES.some(n => n.spin && n.base === node.base && n.flags && n.flags.topside);
    list = hasAoTile ? set.filter(s => s.key !== 'ao') : set;                        // AO promoted to its own tile (Kindgrind/Misfit/Cloudy Night) — no duplicate chip
  } else if (flags.backside) {
    list = GROOVE_SPINS.filter(s => s.facing === 'backside' && s.key !== 'right');   // backside hub (minus the plain Backside = the tile)
  } else if (Object.keys(flags).length) {
    list = [];
  } else if (progRotFam(node) === 'soul') {
    list = SOUL_SPINS;                                                               // base soul (incl. Byn Soul): all soul spins (AO included)
  } else {
    const hasBsTile = PROG_NODES.some(n => n.flags && n.flags.backside && n.base === node.base);
    list = hasBsTile ? GROOVE_SPINS.filter(s => s.facing === 'frontside') : GROOVE_SPINS; // base groove: frontside-facing if it has a Backside tile, else all
  }
  return list;
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
  const soul = rotFam(base) === 'soul';
  const f = node.flags || {};
  return { baseId: node.base, fam: rotFam(base),
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

// ══ ICONS ════════════════════════════════════════════════════════════════════
const IconEye = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IconFilter = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="currentColor"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="currentColor"/></svg>);
const IconGrid = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>);
const IconClose = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconBookmarkOutline = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>);
const IconBookmarkFill = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>);
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconUndo = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>);
const IconTooHard = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>);
const IconWorkingOutline = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>);
const IconWorkingFill = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="white" stroke="white"/></svg>);
const IconBolt = ({active}) => (<svg width="20" height="20" viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IconListNav = ({active}) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill={active?'currentColor':'none'} stroke="currentColor"/><circle cx="3.5" cy="12" r="1.5" fill={active?'currentColor':'none'} stroke="currentColor"/><circle cx="3.5" cy="18" r="1.5" fill={active?'currentColor':'none'} stroke="currentColor"/></svg>);
const IconBug = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.5 1.5M16 2l-1.5 1.5"/><path d="M9 7h6a3 3 0 0 1 3 3v4a6 6 0 0 1-12 0v-4a3 3 0 0 1 3-3z"/><path d="M12 13v6M3 9h3M3 14h3M3 19h3.5M21 9h-3M21 14h-3M21 19h-3.5"/></svg>);
const IconExport = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>);
const IconImport = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M8 12l4 4 4-4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>);
const IconExternal = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>);
const IconProgress = ({active}) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.4" fill={active?'currentColor':'none'}/><circle cx="6" cy="19" r="2.4" fill={active?'currentColor':'none'}/><circle cx="18" cy="19" r="2.4" fill={active?'currentColor':'none'}/><path d="M12 7.4 L6.8 16.7 M12 7.4 L17.2 16.7"/></svg>);

// ══ APP ══════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('generator');
  const [trick, setTrick] = useState(null);
  const [chain, setChain] = useState(null);
  const [prevView, setPrevView] = useState(null);   // { trick, chain } snapshot for goBack (handles both singles and switch-ups)
  const [animKey, setAnimKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [exitDetailed, setExitDetailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPage, setSheetPage] = useState(0); // 0=tricks, 1=filters
  const [poolEmpty, setPoolEmpty] = useState(null);
  const [filters, setFilters] = useState(makeInitFilters);
  const [landed, setLanded] = useState([]);
  const [working, setWorking] = useState([]);    // "working on" — still generates (not landed yet)
  const [skipped, setSkipped] = useState([]);   // "too hard" — hidden from generation
  const [search, setSearch] = useState('');
  const [debugCopied, setDebugCopied] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [skipArmed, setSkipArmed] = useState(false);
  const [dataSheet, setDataSheet] = useState(null);   // null | 'export' | 'import'
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  // Progression Mode: skip list is progression-local (node ids), persisted separately.
  const [progSkip, setProgSkip] = useState([]);        // array of node ids
  const [progSel, setProgSel] = useState(null);        // selected node id (opens footer)
  const [progConfirmSkip, setProgConfirmSkip] = useState(false);  // trunk-skip warning gate

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = `
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
      body{background:#F5F0E8;overscroll-behavior:none}
      button{border:none;cursor:pointer;background:none;font-family:inherit}
      input{font-family:inherit;outline:none;border:none;background:none}
      input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;background:#D9D3C7;cursor:pointer}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#1A3FD4;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.25)}
      @keyframes trickIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    `;
    document.head.appendChild(style);
    (async () => { try { const r=await window.storage.get('rbrg_landed'); if(r) setLanded(JSON.parse(r.value)); } catch(e) {} })();
    (async () => { try { const r=await window.storage.get('rbrg_working'); if(r) setWorking(JSON.parse(r.value)); } catch(e) {} })();
    (async () => { try { const r=await window.storage.get('rbrg_skipped'); if(r) setSkipped(JSON.parse(r.value)); } catch(e) {} })();
    (async () => { try { const r=await window.storage.get('rbrg_filters'); if(r){ const f=JSON.parse(r.value); setFilters(prev=>({...prev, ...f, tricks:{...prev.tricks, ...(f.tricks||{})}, spins:{...prev.spins, ...(f.spins||{})}, sliders:{...prev.sliders, ...(f.sliders||{})}})); } } catch(e) {} })();
    (async () => { try { const r=await window.storage.get('rbrg_prog_skip'); if(r) setProgSkip(JSON.parse(r.value)); } catch(e) {} })();
  }, []);

  const saveLanded = async (arr) => { try { await window.storage.set('rbrg_landed', JSON.stringify(arr)); } catch(e) {} };
  const saveWorking = async (arr) => { try { await window.storage.set('rbrg_working', JSON.stringify(arr)); } catch(e) {} };
  const saveSkipped = async (arr) => { try { await window.storage.set('rbrg_skipped', JSON.stringify(arr)); } catch(e) {} };
  const saveFilters = async (f) => { try { await window.storage.set('rbrg_filters', JSON.stringify(f)); } catch(e) {} };
  const saveProgSkip = async (arr) => { try { await window.storage.set('rbrg_prog_skip', JSON.stringify(arr)); } catch(e) {} };

  // persist filters whenever they change (skip the very first render)
  const filtersLoaded = useRef(false);
  useEffect(() => {
    if(!filtersLoaded.current) { filtersLoaded.current = true; return; }
    saveFilters(filters);
  }, [filters]);

  const generate = useCallback((extraSkipSig) => {
    if(busy) return;
    setSkipArmed(false);   // any generate cancels an armed "too hard"
    // Drill modes (Work-On Only, Practice) draw from your saved tricks, not the enabled bases —
    // so the "any base enabled?" guard below only applies when neither drill mode is on.
    if(!filters.workOnly && !filters.practice) {
      // tricks that are enabled, not gated off, AND have a valid entry degree in range
      const enabled = BASE.filter(b => {
        if(filters.tricks[b.id] === false) return false;
        if(b.gate && filters.sliders[b.gate] <= 0) return false;
        if(validInDeg(rotFam(b), filters.spins.inMin, filters.spins.inMax).length === 0) return false;
        return true;
      });
      if(!enabled.length) { setPoolEmpty('disabled'); return; }
    }
    setBusy(true);
    setTimeout(() => {
      let t;
      // skipped ("too hard") tricks are always excluded from generation
      const skipSigs = new Set(skipped.map(l=>l.sig));
      if(extraSkipSig) skipSigs.add(extraSkipSig);
      // signature of whatever is currently on screen (single OR chain) — avoid rolling it
      // again back-to-back (unless it's the only candidate left, then a repeat is unavoidable).
      const currentSig = chain ? chainSignature(chain) : (trick ? trickSignature(trick) : null);
      // Pick from a list of pre-signed {v,sig} pairs, dropping the current trick unless it's
      // the sole option. Signatures are computed once by the caller and reused here (trickSignature
      // runs the full naming pipeline, so we avoid re-signing large enumerated pools).
      const pickAvoidingCurrent = (pairs) => {
        if(!pairs.length) return null;
        const others = currentSig ? pairs.filter(p => p.sig !== currentSig) : pairs;
        const pool = others.length ? others : pairs;   // if current was the only one, keep it
        return pool[Math.floor(Math.random()*pool.length)].v;
      };
      // DRILL MODES (Work-On Only, Practice) — highest precedence, above fresh switch-up
      // generation. Pool = your saved entries (singles AND chains), filtered by practiceScope
      // (single / double / all) and replayed EXACTLY as saved — current spin/modifier filters
      // are ignored here. A picked entry is committed by branching chain vs single. Never
      // "completes"; drills endlessly.
      if(filters.workOnly || filters.practice) {
        const mode = filters.workOnly ? 'workonly' : 'practice';
        const pool = buildDrillPool(landed, working, mode, filters.practiceScope);
        // scope-specific empty message: a doubles-only drill with no saved switch-ups reads
        // differently from an all/singles pool with nothing in it.
        const emptyKey = (mode==='workonly' ? 'workonly-empty' : 'practice-empty')
          + (filters.practiceScope==='double' ? '-double' : '');
        if(!pool.length) { setBusy(false); setPoolEmpty(emptyKey); return; }
        const entry = pickAvoidingCurrent(pool);   // returns the whole saved entry (.v)
        if(!entry) { setBusy(false); setPoolEmpty(emptyKey); return; }
        setPoolEmpty(null);
        setPrevView({ trick, chain });
        if(entry.chain) { setChain(entry.chain); setTrick(null); }
        else { setChain(null); setTrick(entry.trick); }
        setAnimKey(k => k+1);
        setTimeout(() => setBusy(false), 80);
        return;
      }
      // SWITCH-UP MODE — fresh generation, only when NOT drilling (a drill mode above returns
      // first). Generates a fresh 2-grind switch-up from the enabled pool. Avoids repeating the
      // current switch-up back-to-back by re-rolling on a signature match.
      if(filters.switchUp === 2) {
        const curChainSig = chain ? chainSignature(chain) : null;
        let ch = generateChain(filters);
        let tries = 0;
        while(ch && curChainSig && chainSignature(ch)===curChainSig && tries<40) { ch = generateChain(filters); tries++; }
        if(!ch) { setBusy(false); setPoolEmpty('disabled'); return; }
        setPoolEmpty(null);
        setPrevView({ trick, chain });
        setChain(ch);
        setTrick(null);
        setAnimKey(k => k+1);
        setTimeout(() => setBusy(false), 80);
        return;
      }
      if(filters.hideLanded) {
        // Match regular generation's feel: roll generateTrick (the same slider-weighted
        // function used when Hide Landed is off) and reject anything already landed,
        // skipped, or currently on screen. Falls back to an exact enumerated pick only
        // if that fails to land a hit (e.g. the only tricks left are low-probability
        // under the current sliders) — guarantees correctness/termination and the right
        // "Pool Complete" signal without losing the slider-weighted feel in the common case.
        const landedSigs = new Set(landed.map(l=>l.sig));
        const bad2 = (x) => { const s = trickSignature(x); return landedSigs.has(s) || skipSigs.has(s) || (currentSig && s===currentSig); };
        let tt = generateTrick(filters);
        let tries2 = 0;
        while(tt && bad2(tt) && tries2<400) { tt = generateTrick(filters); tries2++; }
        if(tt && !bad2(tt)) {
          t = tt;
        } else {
          const unlanded = enumerateVariants(filters)
            .map(v => ({ v, sig: trickSignature(v) }))
            .filter(p => !landedSigs.has(p.sig) && !skipSigs.has(p.sig));
          if(!unlanded.length) { setBusy(false); setPoolEmpty('complete'); return; }
          t = pickAvoidingCurrent(unlanded);
        }
      } else {
        // random draw, retrying while it hits a skipped OR the current trick; then fall back
        // to a deterministic pick that excludes both (so a tiny pool still alternates).
        const bad = (x) => { const s = trickSignature(x); return skipSigs.has(s) || (currentSig && s===currentSig); };
        t = generateTrick(filters);
        let tries = 0;
        while(t && bad(t) && tries<60) { t = generateTrick(filters); tries++; }
        if(t && bad(t)) {
          const avail = enumerateVariants(filters)
            .map(v => ({ v, sig: trickSignature(v) }))
            .filter(p => !skipSigs.has(p.sig));
          t = pickAvoidingCurrent(avail);
        }
      }
      if(!t) { setBusy(false); setPoolEmpty('complete'); return; }
      // only clear the empty state once we have a real trick to show (prevents flashing
      // the previous trick when the pool is already complete)
      setPoolEmpty(null);
      setPrevView({ trick, chain });
      setChain(null);       // single-trick path — drop any prior switch-up chain
      setTrick(t);
      setAnimKey(k => k+1);
      setTimeout(() => setBusy(false), 80);
    }, 40);
  }, [busy, filters, trick, chain, landed, working, skipped]);

  const trickDisplay = useMemo(() => computeDisplay(trick, {specialFirst:filters.specialFirst, detailed:exitDetailed, spellBackside:exitDetailed}), [trick, filters.specialFirst, exitDetailed]);
  const chainDisplay = useMemo(() => computeChainDisplay(chain, {specialFirst:filters.specialFirst, detailed:exitDetailed, spellBackside:exitDetailed}), [chain, filters.specialFirst, exitDetailed]);
  const hasExit = trick && trick.exit.outDeg > 0;

  // Either a single trick or a switch-up chain is "on screen". The state buttons
  // (Landed / Working / Too-Hard) operate on whichever is showing, keyed by its signature.
  const chainVisible = chain && !poolEmpty;
  const trickOnly = trick && !poolEmpty;
  const anyVisible = (trickOnly || chainVisible);
  // unified signature + display for the current thing on screen
  const curSig = chain ? chainSignature(chain) : (trick ? trickSignature(trick) : null);
  const curMain = chain ? (chainDisplay && chainDisplay.main) : (trickDisplay && trickDisplay.main);

  // A trick is genuinely on screen only when one exists AND no empty-state message is showing
  const trickVisible = anyVisible;
  const trickSig = curSig;
  const isLanded = (trickVisible && trickSig) ? landed.some(l => l.sig === trickSig) : false;
  const isWorking = (trickVisible && trickSig) ? working.some(l => l.sig === trickSig) : false;
  // Landed / Working-On stay live in both drill modes so you can re-flag mid-session. Too-Hard
  // is disabled in either drill mode — you drop a trick from a drill pool by clearing its flag.
  const stateButtonsActive = trickVisible;
  const tooHardActive = trickVisible && !filters.practice && !filters.workOnly && !chain;
  // Landed/working entries carry the full object for replay. For a chain we store the chain
  // under `chain` (and leave `trick` null); for a single grind we store `trick`. `isChain`
  // lets the Landed screen and Practice replay tell them apart.
  const makeEntry = () => chain
    ? ({ sig:curSig, display:curMain, lead:null, trail:null, at:Date.now(), chain, isChain:true })
    : ({ sig:curSig, display:curMain, lead:trickDisplay.lead, trail:trickDisplay.trail, at:Date.now(), trick });
  const toggleLanded = () => {
    if(!trickVisible || !curMain) return;
    setSkipArmed(false);
    if(isLanded) {
      const next = landed.filter(l => l.sig !== trickSig);
      setLanded(next); saveLanded(next);
    } else {
      // set landed; clear the other exclusive states (working-on, too-hard)
      const next = [...landed, makeEntry()];
      setLanded(next); saveLanded(next);
      if(isWorking) { const nw = working.filter(l => l.sig !== trickSig); setWorking(nw); saveWorking(nw); }
      if(skipped.some(l => l.sig === trickSig)) { const ns = skipped.filter(l => l.sig !== trickSig); setSkipped(ns); saveSkipped(ns); }
    }
  };
  const toggleWorking = () => {
    if(!trickVisible || !curMain) return;
    setSkipArmed(false);
    if(isWorking) {
      const next = working.filter(l => l.sig !== trickSig);
      setWorking(next); saveWorking(next);
    } else {
      // set working-on; clear the other exclusive states (landed, too-hard)
      const next = [...working, makeEntry()];
      setWorking(next); saveWorking(next);
      if(isLanded) { const nl = landed.filter(l => l.sig !== trickSig); setLanded(nl); saveLanded(nl); }
      if(skipped.some(l => l.sig === trickSig)) { const ns = skipped.filter(l => l.sig !== trickSig); setSkipped(ns); saveSkipped(ns); }
    }
  };
  const removeLanded = (sig) => { const next = landed.filter(l=>l.sig!==sig); setLanded(next); saveLanded(next); };
  const removeWorking = (sig) => { const next = working.filter(l=>l.sig!==sig); setWorking(next); saveWorking(next); };
  // "Too hard" — add current trick to the skipped list (hidden from generation), then advance.
  // Chains are endless fresh combos (not an enumerable pool), so Too-Hard on a chain just
  // rolls a new one without recording anything — the button is disabled in switch-up mode anyway.
  const skipTrick = () => {
    if(!trickVisible || !curMain) return;
    if(chain) { generate(); return; }
    if(!skipped.some(s => s.sig === trickSig)) {
      const next = [...skipped, { sig:trickSig, display:trickDisplay.main, lead:trickDisplay.lead, trail:trickDisplay.trail, at:Date.now() }];
      setSkipped(next); saveSkipped(next);
    }
    // also clear the other exclusive states — it's now "can't do" instead
    if(isLanded) { const nl = landed.filter(l=>l.sig!==trickSig); setLanded(nl); saveLanded(nl); }
    if(isWorking) { const nw = working.filter(l=>l.sig!==trickSig); setWorking(nw); saveWorking(nw); }
    generate(trickSig);
  };
  const removeSkipped = (sig) => { const next = skipped.filter(l=>l.sig!==sig); setSkipped(next); saveSkipped(next); };

  // Export full app state (landed + working + skipped + filters) as a compact, copy-pasteable string.
  const exportString = () => 'RBGRIND-v2:' + JSON.stringify({ landed, working, skipped, filters, progSkip });
  const doExportCopy = async () => {
    try { await navigator.clipboard.writeText(exportString()); setExportCopied(true); setTimeout(()=>setExportCopied(false), 2000); } catch(e) {}
  };
  // Import: landed/working/skipped MERGE (skip dupes by sig); filters REPLACE. Handles v2 and legacy v1.
  const doImport = () => {
    let raw = importText.trim();
    // some clipboards percent-encode the text on paste — decode if so
    if(/%[0-9A-Fa-f]{2}/.test(raw)) { try { raw = decodeURIComponent(raw); } catch(e) {} }
    const m = raw.match(/rbgrind-(landed-)?v\d+:/i);
    if(m) raw = raw.slice(m.index + m[0].length);
    raw = raw.trim();
    let parsed;
    try { parsed = JSON.parse(raw); } catch(e) { setImportMsg('Could not read that — check you copied the whole thing.'); return; }

    // normalize: v1 was a bare landed array; v2 is { landed, working, skipped, filters }
    // (working added later — older v2 backups without it just load empty)
    let inLanded = [], inWorking = [], inSkipped = [], inFilters = null, inProgSkip = [];
    if(Array.isArray(parsed)) { inLanded = parsed; }
    else if(parsed && typeof parsed==='object') {
      inLanded = Array.isArray(parsed.landed) ? parsed.landed : [];
      inWorking = Array.isArray(parsed.working) ? parsed.working : [];
      inSkipped = Array.isArray(parsed.skipped) ? parsed.skipped : [];
      inFilters = (parsed.filters && typeof parsed.filters==='object') ? parsed.filters : null;
      inProgSkip = Array.isArray(parsed.progSkip) ? parsed.progSkip.filter(x => typeof x==='string') : [];
    } else { setImportMsg('That doesn\'t look like an RB Grind backup.'); return; }

    const wellFormed = (p) => p && typeof p.sig==='string' && typeof p.display==='string';
    const validLanded = inLanded.filter(wellFormed);
    const validWorking = inWorking.filter(wellFormed);
    const validSkipped = inSkipped.filter(wellFormed);

    // merge landed
    const haveL = new Set(landed.map(l=>l.sig));
    const addL = validLanded.filter(p => !haveL.has(p.sig));
    const nextLanded = [...landed, ...addL];
    // merge working — but never let a working entry collide with a landed one (states are
    // exclusive; landed wins). Guards against hand-edited/cross-merged backups.
    const landedSigs = new Set(nextLanded.map(l=>l.sig));
    const haveW = new Set(working.map(l=>l.sig));
    const addW = validWorking.filter(p => !haveW.has(p.sig) && !landedSigs.has(p.sig));
    const nextWorking = [...working, ...addW].filter(w => !landedSigs.has(w.sig));
    // merge skipped
    const haveS = new Set(skipped.map(l=>l.sig));
    const addS = validSkipped.filter(p => !haveS.has(p.sig));
    const nextSkipped = [...skipped, ...addS];

    // union progression skip (node ids); dedupe against current
    const haveP = new Set(progSkip);
    const addP = inProgSkip.filter(id => !haveP.has(id));
    const nextProgSkip = [...progSkip, ...addP];

    setLanded(nextLanded); saveLanded(nextLanded);
    setWorking(nextWorking); saveWorking(nextWorking);
    setSkipped(nextSkipped); saveSkipped(nextSkipped);
    if(addP.length) { setProgSkip(nextProgSkip); saveProgSkip(nextProgSkip); }

    // replace filters (merge into a fresh default so missing keys are filled)
    let filtersMsg = '';
    if(inFilters) {
      const base = makeInitFilters();
      const merged = { ...base, ...inFilters,
        tricks:{ ...base.tricks, ...(inFilters.tricks||{}) },
        spins:{ ...base.spins, ...(inFilters.spins||{}) },
        sliders:{ ...base.sliders, ...(inFilters.sliders||{}) } };
      setFilters(merged); saveFilters(merged);
      filtersMsg = ', settings restored';
    }

    if(!validLanded.length && !validWorking.length && !validSkipped.length && !inFilters) { setImportMsg('Nothing valid found in that text.'); return; }
    const parts = [];
    parts.push(`${addL.length} landed`);
    if(validWorking.length || addW.length) parts.push(`${addW.length} working on`);
    if(validSkipped.length || addS.length) parts.push(`${addS.length} too-hard`);
    setImportMsg(`Added ${parts.join(', ')}${filtersMsg}.`);
    setImportText('');
    setDataSheet(null); setScreen('generator');
  };
  const goBack = () => {
    if(!prevView) return;
    setSkipArmed(false);
    // restore whichever view was previously on screen (single trick OR switch-up chain)
    if(prevView.chain) { setChain(prevView.chain); setTrick(null); }
    else { setChain(null); setTrick(prevView.trick); }
    setPrevView(null);
    setPoolEmpty(null);   // a restored view is real content — clear any empty-state
    setAnimKey(k=>k+1);
  };
  const toggleAll = (list, val) => { const u={}; list.forEach(b=>{u[b.id]=val;}); setFilters(f=>({...f,tricks:{...f.tricks,...u}})); };
  const setSlider = (k,v) => setFilters(f => ({ ...f, sliders:{ ...f.sliders, [k]:v } }));
  const setSpin = (k,v) => setFilters(f => ({ ...f, spins:{ ...f.spins, [k]:v } }));

  const openSheet = (page) => { setSkipArmed(false); setSheetPage(page); setSheetOpen(true); };

  // ── PROGRESSION derived + handlers ──────────────────────────────────────────
  const progTiersMap = useMemo(() => progTiers(PROG_NODES), []);
  const progPos = useMemo(() => {
    const xs = progLayoutX(PROG_NODES, progTiersMap);
    const p = {};
    PROG_NODES.forEach(n => { p[n.id] = { x: xs[n.id], y: PROG_TIER_Y0 + progTiersMap[n.id] * PROG_TIER_GAP }; });
    return p;
  }, [progTiersMap]);
  const progMaxTier = useMemo(() => Math.max(...Object.values(progTiersMap)), [progTiersMap]);
  const progCanvasW = useMemo(() => Math.max(...PROG_NODES.map(n => progPos[n.id].x)) + PROG_TILE / 2 + 24, [progPos]);
  const progCanvasH = PROG_TIER_Y0 + progMaxTier * PROG_TIER_GAP + PROG_TILE + 46;
  // center the tree scroll on Makio whenever the Progression screen opens
  const progTreeRef = useRef(null);
  useEffect(() => {
    if (screen !== 'progression' || !progTreeRef.current) return;
    const el = progTreeRef.current;
    const makio = progPos['makio'];
    if (!makio) return;
    requestAnimationFrame(() => {
      el.scrollLeft = Math.max(0, makio.x - el.clientWidth / 2);
      el.scrollTop = Math.max(0, makio.y - el.clientHeight / 2);
    });
  }, [screen, progPos]);
  // landed node ids = nodes whose canonical sig is in the SHARED landed list (§4.1)
  const landedSigSet = useMemo(() => new Set(landed.map(l => l.sig)), [landed]);
  const progLandedIds = useMemo(() => new Set(PROG_NODES.filter(n => landedSigSet.has(progSig(n))).map(n => n.id)), [landedSigSet]);
  const progSkipSet = useMemo(() => new Set(progSkip), [progSkip]);
  const progAllDone = useMemo(() => progDone(PROG_NODES, progLandedIds, progSkipSet), [progLandedIds, progSkipSet]);

  const progSelectNode = (id) => { setProgSel(id); setProgConfirmSkip(false); };
  const progCloseFooter = () => { setProgSel(null); setProgConfirmSkip(false); };
  // Mark Landed writes a normal entry to the SHARED landed list (shows on Landed screen);
  // clears working / too-hard for that sig to preserve the app's exclusive-state invariant.
  const progMarkLanded = (node) => {
    const sig = progSig(node);
    if(landed.some(l => l.sig === sig)) return;
    const next = [...landed, progEntry(node)];
    setLanded(next); saveLanded(next);
    if(working.some(l => l.sig === sig)) { const nw = working.filter(l => l.sig !== sig); setWorking(nw); saveWorking(nw); }
    if(skipped.some(l => l.sig === sig)) { const ns = skipped.filter(l => l.sig !== sig); setSkipped(ns); saveSkipped(ns); }
  };
  // Unmark removes from the shared list GLOBALLY (even if landed in the Generator); re-locks dependents.
  const progUnmark = (node) => {
    const sig = progSig(node);
    const next = landed.filter(l => l.sig !== sig);
    setLanded(next); saveLanded(next);
  };
  const progDoSkip = (node) => {
    if(!progSkip.includes(node.id)) { const next = [...progSkip, node.id]; setProgSkip(next); saveProgSkip(next); }
    setProgConfirmSkip(false);
  };
  const progUnskip = (node) => {
    const next = progSkip.filter(id => id !== node.id);
    setProgSkip(next); saveProgSkip(next);
  };
  // Spin variants: mark/unmark landed against the SHARED landed list (same as base nodes). `top` = topside-hub pose.
  const progSpinLanded = (baseId, s, top=false) => landedSigSet.has(spinSig(baseId, s, top));
  const progMarkSpin = (baseId, s, top=false) => {
    const sig = spinSig(baseId, s, top);
    if(landed.some(l => l.sig === sig)) return;
    const next = [...landed, spinEntry(baseId, s, top)];
    setLanded(next); saveLanded(next);
    if(working.some(l => l.sig === sig)) { const nw = working.filter(l => l.sig !== sig); setWorking(nw); saveWorking(nw); }
    if(skipped.some(l => l.sig === sig)) { const ns = skipped.filter(l => l.sig !== sig); setSkipped(ns); saveSkipped(ns); }
  };
  const progUnmarkSpin = (baseId, s, top=false) => {
    const sig = spinSig(baseId, s, top);
    const next = landed.filter(l => l.sig !== sig);
    setLanded(next); saveLanded(next);
  };
  // Variation chips (Switch/Negative/Christ/Antichrist/Rough/Tough) — same shared-list pattern.
  const progModLanded = (node, key) => landedSigSet.has(modSig(node, key));
  const progMarkMod = (node, key) => {
    const sig = modSig(node, key);
    if(landed.some(l => l.sig === sig)) return;
    const next = [...landed, modEntry(node, key)];
    setLanded(next); saveLanded(next);
    if(working.some(l => l.sig === sig)) { const nw = working.filter(l => l.sig !== sig); setWorking(nw); saveWorking(nw); }
    if(skipped.some(l => l.sig === sig)) { const ns = skipped.filter(l => l.sig !== sig); setSkipped(ns); saveSkipped(ns); }
  };
  const progUnmarkMod = (node, key) => {
    const sig = modSig(node, key);
    const next = landed.filter(l => l.sig !== sig);
    setLanded(next); saveLanded(next);
  };

  const copyDebug = async () => {
    const offTricks = BASE.filter(b => filters.tricks[b.id]===false).map(b=>b.id);
    const dbg = {
      version: 'rbgrind-derived-3.06',
      currentTrick: trick || null,
      computedDisplay: trickDisplay || null,
      exitDetailed,
      specialFirst: filters.specialFirst,
      spins: filters.spins,
      sliders: filters.sliders,
      hideLanded: filters.hideLanded,
      practice: filters.practice,
      workOnly: filters.workOnly,
      tricksOff: offTricks,
      landedCount: landed.length,
      workingCount: working.length,
    };
    const text = 'RB GRIND DEBUG\n' + JSON.stringify(dbg, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setDebugCopied(true);
      setTimeout(()=>setDebugCopied(false), 1600);
    } catch(e) {
      // fallback: select-less prompt
      setDebugCopied(true);
      setTimeout(()=>setDebugCopied(false), 1600);
    }
  };

  const activeChips = useMemo(() => {
    // In Practice Mode the pool is your saved tricks, so spin/modifier chips don't apply —
    // show a single Practice chip instead.
    // Drill modes replace the spin/modifier chips (pool is your saved tricks). Work-On Only wins.
    if(filters.workOnly) return ['Work-On Only'];
    if(filters.practice) return ['Practice Mode'];
    const c = []; const SP=filters.spins, SL=filters.sliders;
    // Switch-up mode: lead with a Switch Up chip and the transition-spin range,
    // then keep the normal entry/modifier chips (they shape each grind in the switch-up).
    if(filters.switchUp===2) c.push('Switch Up');
    c.push(SP.inMin===SP.inMax ? `In ${SP.inMax}°` : `In ${SP.inMin}–${SP.inMax}°`);
    if(filters.switchUp) c.push(SP.suMin===SP.suMax ? `Sw ${SP.suMax}°` : `Sw ${SP.suMin}–${SP.suMax}°`);
    if(SP.outMax>0) c.push(SP.outMin===SP.outMax ? `Out ${SP.outMax}°` : `Out ${SP.outMin}–${SP.outMax}°`);
    if(SP.fakieIn>0) c.push(`Fakie ${SP.fakieIn}%`);
    if(SP.truespin) c.push('Truespin');
    if(SP.rewindOut>0) c.push(`Rewind ${SP.rewindOut}%`);
    if(SL.topside>0) c.push(`Top ${SL.topside}%`);
    if(SL.switch>0) c.push(`Switch ${SL.switch}%`);
    if(SL.negative>0) c.push(`Neg ${SL.negative}%`);
    if(SL.rough>0) c.push(`Rough ${SL.rough}%`);
    if(SL.tough>0) c.push(`Tough ${SL.tough}%`);
    if(SL.christ>0) c.push(`Christ ${SL.christ}%`);
    if(SL.antichrist>0) c.push(`Anti Christ ${SL.antichrist}%`);
    if(filters.hideLanded) c.push('Hide Landed');
    return c;
  }, [filters]);

  const BottomNav = () => (
    <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, background:C.bg, flexShrink:0 }}>
      {[
        { id:'generator', label:'Generator', icon:(a)=><IconBolt active={a}/> },
        { id:'landed', label:`Landed${landed.length>0?` (${landed.length})`:''}`, icon:(a)=><IconListNav active={a}/> },
        { id:'progression', label:'Progression', icon:(a)=><IconProgress active={a}/> },
      ].map(tab => {
        const active = screen === tab.id;
        return (
          <button key={tab.id} onClick={()=>{ setSkipArmed(false); setScreen(tab.id); }} style={{ flex:1, padding:'12px 0 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, color:active?C.accent:C.muted, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', transition:'color 0.15s' }}>
            {tab.icon(active)}{tab.label}
          </button>
        );
      })}
    </div>
  );

  // ── LANDED SCREEN ──
  if(screen === 'landed') {
    const filtered = search ? landed.filter(l => l.display.toLowerCase().includes(search.toLowerCase())) : landed;
    const sorted = [...filtered].sort((a,b) => b.at - a.at);
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.text, height:'100svh', maxWidth:390, margin:'0 auto', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'52px 22px 16px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.16em', color:C.muted, textTransform:'uppercase', marginBottom:4 }}>Landed</div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12 }}>
            <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.01em' }}>{landed.length} {landed.length===1?'trick':'tricks'}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setDataSheet('export'); setExportCopied(false); }} style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:C.muted, background:C.surface, padding:'7px 12px', borderRadius:9 }}>Export</button>
              <button onClick={()=>{ setDataSheet('import'); setImportMsg(''); setImportText(''); }} style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:C.muted, background:C.surface, padding:'7px 12px', borderRadius:9 }}>Import</button>
            </div>
          </div>
        </div>
        <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ background:C.surface, borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <IconSearch/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tricks…" style={{ flex:1, fontSize:15, color:C.text }}/>
            {search && <button onClick={()=>setSearch('')} style={{ color:C.muted, fontSize:20, lineHeight:1 }}>×</button>}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px 22px 16px' }}>
          {sorted.length===0 ? (
            <div style={{ textAlign:'center', padding: (working.length||skipped.length)?'40px 0 24px':'64px 0', color:C.muted }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🛼</div>
              <div style={{ fontSize:15, fontWeight:500 }}>{search?'No tricks match.':'Nothing landed yet.'}</div>
              {!search && <div style={{ fontSize:13, marginTop:6 }}>Generate a trick and tap the bookmark.</div>}
            </div>
          ) : sorted.map(l => (
            <div key={l.sig} style={{ padding:'14px 0', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', lineHeight:1.1 }}>{l.display}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:5, fontWeight:500 }}>{`Trail: ${l.trail||'Grab/Freestyle'}  ·  Lead: ${l.lead||'Grab/Freestyle'}`}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3, letterSpacing:'0.04em' }}>{fmtDate(l.at)}</div>
              </div>
              <button onClick={()=>removeLanded(l.sig)} style={{ width:32, height:32, borderRadius:8, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, flexShrink:0 }}><IconClose/></button>
            </div>
          ))}
          {(() => {
            const wFiltered = search ? working.filter(l => l.display.toLowerCase().includes(search.toLowerCase())) : working;
            if(!wFiltered.length) return null;
            return (
              <div style={{ marginTop: sorted.length ? 28 : 4 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, marginBottom:4 }}>Working On · {wFiltered.length}</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:10, lineHeight:1.4 }}>Still in the rotation — these keep coming up so you can try them again.</div>
                {[...wFiltered].sort((a,b)=>b.at-a.at).map(l => (
                  <div key={l.sig} style={{ padding:'12px 0', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', lineHeight:1.1 }}>{l.display}</div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:4, fontWeight:500 }}>{`Trail: ${l.trail||'Grab/Freestyle'}  ·  Lead: ${l.lead||'Grab/Freestyle'}`}</div>
                    </div>
                    <button onClick={()=>removeWorking(l.sig)} title="Remove from Working On" style={{ width:32, height:32, borderRadius:8, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, flexShrink:0 }}><IconClose/></button>
                  </div>
                ))}
              </div>
            );
          })()}
          {skipped.length>0 && (
            <div style={{ marginTop:28 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, marginBottom:4 }}>Too Hard · {skipped.length}</div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:10, lineHeight:1.4 }}>Hidden from generation. Remove one to let it come up again.</div>
              {[...skipped].sort((a,b)=>b.at-a.at).map(l => (
                <div key={l.sig} style={{ padding:'12px 0', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, opacity:0.75 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', lineHeight:1.1 }}>{l.display}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:4, fontWeight:500 }}>{`Trail: ${l.trail||'Grab/Freestyle'}  ·  Lead: ${l.lead||'Grab/Freestyle'}`}</div>
                  </div>
                  <button onClick={()=>removeSkipped(l.sig)} title="Un-hide" style={{ width:32, height:32, borderRadius:8, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, flexShrink:0 }}><IconClose/></button>
                </div>
              ))}
            </div>
          )}
        </div>
        {dataSheet && (
          <div onClick={()=>setDataSheet(null)} style={{ position:'fixed', inset:0, background:'rgba(13,11,8,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:50, maxWidth:390, margin:'0 auto' }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:C.bg, width:'100%', borderTopLeftRadius:20, borderTopRightRadius:20, padding:'20px 22px calc(24px + env(safe-area-inset-bottom))', animation:'slideUp 0.2s ease forwards' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontSize:17, fontWeight:700 }}>{dataSheet==='export'?'Export Backup':'Import Backup'}</div>
                <button onClick={()=>setDataSheet(null)} style={{ color:C.muted, fontSize:22, lineHeight:1 }}>×</button>
              </div>
              {dataSheet==='export' ? (
                <div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.5, marginBottom:12 }}>
                    Copy this text and paste it somewhere safe (like Notes). It saves your landed tricks, too-hard list, and all filter settings. Paste it back via Import to restore.
                  </div>
                  <div style={{ background:C.surface, borderRadius:12, padding:'12px 14px', fontSize:11, fontFamily:'monospace', color:C.text, wordBreak:'break-all', maxHeight:140, overflowY:'auto', marginBottom:12, lineHeight:1.5 }}>
                    {exportString()}
                  </div>
                  <button onClick={doExportCopy} style={{ width:'100%', padding:'13px', borderRadius:12, background:C.accent, color:C.white, fontSize:15, fontWeight:700 }}>
                    {exportCopied ? 'Copied ✓' : 'Copy to clipboard'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.5, marginBottom:12 }}>
                    Paste a previously exported backup. Landed and too-hard tricks are added to your current lists (duplicates skipped); filter settings are restored.
                  </div>
                  <button onClick={async()=>{ try { const t=await navigator.clipboard.readText(); if(t){ setImportText(t); setImportMsg(''); } else { setImportMsg('Clipboard was empty.'); } } catch(e) { setImportMsg('Couldn\'t read clipboard — paste manually below.'); } }} style={{ width:'100%', padding:'11px', borderRadius:12, background:C.accentLight, color:C.accent, fontSize:14, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <IconImport/> Paste from clipboard
                  </button>
                  <textarea value={importText} onChange={e=>{setImportText(e.target.value); setImportMsg('');}} placeholder="…or paste your backup text here" style={{ width:'100%', height:90, background:C.surface, borderRadius:12, padding:'12px 14px', fontSize:13, fontFamily:'monospace', color:C.text, resize:'none', lineHeight:1.5, marginBottom:12 }}/>
                  {importMsg && <div style={{ fontSize:13, color:C.accent, fontWeight:600, marginBottom:12 }}>{importMsg}</div>}
                  <button onClick={doImport} disabled={!importText.trim()} style={{ width:'100%', padding:'13px', borderRadius:12, background: importText.trim() ? C.accent : C.surface, color: importText.trim() ? C.white : C.muted, fontSize:15, fontWeight:700, opacity: importText.trim()?1:0.6 }}>
                    Import
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <BottomNav/>
      </div>
    );
  }

  // ── PROGRESSION SCREEN (skill tree — mock ported verbatim, real engine/state) ──
  if(screen === 'progression') {
    const PGOLD = '#C6971F';
    const TEAL = '#3f8fb0';
    const selNode = progSel ? PROG_BY_ID[progSel] : null;
    const selState = selNode ? progStateOf(selNode, progLandedIds, progSkipSet) : null;
    const selStrand = selNode ? progStrandedBy(PROG_NODES, progLandedIds, progSkipSet, selNode.id) : 0;
    const selHasKids = selNode ? PROG_NODES.some(n => n.parents.includes(selNode.id)) : false;
    const glyphOf = (n) => PROG_GLYPHS[n.id];
    const edges = [];
    PROG_NODES.forEach(n => progFlatParents(n).forEach(p => {
      edges.push({ key:p+'>'+n.id, a:progPos[p], b:progPos[n.id],
        live: progLandedIds.has(p), skipped: progStateOf(n, progLandedIds, progSkipSet)==='skipped' });
    }));
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.text, height:'100svh', maxWidth:390, margin:'0 auto', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
        <style>{`
          @keyframes rbready { 0%,100%{ box-shadow:0 0 0 2px ${C.accent}, 0 0 0 0 ${C.accent}33; } 50%{ box-shadow:0 0 0 2px ${C.accent}, 0 0 12px 2px ${C.accent}44; } }
          @media (prefers-reduced-motion: reduce){ .rbready{ animation:none !important; } }
          .rbtree::-webkit-scrollbar{ height:8px; width:8px; } .rbtree::-webkit-scrollbar-thumb{ background:#cfc7b6; border-radius:4px; }
          .rbnode:focus-visible{ outline:2px solid ${C.accent}; outline-offset:3px; }
        `}</style>

        {/* header */}
        <div style={{ padding:'52px 22px 14px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.01em' }}>Progression</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>Land a trick to unlock what comes next.</div>
        </div>

        {progAllDone && (
          <div style={{ margin:'12px 16px 0', padding:'11px 14px', borderRadius:12, background:C.accent, color:C.white, fontSize:14, fontWeight:800, textAlign:'center', letterSpacing:'0.08em', flexShrink:0 }}>
            ✦ TREE COMPLETE ✦
          </div>
        )}

        {/* legend — static strip */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', padding:'8px 16px', borderTop:`1px solid ${C.border}`, background:C.bg, flexShrink:0 }}>
          {[['Landed', C.accent, '#0f2ea8'], ['Available', C.accentLight, C.accent], ['Locked', '#e3ddce', '#cabfaa'], ['Skipped', '#EFDCD8', '#C79A93']].map(([l, bg, bd]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:10.5, color:C.muted }}>
              <span style={{ width:12, height:12, borderRadius:4, background:bg, border:`2px solid ${bd}` }} />{l}
            </span>
          ))}
        </div>

        {/* TREE MAP — scrolls both directions */}
        <div style={{ flex:1, borderTop:`1px solid ${C.border}`, position:'relative', overflow:'hidden', background:C.surface }}>
          <div className="rbtree" ref={progTreeRef} style={{ height:'100%', overflow:'auto', padding:'20px 0 28px' }}>
            <div style={{ position:'relative', width:progCanvasW, height:progCanvasH, marginLeft:16 }}>

              <svg width={progCanvasW} height={progCanvasH} style={{ position:'absolute', inset:0 }}>
                {Array.from({ length: progMaxTier + 1 }).map((_, t) => (
                  <line key={'row'+t} x1={0} x2={progCanvasW} y1={PROG_TIER_Y0 + t*PROG_TIER_GAP + PROG_TILE/2} y2={PROG_TIER_Y0 + t*PROG_TIER_GAP + PROG_TILE/2} stroke="#00000008" strokeWidth={PROG_TILE + 26} />
                ))}
                <defs>
                  <marker id="parrOn" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <path d="M1,1 L6,4 L1,7" fill="none" stroke={C.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </marker>
                  <marker id="parrOff" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <path d="M1,1 L6,4 L1,7" fill="none" stroke="#c9c1b0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </marker>
                </defs>
                {edges.map((e) => {
                  const sx = e.a.x, sy = e.a.y + PROG_TILE;
                  const tx = e.b.x, ty = e.b.y - 7;
                  const midY = (sy + ty) / 2;
                  const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
                  return (
                    <path key={e.key} d={d} fill="none"
                      stroke={e.live ? C.accent : '#c9c1b0'}
                      strokeWidth={e.live ? 2.2 : 1.4}
                      strokeDasharray={e.skipped ? '3 4' : undefined}
                      strokeLinejoin="round" strokeLinecap="round"
                      markerEnd={e.live ? 'url(#parrOn)' : 'url(#parrOff)'} />
                  );
                })}
              </svg>

              {PROG_NODES.map((n) => {
                const st = progStateOf(n, progLandedIds, progSkipSet);
                const p = progPos[n.id];
                const wrap = { position:'absolute', left:p.x - PROG_TILE/2, top:p.y, width:PROG_TILE, display:'flex', flexDirection:'column', alignItems:'center', gap:5 };
                const frame = { width:PROG_TILE, height:PROG_TILE, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontWeight:800, fontSize:14.5, fontFamily:"'Iowan Old Style', Georgia, serif", boxSizing:'border-box',
                  transition:'transform .12s', position:'relative', border:'2.5px solid' };
                let sty = {};
                if(st === 'landed') sty = { background:C.accent, borderColor:'#0f2ea8', color:C.white };
                else if(st === 'available') sty = { background:C.accentLight, borderColor:C.accent, color:C.accent };
                else if(st === 'skipped') sty = { background:'#EFDCD8', borderColor:'#C79A93', color:'#A9736C' };
                else sty = { background:'#e3ddce', borderColor:'#cabfaa', color:'#a89f8c', filter:'grayscale(0.6)', opacity:0.85 };
                const label = { fontSize:10.5, fontWeight:700, textAlign:'center', lineHeight:1.15,
                  color: st === 'locked' || st === 'skipped' ? '#9a917e' : C.text,
                  textDecoration: st === 'skipped' ? 'line-through' : 'none', maxWidth:PROG_TILE + 34 };
                const famDot = { position:'absolute', top:-4, right:-4, width:10, height:10, borderRadius:10,
                  border:`2px solid ${C.bg}`, background: progFam(n) === 'soul' ? C.accent : TEAL, opacity: st === 'locked' ? 0.5 : 1 };
                return (
                  <div key={n.id} style={wrap}>
                    <button className={`rbnode ${st === 'available' && progSel !== n.id ? 'rbready' : ''}`} onClick={() => progSelectNode(n.id)}
                      style={{ ...frame, ...sty,
                        ...(progSel === n.id
                          ? { transform:'scale(1.08)', zIndex:5, outline:`3px solid ${PGOLD}`, outlineOffset:2, boxShadow:`0 0 12px 1px ${PGOLD}66` }
                          : (st === 'available' ? { animation:'rbready 2.4s ease-in-out infinite' } : {})) }}>
                      {glyphOf(n)}
                      <span style={famDot} />
                      {st === 'skipped' && (
                        <span style={{ position:'absolute', left:-3, right:-3, top:'50%', height:2.5, background:'#B0554E', borderRadius:2, transform:'rotate(-45deg)', transformOrigin:'center' }} />
                      )}
                    </button>
                    <span style={label}>{progName(n)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DETAIL FOOTER — replaces the bottom nav while a node is selected (decision 3) */}
        {selNode ? (
          <div style={{ borderTop:`2px solid ${C.accent}`, background:C.bg, padding:'14px 16px 16px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
                <span style={{ width:9, height:9, borderRadius:9, background: progFam(selNode) === 'soul' ? C.accent : TEAL, flexShrink:0 }} />
                <span style={{ fontSize:19, color:C.text, fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{progName(selNode)}</span>
                <span style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:C.muted, border:`1px solid ${C.border}`, padding:'2px 7px', borderRadius:20, flexShrink:0 }}>{selState}</span>
              </div>
              <button onClick={progCloseFooter} style={{ color:C.muted, fontSize:22, lineHeight:1, padding:4, flexShrink:0 }}>×</button>
            </div>

            {(() => { const lg = progLegs(selNode); return (
              <div style={{ display:'flex', gap:14, marginBottom:10, fontSize:12 }}>
                <span style={{ color:C.muted }}>Trail <span style={{ color:C.text, fontWeight:600 }}>{lg.trail || 'Grab/Freestyle'}</span></span>
                <span style={{ color:C.muted }}>Lead <span style={{ color:C.text, fontWeight:600 }}>{lg.lead || 'Grab/Freestyle'}</span></span>
              </div>
            ); })()}

            <a href={progBog(selNode)} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12.5, color:C.accent, fontWeight:600, marginBottom:12, textDecoration:'none' }}>Book of Grinds <IconExternal/></a>

            {selState === 'locked' && (
              <div style={{ fontSize:12.5, color:C.muted, marginBottom:12 }}>
                Suggested after: <span style={{ color:C.text, fontWeight:600 }}>{selNode.parents.map(grp => grp.map(p => progName(PROG_BY_ID[p])).join(' + ')).join(', or ')}</span>
              </div>
            )}
            {selState === 'available' && !progConfirmSkip && selNode.parents.length === 0 && (
              <div style={{ fontSize:12, color:C.muted, marginBottom:12, fontStyle:'italic' }}>Fundamental — required, can't be skipped.</div>
            )}
            {(selState === 'available' || selState === 'locked') && progConfirmSkip && (
              <div style={{ fontSize:12.5, color:'#8a3c34', marginBottom:12, background:'#F1DED9', border:'1px solid #D8B3AC', borderRadius:10, padding:'9px 11px' }}>
                Skipping <b>{progName(selNode)}</b> also hides <b>{selStrand}</b> trick{selStrand === 1 ? '' : 's'} below it. Skip the whole branch?
              </div>
            )}
            {selState === 'skipped' && (
              <div style={{ fontSize:12, color:C.muted, marginBottom:12, fontStyle:'italic' }}>Hidden from the frontier. Un-skip to bring it back.</div>
            )}

            <div style={{ display:'flex', gap:9 }}>
              {(selState === 'available' || selState === 'locked') && !progConfirmSkip && (
                <>
                  <button onClick={() => progMarkLanded(selNode)} style={{ flex:1, padding:'12px', borderRadius:11, background:C.accent, color:C.white, fontWeight:800, fontSize:14 }}>Mark Landed</button>
                  {progCanSkip(selNode) && (
                    <button onClick={() => { selStrand > 0 ? setProgConfirmSkip(true) : progDoSkip(selNode); }} style={{ padding:'12px 16px', borderRadius:11, background:C.surface, color:C.muted, fontWeight:700, fontSize:14, border:`1.5px solid ${C.border}` }}>Skip</button>
                  )}
                </>
              )}
              {(selState === 'available' || selState === 'locked') && progConfirmSkip && (
                <>
                  <button onClick={() => progDoSkip(selNode)} style={{ flex:1, padding:'12px', borderRadius:11, background:'#B0554E', color:C.white, fontWeight:800, fontSize:14 }}>Skip branch</button>
                  <button onClick={() => setProgConfirmSkip(false)} style={{ padding:'12px 16px', borderRadius:11, background:C.surface, color:C.muted, fontWeight:700, fontSize:14, border:`1.5px solid ${C.border}` }}>Cancel</button>
                </>
              )}
              {selState === 'landed' && (
                <button onClick={() => progUnmark(selNode)} style={{ flex:1, padding:'12px', borderRadius:11, background:C.accentLight, color:C.accent, fontWeight:700, fontSize:14, border:`1.5px solid ${C.accent}` }}>Unmark Landed</button>
              )}
              {selState === 'skipped' && (
                <button onClick={() => progUnskip(selNode)} style={{ flex:1, padding:'12px', borderRadius:11, background:C.accentLight, color:C.accent, fontWeight:700, fontSize:14, border:`1.5px solid ${C.accent}` }}>{selHasKids ? 'Un-skip Branch' : 'Un-skip'}</button>
              )}
            </div>

            {/* VARIATIONS DRAWER — single-modifier chips (Switch/Negative/Christ/Antichrist/Rough/Tough) */}
            {modsForNode(selNode).length > 0 && (() => {
              const mods = modsForNode(selNode);
              const baseLanded = selState === 'landed';
              const landedN = mods.filter(m => progModLanded(selNode, m.key)).length;
              return (
                <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:11 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:11, letterSpacing:'0.09em', textTransform:'uppercase', color:C.muted, fontWeight:700 }}>Variations</span>
                    {baseLanded && <span style={{ fontSize:11, color: landedN ? C.accent : C.muted, fontWeight:600 }}>{landedN}/{mods.length} landed</span>}
                  </div>
                  {!baseLanded ? (
                    <div style={{ fontSize:12, color:C.muted, fontStyle:'italic' }}>Land {progName(selNode)} first to open its variations.</div>
                  ) : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7, maxHeight:126, overflowY:'auto' }}>
                      {mods.map(m => {
                        const on = progModLanded(selNode, m.key);
                        return (
                          <button key={m.key} onClick={() => on ? progUnmarkMod(selNode, m.key) : progMarkMod(selNode, m.key)}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:9, fontSize:12.5, fontWeight:600,
                              border:`1.5px solid ${on ? C.accent : C.border}`, background: on ? C.accent : C.surface, color: on ? C.white : C.text, cursor:'pointer' }}>
                            <span style={{ width:7, height:7, borderRadius:7, background: on ? C.white : '#cfc7b6', flexShrink:0 }} />
                            {modName(selNode, m.key)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SPIN DRAWER (scale C) — a base grind's spin variants; shares landed sig */}
            {spinsForNode(selNode).length > 0 && (() => {
              const spins = spinsForNode(selNode);
              const dtop = nodeDrawerTop(selNode);
              const baseLanded = selState === 'landed';
              const landedN = spins.filter(s => progSpinLanded(selNode.base, s, dtop)).length;
              return (
                <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:11 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:11, letterSpacing:'0.09em', textTransform:'uppercase', color:C.muted, fontWeight:700 }}>Spins</span>
                    {baseLanded && <span style={{ fontSize:11, color: landedN ? C.accent : C.muted, fontWeight:600 }}>{landedN}/{spins.length} landed</span>}
                  </div>
                  {!baseLanded ? (
                    <div style={{ fontSize:12, color:C.muted, fontStyle:'italic' }}>Land {progName(selNode)} first to open its spins.</div>
                  ) : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7, maxHeight:126, overflowY:'auto' }}>
                      {spins.map(s => {
                        const on = progSpinLanded(selNode.base, s, dtop);
                        return (
                          <button key={s.key} onClick={() => on ? progUnmarkSpin(selNode.base, s, dtop) : progMarkSpin(selNode.base, s, dtop)}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:9, fontSize:12.5, fontWeight:600,
                              border:`1.5px solid ${on ? C.accent : C.border}`, background: on ? C.accent : C.surface, color: on ? C.white : C.text, cursor:'pointer' }}>
                            <span style={{ width:7, height:7, borderRadius:7, background: on ? C.white : '#cfc7b6', flexShrink:0 }} />
                            {spinName(selNode.base, s, dtop)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <BottomNav/>
        )}
      </div>
    );
  }

  // ── GENERATOR SCREEN ──
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.text, height:'100svh', maxWidth:390, margin:'0 auto', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      <div style={{ padding:'20px 22px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={async()=>{ try { await navigator.clipboard.writeText(exportString()); setBackupCopied(true); setTimeout(()=>setBackupCopied(false), 1600); } catch(e) {} }} style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color: backupCopied ? C.accent : C.border, transition:'color 0.2s' }} title="Copy backup">
            <IconExport/>
          </button>
          <button onClick={()=>{ setScreen('landed'); setDataSheet('import'); setImportMsg(''); setImportText(''); }} style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:C.border, transition:'color 0.2s' }} title="Import backup">
            <IconImport/>
          </button>
        </div>
        <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.2em', color:C.muted, textTransform:'uppercase' }}>RB Grind</span>
        <button onClick={copyDebug} style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color: debugCopied ? C.accent : C.border, transition:'color 0.2s' }} title="Copy debug state">
          <IconBug/>
        </button>
      </div>
      {debugCopied && (
        <div style={{ position:'absolute', top:84, left:'50%', transform:'translateX(-50%)', background:C.text, color:C.white, fontSize:11, fontWeight:600, padding:'6px 12px', borderRadius:8, zIndex:60, letterSpacing:'0.04em' }}>
          Debug state copied
        </div>
      )}
      {backupCopied && (
        <div style={{ position:'absolute', top:84, left:'50%', transform:'translateX(-50%)', background:C.text, color:C.white, fontSize:11, fontWeight:600, padding:'6px 12px', borderRadius:8, zIndex:60, letterSpacing:'0.04em' }}>
          Backup copied
        </div>
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'8px 20px 20px', textAlign:'center', overflowY:'auto' }}>
        {poolEmpty ? (
          <div style={{ animation:'fadeIn 0.4s ease forwards', color:C.muted, padding:'40px 16px 0' }}>
            <div style={{ fontSize:28, marginBottom:16 }}>{poolEmpty==='disabled' ? '🎛️' : /^(practice|workonly)-empty/.test(poolEmpty) ? '🎯' : '🏁'}</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.06em', color:C.text, marginBottom:10 }}>
              {poolEmpty==='disabled' ? 'No Tricks Enabled'
                : (poolEmpty==='practice-empty-double' || poolEmpty==='workonly-empty-double') ? 'No Switch-Ups Saved'
                : poolEmpty==='practice-empty' ? 'Nothing to Practice'
                : poolEmpty==='workonly-empty' ? 'Nothing to Work On'
                : 'Pool Complete'}
            </div>
            <div style={{ fontSize:13, lineHeight:1.6, color:C.muted }}>
              {poolEmpty==='disabled'
                ? 'No trick can roll right now. Either every trick is off, or the only ones enabled are gated behind a modifier that\u2019s at 0% (Rough or Negative). Open Tricks to enable more, raise those sliders, or hit Reset.'
                : (poolEmpty==='practice-empty-double' || poolEmpty==='workonly-empty-double')
                ? 'No switch-ups saved yet. Generate a switch-up and mark it landed or working-on, or switch the filter to Single or All.'
                : poolEmpty==='practice-empty'
                ? 'No landed or working-on tricks yet. Land some tricks first, then switch Practice Mode on to drill them.'
                : poolEmpty==='workonly-empty'
                ? 'No working-on tricks yet. Flag some tricks as working-on first, then switch this on to drill just those.'
                : "You've landed every available grind in the current pool. Turn off Hide Landed, or enable more tricks to keep going."}
            </div>
          </div>
        ) : chain && chainDisplay ? (
          <div key={animKey} style={{ animation:'trickIn 0.08s ease forwards', width:'100%', paddingBottom:8 }}>
            <div style={{ minHeight:70, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginBottom:10, gap:5 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:nameFontSize(chainDisplay.main), fontWeight:900, lineHeight:1.02, letterSpacing:'-0.01em', textTransform:'uppercase', color:C.text, wordBreak:'break-word', textAlign:'center' }}>
                {chainDisplay.main}
              </div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:C.muted, marginTop:2 }}>
                Switch-Up
              </div>
              {/* Exit detail toggle — same control as single tricks, expands the chain form */}
              <button onClick={()=>{ setSkipArmed(false); setExitDetailed(d=>!d); }} style={{ marginTop:10, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: exitDetailed ? C.white : C.muted, background: exitDetailed ? C.accent : C.surface, padding:'5px 13px', borderRadius:20, transition:'all 0.18s' }}>
                Detail
              </button>
            </div>
            {showDetail && (
              <div style={{ display:'flex', flexDirection:'column', gap:14, alignItems:'stretch', width:'100%', maxWidth:320, margin:'0 auto' }}>
                {chainDisplay.legs.map((leg,i) => (
                  <div key={i} style={{ background:C.surface, borderRadius:12, padding:'11px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.muted }}>{leg.label}</span>
                      <a href={bogLink(leg.baseId, leg.specialName)} target="_blank" rel="noopener noreferrer" style={{ fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:C.muted, display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none', opacity:0.8 }}>BoG <IconExternal/></a>
                    </div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', lineHeight:1.1, marginBottom:5 }}>{leg.name}</div>
                    <div style={{ fontSize:12, color:C.muted, fontWeight:500 }}>{`Trail: ${leg.trail||'Grab/Freestyle'}  ·  Lead: ${leg.lead||'Grab/Freestyle'}`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : trick && trickDisplay ? (
          <div key={animKey} style={{ animation:'trickIn 0.08s ease forwards', width:'100%' }}>
            <div style={{ minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginBottom:14, gap:6 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:nameFontSize(trickDisplay.main), fontWeight:900, lineHeight:1.02, letterSpacing:'-0.01em', textTransform:'uppercase', color:C.text, wordBreak:'break-word', textAlign:'center' }}>
                {trickDisplay.main}
              </div>
              {/* SUB-NAME (descriptive alias form, e.g. "AO Unity" under "Savannah").
                  HIDDEN for now per Jim — data is kept (Savannah's fsSub/bsSub in BASE,
                  trickDisplay.sub still computed). To re-enable, flip SHOW_SUBNAME to true.
                  Only Savannah has subs defined; extend fsSub/bsSub to other aliases if
                  re-enabling app-wide. */}
              {false && trickDisplay.sub && (<div style={{ fontSize:12, fontWeight:500, color:C.muted, letterSpacing:'0.06em' }}>{trickDisplay.sub}</div>)}
              <a href={bogLink(trick.baseId, trickDisplay.specialName)} target="_blank" rel="noopener noreferrer" style={{ marginTop:4, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:C.muted, display:'inline-flex', alignItems:'center', gap:5, textDecoration:'none', opacity:0.8 }}>
                Book of Grinds <IconExternal/>
              </a>
              {/* Exit detail toggle — directly below the Book of Grinds link */}
              <button onClick={()=>{ setSkipArmed(false); setExitDetailed(d=>!d); }} style={{ marginTop:10, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: exitDetailed ? C.white : C.muted, background: exitDetailed ? C.accent : C.surface, padding:'5px 13px', borderRadius:20, transition:'all 0.18s' }}>
                Detail
              </button>
            </div>
            {showDetail && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                {[{label:'Apch',val: trick.entry.fakieIn ? 'Fakie' : 'Forward'},{label:'Trail',val:trickDisplay.trail},{label:'Lead',val:trickDisplay.lead}].map(row => (
                  <div key={row.label} style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', color:C.muted, textTransform:'uppercase', width:34, textAlign:'right' }}>{row.label}</span>
                    <span style={{ width:1, height:12, background:C.border, flexShrink:0 }}/>
                    <span style={{ fontSize:15, fontWeight:500, color:C.text, textAlign:'left', minWidth:90 }}>{row.val||(row.label==='Apch'?'—':'Grab/Freestyle')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation:'fadeIn 0.5s ease forwards', color:C.muted, paddingTop:80 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Your next grind</div>
            <div style={{ fontSize:14 }}>Tap generate.</div>
          </div>
        )}
      </div>

      {activeChips.length > 0 && (
        <div style={{ paddingBottom:10, paddingLeft:22, paddingRight:22, display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' }}>
          {activeChips.map(chip => (<span key={chip} style={{ fontSize:10, fontWeight:600, color:C.muted, background:C.surface, padding:'3px 8px', borderRadius:20, letterSpacing:'0.04em' }}>{chip}</span>))}
        </div>
      )}

      <div style={{ padding:'0 22px 16px', display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
        {/* Mode / scope control. Off-drill: Single / Switch Up (generation mode, switchUp).
            On-drill: Single / Switch Up / All (filter over the saved pool, practiceScope).
            All logic lives in segModel/segApply so it's node-testable. */}
        <div style={{ display:'flex', background:C.surface, borderRadius:12, padding:3 }}>
          {segModel(filters).pills.map(opt => {
            const on = segModel(filters).value === opt.v;
            return (
              <button key={String(opt.v)} onClick={()=>{ setSkipArmed(false); setFilters(f=>segApply(f, opt.v)); }} style={{ flex:1, padding:'8px 0', borderRadius:9, background:on?C.white:'transparent', color:on?C.text:C.muted, fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', transition:'all 0.16s', boxShadow:on?'0 1px 3px rgba(0,0,0,0.12)':'none' }}>{opt.l}</button>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={goBack} disabled={!prevView} style={{ width:48, height:54, borderRadius:14, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, opacity:prevView?1:0.3, flexShrink:0, transition:'opacity 0.18s' }}><IconUndo/></button>
          <button onClick={()=>generate()} style={{ flex:1, height:54, borderRadius:14, background:busy?'#6B82E0':C.accent, color:C.white, fontSize:14, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', transition:'background 0.15s' }}>Generate</button>
          <button onClick={toggleLanded} disabled={!stateButtonsActive} title="Landed" style={{ width:48, height:54, borderRadius:14, background:isLanded?C.accent:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:isLanded?C.white:C.muted, opacity:stateButtonsActive?1:0.35, flexShrink:0, transition:'background 0.18s, color 0.18s, opacity 0.18s' }}>{isLanded?<IconBookmarkFill/>:<IconBookmarkOutline/>}</button>
          <button onClick={toggleWorking} disabled={!stateButtonsActive} title="Working on — keep this in the rotation to try again" style={{ width:48, height:54, borderRadius:14, background:isWorking?C.accent:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:isWorking?C.white:C.muted, opacity:stateButtonsActive?1:0.35, flexShrink:0, transition:'background 0.18s, color 0.18s, opacity 0.18s' }}>{isWorking?<IconWorkingFill/>:<IconWorkingOutline/>}</button>
          <button
            onClick={()=>{
              if(!tooHardActive) return;
              if(skipArmed){ setSkipArmed(false); skipTrick(); }
              else { setSkipArmed(true); setTimeout(()=>setSkipArmed(false), 3000); }
            }}
            disabled={!tooHardActive}
            title={(filters.practice || filters.workOnly) ? "Drill mode — clear Landed/Working to drop a trick" : (skipArmed ? "Tap again to hide" : "Too hard — hide this trick (tap twice)")}
            style={{ width:48, height:54, borderRadius:14, background: skipArmed ? '#C0392B' : C.surface, display:'flex', alignItems:'center', justifyContent:'center', color: skipArmed ? C.white : C.muted, opacity:tooHardActive?1:0.35, flexShrink:0, transition:'background 0.18s, color 0.18s, opacity 0.18s' }}>
            <IconTooHard/>
          </button>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>openSheet(0)} style={{ flex:1, height:40, borderRadius:11, background:C.surface, color:C.text, fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><IconGrid/>Tricks</button>
          <button onClick={()=>openSheet(1)} style={{ flex:1, height:40, borderRadius:11, background:C.surface, color:C.text, fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><IconFilter/>Filter</button>
        </div>
      </div>

      <BottomNav/>

      {sheetOpen && (
        <FilterSheet
          page={sheetPage} setPage={setSheetPage}
          filters={filters} setFilters={setFilters}
          setSlider={setSlider} setSpin={setSpin} toggleAll={toggleAll}
          resetArmed={resetArmed} setResetArmed={setResetArmed}
          onClose={()=>{ setSheetOpen(false); setResetArmed(false); }}
        />
      )}
    </div>
  );
}

// ══ FILTER SHEET (tap-to-switch tabs, no swipe) ══════════════════════════════
function FilterSheet({ page, setPage, filters, setFilters, setSlider, setSpin, toggleAll, resetArmed, setResetArmed, onClose }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{ position:'fixed', inset:0, background:'rgba(13,11,8,0.4)', zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ background:C.bg, borderRadius:'20px 20px 0 0', height:'86vh', display:'flex', flexDirection:'column', animation:'slideUp 0.24s cubic-bezier(0.32,0.72,0,1) forwards', maxWidth:390, width:'100%', margin:'0 auto' }}>
        {/* Header with segmented tabs */}
        <div style={{ padding:'16px 22px 14px', flexShrink:0, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, display:'flex', background:C.surface, borderRadius:11, padding:3 }}>
            {['Tricks','Filters'].map((label,i)=>(
              <button key={i} onClick={()=>setPage(i)} style={{ flex:1, padding:'8px 0', borderRadius:9, background: page===i ? C.white : 'transparent', color: page===i ? C.text : C.muted, fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', transition:'all 0.18s', boxShadow: page===i ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>{label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}><IconClose/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {page===0 ? (
            <div style={{ padding:'18px 22px 40px' }}>
              <SectionHeader label="Soul Tricks" onAll={()=>toggleAll(SOUL_TRICKS,true)} onNone={()=>toggleAll(SOUL_TRICKS,false)}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                {SOUL_TRICKS.map(b=>(<CheckBox key={b.id} label={b.name} value={filters.tricks[b.id]} onChange={v=>setFilters(f=>({...f,tricks:{...f.tricks,[b.id]:v}}))}/>))}
              </div>
              <div style={{height:22}}/>
              <SectionHeader label="Groove Tricks" onAll={()=>toggleAll(GROOVE_TRICKS,true)} onNone={()=>toggleAll(GROOVE_TRICKS,false)}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                {GROOVE_TRICKS.map(b=>(<CheckBox key={b.id} label={b.name} value={filters.tricks[b.id]} onChange={v=>setFilters(f=>({...f,tricks:{...f.tricks,[b.id]:v}}))}/>))}
              </div>
            </div>
          ) : (
            <div style={{ padding:'18px 22px 40px' }}>
              <SheetLabel>Session</SheetLabel>
              <ToggleRow label="Work-On Only" sublabel="Drill only tricks you've flagged as working-on" value={filters.workOnly} onChange={v=>setFilters(f=>drillToggle(f,'workOnly',v))}/>
              <ToggleRow label="Practice Mode" sublabel={filters.workOnly ? "Off while Work-On Only is on" : "Drill only tricks you've landed or are working on"} value={filters.practice} disabled={filters.workOnly} onChange={v=>setFilters(f=>drillToggle(f,'practice',v))}/>
              <ToggleRow label="Hide Landed" sublabel={(filters.workOnly || filters.practice) ? "Off while a drill mode is on" : "Skip tricks you've already landed"} value={filters.hideLanded} disabled={filters.workOnly || filters.practice} onChange={v=>setFilters(f=>({...f,hideLanded:v}))}/>

              <div style={{height:18}}/>
              <SheetLabel>Display</SheetLabel>
              <ToggleRow label="Special Names First" sublabel="e.g. Soyale, Fishbrain, Savannah" value={filters.specialFirst} onChange={v=>setFilters(f=>({...f,specialFirst:v}))}/>

              <div style={{height:18}}/>
              <SheetLabel>In Spins</SheetLabel>
              <RangeSlider min={filters.spins.inMin} max={filters.spins.inMax} onChange={(lo,hi)=>setFilters(f=>({...f,spins:{...f.spins,inMin:lo,inMax:hi}}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px', marginTop:6, alignItems:'center' }}>
                <SliderRow label="Fakie In" value={filters.spins.fakieIn} onChange={v=>setSpin('fakieIn',v)}/>
                <ToggleRow label="Truespin" value={filters.spins.truespin} onChange={v=>setSpin('truespin',v)} compact/>
              </div>

              <div style={{height:14}}/>
              <SheetLabel>Switch-Up Spins</SheetLabel>
              <div style={{ fontSize:12, color:C.muted, marginBottom:10, lineHeight:1.4 }}>Transition spin between the two grinds in a Double switch-up.</div>
              <RangeSlider min={filters.spins.suMin} max={filters.spins.suMax} onChange={(lo,hi)=>setFilters(f=>({...f,spins:{...f.spins,suMin:lo,suMax:hi}}))}/>
              <div style={{ marginTop:6 }}>
                <SliderRow label="Rewind" value={filters.spins.suRewind} onChange={v=>setSpin('suRewind',v)}/>
              </div>

              <div style={{height:14}}/>
              <SheetLabel>Out Spins</SheetLabel>
              <RangeSlider min={filters.spins.outMin} max={filters.spins.outMax} onChange={(lo,hi)=>setFilters(f=>({...f,spins:{...f.spins,outMin:lo,outMax:hi}}))}/>
              <div style={{ marginTop:6 }}>
                <SliderRow label="Rewind Out" value={filters.spins.rewindOut} onChange={v=>setSpin('rewindOut',v)}/>
              </div>

              <div style={{height:10}}/>
              <SheetLabel>Probability</SheetLabel>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px' }}>
                <SliderRow label="Topside" value={filters.sliders.topside} onChange={v=>setSlider('topside',v)}/>
                <SliderRow label="Switch" value={filters.sliders.switch} onChange={v=>setSlider('switch',v)}/>
                <SliderRow label="Negative" value={filters.sliders.negative} onChange={v=>setSlider('negative',v)}/>
                <SliderRow label="Christ" value={filters.sliders.christ} onChange={v=>setSlider('christ',v)}/>
                <SliderRow label="Anti Christ" value={filters.sliders.antichrist} onChange={v=>setSlider('antichrist',v)}/>
                <SliderRow label="Rough" value={filters.sliders.rough} onChange={v=>setSlider('rough',v)}/>
                <SliderRow label="Tough" value={filters.sliders.tough} onChange={v=>setSlider('tough',v)}/>
              </div>

              <div style={{height:14}}/>
              <button
                onClick={()=>{ setFilters(makeInitFilters(!filters.testMode)); }}
                style={{ width:'100%', padding:'12px', borderRadius:12,
                  background: filters.testMode ? '#2e7d32' : C.surface,
                  color: filters.testMode ? C.white : C.accent,
                  fontSize:13, fontWeight:600, letterSpacing:'0.04em', transition:'all 0.18s' }}
              >
                {filters.testMode ? '● TEST MODE ON — tap to turn off' : 'Test Mode (crank everything for naming tests)'}
              </button>

              <div style={{height:10}}/>
              <button
                onClick={()=>{
                  if(resetArmed){ setFilters(makeInitFilters()); setResetArmed(false); }
                  else { setResetArmed(true); setTimeout(()=>setResetArmed(false), 3000); }
                }}
                style={{ width:'100%', padding:'12px', borderRadius:12, background: resetArmed ? '#C0392B' : C.surface, color: resetArmed ? C.white : C.accent, fontSize:13, fontWeight:600, letterSpacing:'0.04em', transition:'all 0.18s' }}
              >
                {resetArmed ? 'Tap again to reset everything' : 'Reset all to defaults'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══ SUB-COMPONENTS ═══════════════════════════════════════════════════════════
function SectionHeader({ label, onAll, onNone }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.muted }}>{label}</span>
      <div style={{ display:'flex', gap:6 }}>
        {[{l:'All',fn:onAll},{l:'None',fn:onNone}].map(({l,fn})=>(<button key={l} onClick={fn} style={{ fontSize:11, fontWeight:600, color:C.accent, padding:'2px 8px', borderRadius:6, background:C.accentLight }}>{l}</button>))}
      </div>
    </div>
  );
}
function SheetLabel({ children }) {
  return <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.muted, marginBottom:12 }}>{children}</div>;
}
function ToggleRow({ label, sublabel, value, onChange, compact, disabled }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:compact?0:16, opacity:disabled?0.4:1 }}>
      <div>
        <div style={{ fontSize:compact?15:16, fontWeight:500, color:C.text }}>{label}</div>
        {sublabel && <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{sublabel}</div>}
      </div>
      <div onClick={()=>{ if(!disabled) onChange(!value); }} style={{ width:46, height:26, borderRadius:13, flexShrink:0, background:value?C.accent:C.border, position:'relative', cursor:disabled?'default':'pointer', transition:'background 0.18s ease' }}>
        <div style={{ position:'absolute', top:3, left:value?23:3, width:20, height:20, borderRadius:'50%', background:C.white, transition:'left 0.18s ease', boxShadow:'0 1px 3px rgba(0,0,0,0.18)' }}/>
      </div>
    </div>
  );
}
function SliderRow({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:15, fontWeight:500, color:C.text }}>{label}</span>
        <span style={{ fontSize:14, fontWeight:700, color:value>0?C.accent:C.muted }}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" step="5" value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}
function RangeSlider({ min, max, onChange }) {
  const STOPS = [0,90,180,270,360,450,540];
  const trackRef = useRef(null);
  const dragging = useRef(null); // 'min' | 'max' | null
  const PCT = (v) => (v/540)*100;

  // Convert a clientX to the nearest stop value (0..540)
  const xToValue = (clientX) => {
    const el = trackRef.current;
    if(!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = ratio * 540;
    return STOPS.reduce((a,b) => Math.abs(b-raw) < Math.abs(a-raw) ? b : a, STOPS[0]);
  };

  const apply = (which, v) => {
    if(which==='min') onChange(Math.min(v, max), max);
    else onChange(min, Math.max(v, min));
  };

  const startDrag = (clientX) => {
    const v = xToValue(clientX);
    // pick the nearest handle; if equal distance, prefer the one that lets you move away from the edge
    const dMin = Math.abs(v - min), dMax = Math.abs(v - max);
    let which;
    if(dMin < dMax) which = 'min';
    else if(dMax < dMin) which = 'max';
    else which = (v <= min) ? 'min' : 'max'; // tie: left side grabs min, right grabs max
    dragging.current = which;
    apply(which, v);
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    startDrag(x);
    const move = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      if(dragging.current) apply(dragging.current, xToValue(cx));
    };
    const up = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive:false });
    window.addEventListener('touchend', up);
  };

  const Thumb = ({ v }) => (
    <div style={{ position:'absolute', left:`${PCT(v)}%`, top:'50%', transform:'translate(-50%,-50%)', width:28, height:28, borderRadius:'50%', background:C.accent, border:`3px solid ${C.bg}`, boxShadow:'0 2px 6px rgba(0,0,0,0.3)', pointerEvents:'none' }}/>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
        <span style={{ fontSize:15, fontWeight:700, color:C.accent }}>
          {min===max ? `${max}°` : `${min}° – ${max}°`}
        </span>
      </div>
      {/* track — tap or drag anywhere, nearest handle follows */}
      <div ref={trackRef}
        onMouseDown={onPointerDown} onTouchStart={onPointerDown}
        style={{ position:'relative', height:40, margin:'0 16px', cursor:'pointer', touchAction:'none' }}>
        <div style={{ position:'absolute', left:0, right:0, top:'50%', transform:'translateY(-50%)', height:6, borderRadius:3, background:C.border }}/>
        <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', height:6, borderRadius:3, background:C.accent, left:`${PCT(min)}%`, right:`${100-PCT(max)}%` }}/>
        <Thumb v={min}/>
        <Thumb v={max}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', margin:'8px 16px 0' }}>
        {STOPS.map(d => {
          const inRange = d>=min && d<=max;
          return <span key={d} style={{ fontSize:11, fontWeight:inRange?700:500, color:inRange?C.accent:C.muted }}>{d}</span>;
        })}
      </div>
    </div>
  );
}
function CheckBox({ label, value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{ display:'flex', alignItems:'center', gap:9, padding:'11px 12px', borderRadius:11, cursor:'pointer', background:value?C.accentLight:C.surface, border:`1.5px solid ${value?C.accent:'transparent'}`, transition:'all 0.14s ease' }}>
      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, background:value?C.accent:'transparent', border:`1.5px solid ${value?C.accent:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.14s ease' }}>
        {value&&<svg width="11" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize:14, fontWeight:500, color:C.text, lineHeight:1.2 }}>{label}</span>
    </div>
  );
}
