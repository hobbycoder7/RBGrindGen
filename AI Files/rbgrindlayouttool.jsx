import React, { useState, useRef } from 'react';

// ── RB Grind — row layout tool ───────────────────────────────────────────────
// Drag tiles between rows, export a PROG_ROWS block, paste it back to Claude.
//
// NOTE: `rbgrind-layout-tool.html` in this folder is the same tool as a plain
// self-contained page — no React, so it opens on a phone, and it's the version
// published as an Artifact. This .jsx is kept only for the React workflow. Two
// copies means two things to update: regenerate BOTH from the engine (below),
// or delete whichever one you've stopped using.
//
// TILES and INITIAL_ROWS below are generated FROM THE ENGINE, not hand-typed —
// the previous copy of this tool had drifted (49 tiles instead of 51, Nine Bar
// and BS Nine Bar missing entirely, and four stale glyphs: Top Mistrial was
// OVP not TM, Top Pornstar SD not TP, AO Top Mistrial MFT not ATM, AO Top
// Pornstar CN not ATP — plus Soul/Mizu shown as children of Makio when they're
// actually roots). To regenerate after any tree change:
//
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc \
//     RBGrind/Engine/grind_engine.js "AI Files/prog_dump.js"
//
// which emits id/name/glyph/parents/tier/x from PROG_NODES + PROG_GLYPHS +
// progName, so this tool can never disagree with what the app actually draws.
//
// Generated against the tree as of the Fastslide/Pudslide move (51 tiles).
const TILES = [
  { id: 'makio', name: 'Makio', glyph: 'MAK', parents: '' },
  { id: 'soul', name: 'Soul', glyph: 'SOL', parents: '' },
  { id: 'mizu', name: 'Mizu', glyph: 'MIZ', parents: '' },
  { id: 'acid', name: 'Acid', glyph: 'ACD', parents: 'Soul' },
  { id: 'xgrind', name: 'X-Grind', glyph: 'XGR', parents: 'Soul' },
  { id: 'stubsoul', name: 'Stub Soul', glyph: 'SS', parents: 'Soul' },
  { id: 'pornstar', name: 'Pornstar', glyph: 'PRN', parents: 'Mizu' },
  { id: 'mistrial', name: 'Mistrial', glyph: 'MIS', parents: 'Mizu + Acid or Pornstar' },
  { id: 'torquesoul', name: 'Torque Soul', glyph: 'TQS', parents: 'Soul or Full Torque' },
  { id: 'teakettle', name: 'Tea Kettle', glyph: 'TEA', parents: 'Pornstar' },
  { id: 'hotdog', name: 'Hot Dog', glyph: 'HTD', parents: 'Soul' },
  { id: 'fishbrain', name: 'Fishbrain', glyph: 'FSH', parents: 'Makio' },
  { id: 'sweatstance', name: 'Sweatstance', glyph: 'SWT', parents: 'Mizu' },
  { id: 'overpuss', name: 'Top Mistrial', glyph: 'TM', parents: 'Mistrial' },
  { id: 'sunnyday', name: 'Top Pornstar', glyph: 'TP', parents: 'Pornstar' },
  { id: 'kindgrind', name: 'Kindgrind', glyph: 'KND', parents: 'Mizu' },
  { id: 'misfit', name: 'AO Top Mistrial', glyph: 'ATM', parents: 'Top Mistrial' },
  { id: 'cloudynight', name: 'AO Top Pornstar', glyph: 'ATP', parents: 'Top Pornstar' },
  { id: 'ts_soul', name: 'Top Soul', glyph: 'TS', parents: 'Soul' },
  { id: 'ts_acid', name: 'Top Acid', glyph: 'TA', parents: 'Acid' },
  { id: 'ts_torquesoul', name: 'Top Torque Soul', glyph: 'TTS', parents: 'Torque Soul' },
  { id: 'frontside', name: 'Frontside', glyph: 'FS', parents: '' },
  { id: 'backside', name: 'Backside', glyph: 'BS', parents: 'Frontside' },
  { id: 'royale', name: 'Royale', glyph: 'ROY', parents: 'Frontside' },
  { id: 'farv', name: 'Full Torque', glyph: 'FTQ', parents: 'Frontside' },
  { id: 'backslide', name: 'Backslide', glyph: 'BSL', parents: 'Royale' },
  { id: 'torque_g', name: 'Torque', glyph: 'TRQ', parents: 'Full Torque' },
  { id: 'cabdriver', name: 'Cab Driver', glyph: 'CAB', parents: 'Backslide or Torque' },
  { id: 'unity', name: 'Unity', glyph: 'UNI', parents: 'Pornstar' },
  { id: 'savannah', name: 'Savannah', glyph: 'SAV', parents: 'Unity' },
  { id: 'bs_backslide', name: 'BS Backslide', glyph: 'BSB', parents: 'Backslide' },
  { id: 'bs_farv', name: 'BS Full Torque', glyph: 'BFT', parents: 'Full Torque' },
  { id: 'bs_torque', name: 'BS Torque', glyph: 'BTQ', parents: 'Torque' },
  { id: 'bs_unity', name: 'BS Unity', glyph: 'BUN', parents: 'Unity' },
  { id: 'bs_royale', name: 'BS Royale', glyph: 'BRO', parents: 'Royale' },
  { id: 'bs_cabdriver', name: 'BS Cab Driver', glyph: 'BCD', parents: 'Cab Driver' },
  { id: 'bs_ufo', name: 'BS UFO', glyph: 'BFO', parents: 'UFO' },
  { id: 'bs_tabernacle', name: 'BS Tabernacle', glyph: 'BTB', parents: 'Tabernacle' },
  { id: 'bs_darkslide', name: 'BS Darkslide', glyph: 'BDS', parents: 'Darkslide' },
  { id: 'bs_wheelbarrow', name: 'BS Wheelbarrow', glyph: 'BWB', parents: 'Wheelbarrow' },
  { id: 'bs_ninebar', name: 'BS Nine Bar', glyph: 'BNB', parents: 'Nine Bar' },
  { id: 'bs_savannah', name: 'BS Savannah', glyph: 'BSV', parents: 'Savannah' },
  { id: 'ts_bynsoul', name: 'Top Byn Soul', glyph: 'TBN', parents: 'Byn Soul' },
  { id: 'ufo', name: 'UFO', glyph: 'UFO', parents: 'Frontside' },
  { id: 'fastslide', name: 'Fastslide', glyph: 'FSL', parents: 'Frontside' },
  { id: 'pudslide', name: 'Pudslide', glyph: 'PUD', parents: 'Frontside' },
  { id: 'tabernacle', name: 'Tabernacle', glyph: 'TAB', parents: 'Acid + Frontside' },
  { id: 'bynsoul', name: 'Byn Soul', glyph: 'BYN', parents: 'Soul' },
  { id: 'darkslide', name: 'Darkslide', glyph: 'DSL', parents: 'Acid + Backslide' },
  { id: 'wheelbarrow', name: 'Wheelbarrow', glyph: 'WB', parents: 'Royale or Backslide' },
  { id: 'ninebar', name: 'Nine Bar', glyph: 'NB', parents: 'Wheelbarrow' },
];

