#!/bin/bash
# firstv2 (təkrar): firstv1-in üstündən öyrət, nüsxələrdən ən güclüsünü seç, 2-ci yoxlama.
# Mərhələ: ci_v2.sh train | ci_v2.sh pick   (ölçülər: MIN, N1, N2, SNAP, EV — CI-də standart, sınaqda kiçik)
set -euo pipefail
MIN=${MIN:-300}; N1=${N1:-2000}; N2=${N2:-2000}; SNAP=${SNAP:-150000}; EV=${EV:-25000}; S=${SNAPS:-/tmp/snaps}
G() { node -e "console.log(JSON.parse(require('fs').readFileSync('$1')).meta.games)"; }
if [ "$1" = train ]; then
  mkdir -p $S; cp models/first_v1.json models/first_v2.json; cp models/first_v1.json $S/base.json
  echo "$(date -u +%FT%T) firstv2 (təkrar öyrətmə): firstv1 ($(G models/first_v1.json) oyun) üstündən başlayır" >> models/log_first.txt
  node trainn.js --goal first --minutes $MIN --model models/first_v2.json --log models/log_first.txt --evalEvery $EV \
    --pn 0.34,0.33,0.33 --nb4 0.5 --lr 0.0005 --snapEvery $SNAP --snapDir $S
  cp models/first_v2.json $S/final.json
else
  C="$S/final.json $(ls $S/*.json | grep -v -e '/final.json$' -e '/base.json$' || true)"
  for m in $S/base.json $C; do node evalfirst.js $m $N1 --json $m.res > /dev/null & done; wait
  node pickfirst.js $S/base.json.res $(for m in $C; do echo $m.res; done) --out /tmp/best_v2.txt --log models/log_first.txt --name firstv2
  B=$(cat /tmp/best_v2.txt)
  node evalfirst.js $S/base.json $N2 --seed 777 --json /tmp/b2.json --log models/log_first.txt & node evalfirst.js $B $N2 --seed 777 --json /tmp/c2.json --log models/log_first.txt & wait
  node -e "
const fs=require('fs'),b=JSON.parse(fs.readFileSync('/tmp/b2.json')),c=JSON.parse(fs.readFileSync('/tmp/c2.json'));
const ok=['2','3','4'].every(n=>c.per[n]>b.per[n]);
fs.appendFileSync('models/log_first.txt',new Date().toISOString().slice(0,19)+' firstv2 2-ci yoxlama: '+(ok?'hər oyunçu sayında firstv1-dən güclüdür':'hamısında firstv1-dən güclü deyil (model yenə saxlanılır)')+'\n');
fs.copyFileSync('$B','models/first_v2.json');"
  echo "firstv2 = $(G models/first_v2.json) oyun"
fi
