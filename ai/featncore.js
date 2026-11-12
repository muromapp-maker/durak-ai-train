// Çox oyunçulu (2–4) və 24/36/52 kartlıq vəziyyətin kodlanması — öyrətmədə (node) və telefonda EYNİ kod.
// Hamısı vəziyyəti görən oyunçunun gözü ilə: rəqiblər onun ardınca oyun sırası ilə (1 — növbəti, 2, 3).
// st: { TS, deckSize, nPl, my[], gone[], tA[], tD[], trumpCard (dəstə varsa), deck,
//       opp: [{ n, known[], act }] (≤3, sıra ilə), attRel, defRel (0 — mən, 1..3 — rəqib), tk, fd, trf, nb, draw }
(function (root) {
  var NS = 52, NG = 8, NF = NS * NG + 32;
  // kart yuvası: rəng koz-a nisbətən (koz = 0), dəyər 2..A → 0..12
  function slot(c, TS) { return ((((c / 13) | 0) - TS + 4) & 3) * 13 + (c % 13); }
  function durakFeatN(st, x) {
    x = x || new Float32Array(NF); x.fill(0);
    var TS = st.TS, i, k, c, myT = 0, nD = 0, nK = 0;
    for (i = 0; i < st.my.length; i++) { c = st.my[i]; x[slot(c, TS)] = 1; if (((c / 13) | 0) === TS) myT++; }
    for (i = 0; i < st.gone.length; i++) x[NS + slot(st.gone[i], TS)] = 1;
    for (i = 0; i < st.tA.length; i++) x[2 * NS + slot(st.tA[i], TS)] = 1;
    for (i = 0; i < st.tD.length; i++) if (st.tD[i] >= 0) { x[3 * NS + slot(st.tD[i], TS)] = 1; nD++; }
    if (st.deck > 0 && st.trumpCard >= 0) x[4 * NS + slot(st.trumpCard, TS)] = 1;
    for (k = 0; k < 3; k++) { var o = st.opp[k]; if (!o) continue; for (i = 0; i < o.known.length; i++) { x[(5 + k) * NS + slot(o.known[i], TS)] = 1; nK++; } }
    var D = st.deckSize || 36, b = NG * NS;
    var unseen = D - st.my.length - st.gone.length - st.tA.length - nD - nK - (st.deck > 0 && st.trumpCard >= 0 ? 1 : 0);
    x[b] = st.deck / 52; x[b + 1] = st.my.length / 12;
    for (k = 0; k < 3; k++) { var q = st.opp[k]; if (!q) continue; x[b + 2 + k] = q.n / 12; x[b + 5 + k] = (q.n - q.known.length) / 12; x[b + 8 + k] = q.act ? 1 : 0; }
    if (st.attRel >= 0 && st.attRel < 4) x[b + 11 + st.attRel] = 1;
    if (st.defRel >= 0 && st.defRel < 4) x[b + 15 + st.defRel] = 1;
    x[b + 19] = st.tk ? 1 : 0; x[b + 20] = st.fd ? 1 : 0; x[b + 21] = st.trf ? 1 : 0;
    x[b + 22 + (D === 24 ? 0 : D === 36 ? 1 : 2)] = 1;
    x[b + 25 + Math.max(0, Math.min(2, (st.nPl || 2) - 2))] = 1;
    x[b + 28] = st.draw ? 1 : 0; x[b + 29] = unseen / 52; x[b + 30] = myT / 13; x[b + 31] = st.nb ? 1 : 0;
    return x;
  }
  var api = { durakFeatN: durakFeatN, NF: NF, slot: slot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DFEATN = api;
})(this);
