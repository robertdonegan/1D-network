// A "reach" is a maximal chain of edges through pass-through (degree-2)
// nodes, terminating at a boundary (degree 1) or a confluence/diverging
// point (degree >= 3) — mirroring how a real river network names one
// stretch a "reach" and treats parallel/converging channels as separate
// reaches meeting at a shared node, rather than tagging individual units.
//
// Auto-detected reaches get a *stable* key (the sorted pair of their two
// boundary node ids) instead of a discovery-order index, so unrelated edits
// elsewhere in the network don't reshuffle every reach's identity. Users can
// also override an edge's reach manually (edge.reach); that always wins
// over the auto-detected grouping.
export const REACH_PALETTE = [
  "#2e7d32", "#1976d2", "#c2185b", "#f57c00",
  "#00838f", "#6a1b9a", "#5d4037", "#455a64",
];

export function reachColor(index) {
  return REACH_PALETTE[index % REACH_PALETTE.length];
}

export function computeReaches(nodes, edges) {
  const degree = {};
  edges.forEach((e) => {
    degree[e.from] = (degree[e.from] || 0) + 1;
    degree[e.to] = (degree[e.to] || 0) + 1;
  });
  const byId = Object.fromEntries(edges.map((e) => [e.id, e]));
  const atNode = {};
  edges.forEach((e) => {
    (atNode[e.from] ||= []).push(e.id);
    (atNode[e.to] ||= []).push(e.id);
  });
  const otherEnd = (edgeId, nodeId) => {
    const e = byId[edgeId];
    return e.from === nodeId ? e.to : e.from;
  };

  const visited = new Set();
  const reaches = [];

  edges.forEach((e) => {
    if (visited.has(e.id)) return;
    visited.add(e.id);

    // Walk forward from e.to through consecutive degree-2 (pass-through) nodes.
    const fwd = [e.id];
    let curNode = e.to, curEdge = e.id;
    while (degree[curNode] === 2) {
      const next = (atNode[curNode] || []).find((id) => id !== curEdge && !visited.has(id));
      if (!next) break;
      fwd.push(next); visited.add(next);
      curEdge = next; curNode = otherEnd(next, curNode);
    }
    const endNode = curNode;

    // Walk backward from e.from the same way, prepending.
    const back = [];
    curNode = e.from; curEdge = e.id;
    while (degree[curNode] === 2) {
      const next = (atNode[curNode] || []).find((id) => id !== curEdge && !visited.has(id));
      if (!next) break;
      back.unshift(next); visited.add(next);
      curEdge = next; curNode = otherEnd(next, curNode);
    }
    const startNode = curNode;

    reaches.push({ key: [startNode, endNode].sort().join("|"), edgeIds: [...back, ...fwd] });
  });

  // Rare case: two edge-disjoint reaches sharing the same boundary pair
  // (a braided channel rejoining at the same two confluence points) would
  // otherwise collide onto one key — disambiguate the repeats.
  const seen = {};
  reaches.forEach((r) => {
    seen[r.key] = (seen[r.key] || 0) + 1;
    if (seen[r.key] > 1) r.key = r.key + "#" + seen[r.key];
  });

  return { reaches, degree };
}

// Layers manual per-edge overrides on top of the auto-detected grouping and
// derives everything the UI needs: a display registry, a colour per edge,
// and which edge ids currently share each resolved reach (so reassigning
// one clicked segment can move its whole visible stretch at once).
export function resolveReaches(nodes, edges) {
  const { reaches: autoReaches, degree } = computeReaches(nodes, edges);
  const autoKeyByEdge = {};
  autoReaches.forEach((r) => r.edgeIds.forEach((id) => { autoKeyByEdge[id] = r.key; }));

  const resolvedKeyByEdge = {};
  edges.forEach((e) => { resolvedKeyByEdge[e.id] = e.reach || autoKeyByEdge[e.id]; });

  const orderedKeys = [];
  edges.forEach((e) => {
    const k = resolvedKeyByEdge[e.id];
    if (k && !orderedKeys.includes(k)) orderedKeys.push(k);
  });
  const registry = orderedKeys.map((key, i) => ({ key, name: "Reach " + (i + 1), color: reachColor(i) }));
  const colorByKey = Object.fromEntries(registry.map((r) => [r.key, r.color]));

  const edgeColors = {};
  const edgesByKey = {};
  edges.forEach((e) => {
    const k = resolvedKeyByEdge[e.id];
    edgeColors[e.id] = colorByKey[k] || "var(--reach)";
    if (k) (edgesByKey[k] ||= []).push(e.id);
  });

  return { resolvedKeyByEdge, registry, edgeColors, edgesByKey, degree };
}
