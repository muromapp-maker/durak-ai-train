// truth ekran şəkillərindən: hər kartın qutusu + doğru etiket + DREC-in oxuduğu (eyni sıra ilə uyğun gələndə)
const fs = require('fs'); process.chdir('/home/claude/durak-ai/samples');
global.DREC = require('/home/claude/durak-ai/web/rec.js'); eval(fs.readFileSync('../web/tpl.js', 'utf8'));
const R = DREC, T = Object.assign({}, require('/home/claude/durak-ai/samples/truth.js'), require('/home/claude/durak-ai/samples/truth2.js'));
function load(f) { const b = fs.readFileSync(f); const w = b.readUInt32LE(0), h = b.readUInt32LE(4); return { width: w, height: h, data: new Uint8ClampedArray(b.buffer, b.byteOffset + 8, w * h * 4) }; }
const name = (c) => c < 0 ? '??' : R.RANKS[c % 13] + R.SUITS[(c / 13) | 0];
const out = [];
for (const n of Object.keys(T)) {
  const t = T[n]; if (!fs.existsSync('raw/' + n + '.rgba')) continue;
  const r = R.analyze(load('raw/' + n + '.rgba'));
  const B = (o) => [o.x, o.y, o.w, o.h, o.cut ? 1 : 0];
  if (t.hand && r.hand.length === t.hand.length) r.hand.forEach((h, i) => out.push({ img: n, l: t.hand[i], w: 'h', b: B(h), drec: name(h.c) }));
  if (t.table && r.table.length === t.table.length) r.table.forEach((p, i) => {
    out.push({ img: n, l: t.table[i][0], w: 'a', b: B(p.ca), drec: name(p.a) });
    if (p.cd && t.table[i][1]) out.push({ img: n, l: t.table[i][1], w: 'd', b: B(p.cd), drec: name(p.d) });
  });
}
fs.writeFileSync('/tmp/smp1/truthboxes.json', JSON.stringify(out));
console.log(out.length, 'kart;', out.filter(x => x.l !== x.drec).length, 'DREC səhv:', out.filter(x => x.l !== x.drec).map(x => x.img + ' ' + x.l + '→' + x.drec).join(', '));
