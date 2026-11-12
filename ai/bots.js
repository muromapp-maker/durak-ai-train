// Botlar: təsadüfi, qaydalı (müqayisə üçün) və neyron (öyrənən).
'use strict';
const { S_, R_ } = require('./sim.js');
const { feat, after } = require('./feat.js');

const randomBot = { name: 'təsadüfi', pick(g, info, rnd) { return info.M[(rnd() * info.M.length) | 0]; } };

// qaydalı bot: ən kiçik koz-olmayanla gəl, ən ucuz kartla vur, koz bahalıdırsa götür, kozsuz ötür
const ruleBot = {
  name: 'qaydalı',
  pick(g, info) {
    const M = info.M, TS = g.TS, val = (c) => R_(c) + (S_(c) === TS ? 13 : 0);
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
    const adds = one('add').filter((m) => S_(m.cs[0]) !== TS && (g.dk.length === 0 || R_(m.cs[0]) <= 9));
    if (adds.length) return adds.sort((a, b) => val(a.cs[0]) - val(b.cs[0]))[0];
    return M.find((m) => m.t === 'end' || m.t === 'take') || M[0];
  },
};

// neyron bot: hər gedişdən sonrakı vəziyyəti qiymətləndir, ən yaxşısını seç (ε ehtimalla təsadüfi)
function nnBot(net, eps) {
  const x = new Float32Array(require('./feat.js').NF);
  return {
    name: 'neyron', net,
    value(g, m, p) {
      if (m.t === 'end' && !g.dk.length) {   // oyun bitirsə — dəqiq nəticə
        const s = after(g, m), e0 = !s.h[0].length, e1 = !s.h[1].length;
        if (e0 || e1) return e0 && e1 ? 0.5 : (e0 ? (p === 0 ? 1 : 0) : (p === 1 ? 1 : 0));
      }
      return net.forward(feat(g, after(g, m), p, x));
    },
    pick(g, info, rnd, rec) {
      const p = info.p;
      if (info.M.length === 1) { const m = info.M[0]; if (rec) rec(m, null); return m; }
      let best = null, bv = -1;
      if (eps && rnd() < eps) best = info.M[(rnd() * info.M.length) | 0];
      else for (const m of info.M) { const v = this.value(g, m, p); if (v > bv) { bv = v; best = m; } }
      if (rec) rec(best, null);
      return best;
    },
  };
}

module.exports = { randomBot, ruleBot, nnBot };

// son məhsul: oyunun ortasında neyron şəbəkə, dəstə bitəndə dəqiq hesab (tətbiqdəki kimi)
function nnExactBot(net, budget) {
  const nb = nnBot(net, 0), { appBot } = require('./appbot.js'), ex = appBot(budget || 60);
  return { name: 'neyron + dəqiq', pick(g, info, rnd) { if (info.M.length === 1) return info.M[0]; return g.dk.length ? nb.pick(g, info, rnd) : ex.pick(g, info); } };
}
module.exports.nnExactBot = nnExactBot;