const INITIAL_ROWS = [
  ['makio', 'frontside'],
  ['soul', 'backside', 'mizu', 'ufo', 'royale', 'fastslide'],
  ['acid', 'xgrind', 'pornstar', 'bs_ufo', 'bs_royale', 'pudslide'],
  ['mistrial', 'bynsoul', 'unity', 'backslide', 'farv', 'hotdog'],
  ['torquesoul', 'ts_bynsoul', 'bs_unity', 'torque_g', 'bs_farv', 'stubsoul'],
  ['ts_torquesoul', 'ts_soul', 'ts_acid', 'bs_torque', 'cabdriver', 'sunnyday', 'kindgrind'],
  ['savannah', 'wheelbarrow', 'teakettle', 'tabernacle', 'bs_cabdriver', 'overpuss', 'sweatstance'],
  ['bs_savannah', 'bs_wheelbarrow', 'ninebar', 'fishbrain', 'bs_tabernacle', 'cloudynight', 'misfit', 'bs_backslide'],
  ['bs_ninebar', 'darkslide'],
  ['bs_darkslide'],
];

const TILE_COUNT = TILES.length;
const BY_ID = Object.fromEntries(TILES.map(t => [t.id, t]));

const C = {
  bg: '#F4F0E6', panel: '#FBF9F3', border: '#DCD5C2', text: '#2B2620', muted: '#8A8272',
  tileBg: '#EAE7FA', tileBorder: '#3B4FCB', accent: '#3B4FCB', accentSoft: '#E2E6FB',
  pickedBg: '#3B4FCB', pickedText: '#FFFFFF', slotHover: '#B9C2F5',
};

function serializeRows(rows) {
  const lines = rows.map(r => `  [${r.map(id => `'${id}'`).join(', ')}],`);
  return `const PROG_ROWS = [\n${lines.join('\n')}\n];`;
}

