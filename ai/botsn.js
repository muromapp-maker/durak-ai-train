// Çox oyunçulu botlar: təsadüfi, qaydalı (müqayisə üçün), neyron (öyrənən).
'use strict';
const { S_, R_ } = require('./simn.js');
const { featN, afterN, NF } = require('./featn.js');

const randomBotN = { name: 'təsadüfi', pick(g, info, rnd) { return info.M[(rnd() * info.M.length) | 0]; } };

// qaydalı: ən kiçik koz-olmayanla gəl, ən ucuz kartla vur (dəstə çoxdursa böyük koz yerinə götür), kozsuz ötür,
// kiçik koz-olmayanı üstünə at, qalan hallarda pas
const ruleBotN = {
  name: 'qaydalı',
  pick(g, info) {
    const M = info.M, TS = g.TS, val = (c) => R_(c) + (S_(c) === TS ? 13 : 0), mid = R_(g.trumpCard) >= 0 ? 9 : 9;
    const one = (t) => M.filter((m) => m.t === t);
    const leads = one('lead').filter((m) => m.cs.length === 1);
    if (leads.length) return leads.sort((a, b) => val(a.cs[0]) - val(b.cs[0]))[0];
    const tr = one('tr').filter((m) => m.cs.length === 1 && S_(m.cs[0]) !== TS);
    if (tr.length) return tr[0];
    const cov = one('cov');
    if (cov.length) {
      const best = cov.sort((a, b) => val(a.c) - val(b.c))[0];
      if (S_(best.c) === TS && g.dk.length > 6 && R_(best.c) >= 10) return M.find((m) => m.t === 'take');
      return best;
    }
    const adds = one('add').filter((m) => S_(m.cs[0]) !== TS && (g.dk.length === 0 || R_(m.cs[0]) <= mid));
    if (adds.length) return adds.sort((a, b) => val(a.cs[0]) - val(b.cs[0]))[0];
    return M.find((m) => m.t === 'pass' || m.t === 'take') || M[0];
  },
};

// neyron: hər gedişdən sonrakı vəziyyəti öz gözü ilə qiymətləndir ("durak olmamaq" ehtimalı), ən yaxşısını seç
function nnBotN(net, eps) {
  const x = new Float32Array(NF);
  return {
    name: 'neyron', net,
    value(g, m, p) { return net.forward(featN(g, afterN(g, m, p), p, x)); },
    pick(g, info, rnd) {
      const p = info.p;
      if (info.M.length === 1) return info.M[0];
      if (eps && rnd() < eps) return info.M[(rnd() * info.M.length) | 0];
      let best = null, bv = -1;
      for (const m of info.M) { const v = this.value(g, m, p); if (v > bv) { bv = v; best = m; } }
      return best;
    },
  };
}

module.exports = { randomBotN, ruleBotN, nnBotN };
