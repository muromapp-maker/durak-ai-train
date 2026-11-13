// match.js nəticələrini cədvələ yığır: node matchsum.js dir > out.txt
'use strict';
const fs = require('fs'), dir = process.argv[2];
const R = fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(dir + '/' + f)));
const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(1) + '%';
const L = ['# AI v4 vs firstv1 — eyni masada (yerlər hər oyunda qarışdırılır; ötürmə və 4 nəfərdə "kim atır" 50/50)', '# 1-ci = oyundan ilk çıxma payı (bərabər güc: 2n 50%, 3n 33%, 4n 25%); durak deyil = durak olmama payı (bərabər: 2n 50%, 3n 67%, 4n 75%)', ''];
for (const mode of ['pure', 'hyb']) {
  const rs = R.filter((x) => x.mode === mode).sort((a, b) => a.n - b.n || a.deck - b.deck || a.lineup.localeCompare(b.lineup));
  if (!rs.length) continue;
  L.push(mode === 'pure' ? '## firstv1 təmiz (bütün oyun boyu firstv1)' : '## firstv1 tətbiqdəki kimi (3+ nəfər, kimsə çıxana qədər firstv1, sonra v4)');
  L.push('nəfər | kart | masa | oyun | v4: 1-ci / durak deyil | firstv1: 1-ci / durak deyil');
  rs.forEach((x) => L.push(`${x.n} | ${x.deck} | ${x.lineup.replace(/f1/g, 'firstv1')} | ${x.games} | ${pc(x.S.v4.first, x.S.v4.seats)} / ${pc(x.S.v4.notDurak, x.S.v4.seats)} | ${pc(x.S.f1.first, x.S.f1.seats)} / ${pc(x.S.f1.notDurak, x.S.f1.seats)}`));
  L.push('');
}
console.log(L.join('\n'));
