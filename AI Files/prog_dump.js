// Dump the real tree geometry + tile metadata straight from the engine.
var tiers = progTiers(PROG_NODES);
var xs = progLayoutX(PROG_NODES, tiers);

function parentText(n) {
  // parents = OR of AND-groups
  return n.parents.map(function (grp) {
    return grp.map(function (p) { return progName(PROG_BY_ID[p]); }).join(' + ');
  }).join(' or ');
}

var out = {
  tile: PROG_TILE, mingap: PROG_MINGAP, tierY0: PROG_TIER_Y0, tierGap: PROG_TIER_GAP,
  nodes: PROG_NODES.map(function (n) {
    return {
      id: n.id,
      name: progName(n),
      glyph: PROG_GLYPHS[n.id],
      tier: tiers[n.id],
      x: xs[n.id],
      y: PROG_TIER_Y0 + tiers[n.id] * PROG_TIER_GAP,
      parents: parentText(n),
      parentIds: progFlatParents(n),
    };
  }),
};
print(JSON.stringify(out));
