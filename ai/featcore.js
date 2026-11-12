// Vəziyyətin kodlanması — həm öyrətmədə (node), həm telefonda (tətbiq) EYNİ kod.
// st: { TS, my[], oppKnown[], oppN, gone[], tA[], tD[], iAtt, tk, fd, deck, trumpCard, trf, deckSize, draw }
(function (root) {
  var NSLOT = 36, NF = NSLOT * 6 + 12;
  function slot(c, TS) { return ((((c / 13) | 0) - TS + 4) & 3) * 9 + (c % 13 - 4); }
  function durakFeat(st, x) {
    x = x || new Float32Array(NF); x.fill(0);
    var TS = st.TS, i, c, myT = 0, knT = 0, nD = 0;
    for (i = 0; i < st.my.length; i++) { c = st.my[i]; x[slot(c, TS)] = 1; if (((c / 13) | 0) === TS) myT++; }
    for (i = 0; i < st.oppKnown.length; i++) { c = st.oppKnown[i]; x[NSLOT + slot(c, TS)] = 1; if (((c / 13) | 0) === TS) knT++; }
    for (i = 0; i < st.gone.length; i++) x[2 * NSLOT + slot(st.gone[i], TS)] = 1;
    for (i = 0; i < st.tA.length; i++) x[3 * NSLOT + slot(st.tA[i], TS)] = 1;
    for (i = 0; i < st.tD.length; i++) if (st.tD[i] >= 0) { x[4 * NSLOT + slot(st.tD[i], TS)] = 1; nD++; }
    if (st.deck > 0 && st.trumpCard >= 0) x[5 * NSLOT + slot(st.trumpCard, TS)] = 1;
    var N = st.deckSize || 36, unseen = N - st.my.length - st.oppKnown.length - st.gone.length - st.tA.length - nD, b = 6 * NSLOT;
    x[b] = st.deck / 24; x[b + 1] = st.my.length / 12; x[b + 2] = st.oppN / 12; x[b + 3] = (st.oppN - st.oppKnown.length) / 12;
    x[b + 4] = st.iAtt ? 1 : 0; x[b + 5] = st.tk ? 1 : 0; x[b + 6] = st.fd ? 1 : 0; x[b + 7] = st.trf ? 1 : 0;
    x[b + 8] = N === 24 ? 1 : 0; x[b + 9] = unseen / 36; x[b + 10] = myT / 9; x[b + 11] = st.draw ? 1 : 0;
    return x;
  }
  var api = { durakFeat: durakFeat, NF: NF, NSLOT: NSLOT, slot: slot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DFEAT = api;
})(this);