export default function LayoutTool() {
  const [rows, setRows] = useState(INITIAL_ROWS.map(r => r.slice()));
  const [picked, setPicked] = useState(null); // tile id currently "held"
  const [dragId, setDragId] = useState(null); // native HTML5 drag (desktop mouse)
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState(null); // { ok: bool, text: string }
  const taRef = useRef(null);

  const ALL_IDS = TILES.map(t => t.id);
  const ID_SET = new Set(ALL_IDS);

  const parseImport = (text) => {
    const rowMatches = [...text.matchAll(/\[([^\[\]]*)\]/g)];
    return rowMatches.map(m => [...m[1].matchAll(/['"]([a-zA-Z0-9_]+)['"]/g)].map(x => x[1]));
  };

  const loadImport = () => {
    const parsed = parseImport(importText);
    if (!parsed.length) { setImportMsg({ ok: false, text: 'Couldn’t find any rows — paste the PROG_ROWS array (or just the [\'id\', \'id\'] lines).' }); return; }
    const flat = parsed.flat();
    const unknown = flat.filter(id => !ID_SET.has(id));
    if (unknown.length) { setImportMsg({ ok: false, text: 'Unknown tile id' + (unknown.length > 1 ? 's' : '') + ': ' + unknown.join(', ') + ' — nothing loaded.' }); return; }
    const seen = new Set(); const dupes = [];
    flat.forEach(id => { if (seen.has(id)) dupes.push(id); seen.add(id); });
    if (dupes.length) { setImportMsg({ ok: false, text: 'Duplicate tile' + (dupes.length > 1 ? 's' : '') + ': ' + [...new Set(dupes)].join(', ') + ' — nothing loaded.' }); return; }
    const missing = ALL_IDS.filter(id => !flat.includes(id));
    const next = parsed.map(r => r.slice());
    if (missing.length) next.push(missing);
    setRows(next);
    setPicked(null);
    setImportMsg(missing.length
      ? { ok: true, text: 'Loaded. ' + missing.length + ' tile' + (missing.length > 1 ? 's were' : ' was') + ' missing from the paste, added as a new row at the end so nothing’s lost: ' + missing.map(id => BY_ID[id].name).join(', ') + '.' }
      : { ok: true, text: 'Loaded — all ' + TILE_COUNT + ' tiles placed.' });
    setImportText('');
  };

  const findPos = (id) => {
    for (let r = 0; r < rows.length; r++) {
      const i = rows[r].indexOf(id);
      if (i >= 0) return { r, i };
    }
    return null;
  };

  const moveTo = (id, toRow, toPos) => {
    setRows(prev => {
      const next = prev.map(r => r.slice());
      let fromRow = -1, fromPos = -1;
      for (let r = 0; r < next.length; r++) {
        const i = next[r].indexOf(id);
        if (i >= 0) { fromRow = r; fromPos = i; break; }
      }
      if (fromRow < 0) return prev;
      next[fromRow].splice(fromPos, 1);
      let insertPos = toPos;
      if (fromRow === toRow && fromPos < toPos) insertPos -= 1;
      next[toRow].splice(insertPos, 0, id);
      return next;
    });
    setPicked(null);
  };

  const onTileClick = (id) => {
    if (picked === id) { setPicked(null); return; }
    if (picked) {
      // dropping picked tile just before the clicked tile
      const pos = findPos(id);
      if (pos) moveTo(picked, pos.r, pos.i);
    } else {
      setPicked(id);
    }
  };

  const onSlotClick = (r, i) => {
    if (picked) moveTo(picked, r, i);
  };

  const addRow = () => setRows(prev => [...prev, []]);
  const removeRow = (r) => {
    if (rows[r].length) return; // safety: only delete empty rows
    setRows(prev => prev.filter((_, idx) => idx !== r));
  };
  const resetLayout = () => { setRows(INITIAL_ROWS.map(r => r.slice())); setPicked(null); };

  const exportText = serializeRows(rows);
  const placed = rows.reduce((n, r) => n + r.length, 0);

  const copyExport = async () => {
    try { await navigator.clipboard.writeText(exportText); }
    catch { taRef.current && taRef.current.select(); }
  };
  const downloadExport = () => {
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'PROG_ROWS.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text, paddingBottom: 100 }}>
      <div style={{ padding: '18px 16px 10px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>RB Grind — Row Layout Tool</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
          Tap a tile to pick it up, then tap where it should go — works the same on phone or desktop.
          (You can also drag tiles directly with a mouse.) Small text under each tile shows what unlocks it.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={addRow} style={btnStyle(C)}>+ Add Row</button>
          <button onClick={resetLayout} style={btnStyle(C)}>Reset to Current</button>
          <button onClick={() => { setShowImport(s => !s); setShowExport(false); }} style={btnStyle(C)}>
            {showImport ? 'Hide Import' : 'Import'}
          </button>
          <button onClick={() => { setShowExport(s => !s); setShowImport(false); }} style={{ ...btnStyle(C), background: C.accent, color: '#fff', borderColor: C.accent }}>
            {showExport ? 'Hide Export' : 'Export'}
          </button>
          <span style={{ fontSize: 12, color: placed === TILE_COUNT ? C.muted : '#B3453B', fontWeight: 700, alignSelf: 'center' }}>
            {placed}/{TILE_COUNT} tiles placed
          </span>
          {picked && (
            <span style={{ fontSize: 12.5, color: C.accent, fontWeight: 700, alignSelf: 'center', marginLeft: 4 }}>
              Holding {BY_ID[picked].name} — tap a slot or tile to place it
            </span>
          )}
        </div>
      </div>

      {showImport && (
        <div style={{ margin: '14px 16px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Import — paste a PROG_ROWS block (from an export, or from Claude)
          </div>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
            placeholder={"const PROG_ROWS = [\n  ['makio', 'frontside'],\n  ...\n];"}
            style={{ width: '100%', minHeight: 160, fontFamily: 'monospace', fontSize: 12.5, padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={loadImport} style={{ ...btnStyle(C), background: C.accent, color: '#fff', borderColor: C.accent }}>Load Layout</button>
            {importMsg && (
              <span style={{ fontSize: 12, fontWeight: 600, color: importMsg.ok ? '#2E7D4F' : '#B3453B' }}>{importMsg.text}</span>
            )}
          </div>
        </div>
      )}

      {showExport && (
        <div style={{ margin: '14px 16px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Export — paste this back to Claude
          </div>
          <textarea ref={taRef} readOnly value={exportText}
            style={{ width: '100%', minHeight: 220, fontFamily: 'monospace', fontSize: 12.5, padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={copyExport} style={btnStyle(C)}>Copy</button>
            <button onClick={downloadExport} style={btnStyle(C)}>Download .txt</button>
          </div>
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        {rows.map((row, r) => (
          <div key={r} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.06em' }}>ROW {r + 1}</span>
              <span style={{ fontSize: 11, color: C.muted }}>· {row.length} tile{row.length === 1 ? '' : 's'}</span>
              {row.length === 0 && (
                <button onClick={() => removeRow(r)} style={{ ...btnStyle(C), padding: '2px 8px', fontSize: 11 }}>Remove empty row</button>
              )}
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (dragId) moveTo(dragId, r, row.length); setDragId(null); }}
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2, minHeight: 78, background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '8px 6px' }}
            >
              <Slot C={C} active={!!picked} onClick={() => onSlotClick(r, 0)}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragId) moveTo(dragId, r, 0); setDragId(null); }} />
              {row.map((id, i) => (
                <React.Fragment key={id}>
                  <Tile C={C} tile={BY_ID[id]} picked={picked === id}
                    onClick={() => onTileClick(id)}
                    draggable
                    onDragStart={() => setDragId(id)}
                    onDragEnd={() => setDragId(null)}
                  />
                  <Slot C={C} active={!!picked} onClick={() => onSlotClick(r, i + 1)}
                    onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragId) moveTo(dragId, r, i + 1); setDragId(null); }} />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function btnStyle(C) {
  return { padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' };
}

function Slot({ C, active, onClick, onDragOver, onDrop }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { onDragOver(e); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { setHover(false); onDrop(e); }}
      style={{
        width: active || hover ? 14 : 6, alignSelf: 'stretch', minHeight: 62,
        background: hover ? C.accent : active ? C.slotHover : 'transparent',
        borderRadius: 5, transition: 'width 0.1s, background 0.1s', cursor: active ? 'pointer' : 'default',
      }}
    />
  );
}

function Tile({ C, tile, picked, onClick, ...dragProps }) {
  return (
    <div
      onClick={onClick}
      {...dragProps}
      style={{
        width: 64, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '4px 2px', borderRadius: 8, background: picked ? C.pickedBg : 'transparent',
        transform: picked ? 'translateY(-3px)' : 'none', transition: 'transform 0.1s',
        boxShadow: picked ? '0 4px 10px rgba(59,79,203,0.35)' : 'none',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: picked ? C.pickedText : C.tileBg, border: `2px solid ${picked ? C.pickedText : C.tileBorder}`,
        fontFamily: "'Iowan Old Style', Georgia, serif", fontWeight: 800, fontSize: 13.5,
        color: picked ? C.pickedBg : C.tileBorder,
      }}>
        {tile.glyph}
      </div>
      <div style={{ fontSize: 9.5, fontWeight: 700, textAlign: 'center', lineHeight: 1.15, color: picked ? C.pickedText : C.text }}>
        {tile.name}
      </div>
      {tile.parents && (
        <div style={{ fontSize: 8, color: picked ? C.accentSoft : C.muted, textAlign: 'center', lineHeight: 1.1 }}>
          ← {tile.parents}
        </div>
      )}
    </div>
  );
}
