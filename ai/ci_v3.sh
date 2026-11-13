#!/bin/bash
# firstv3a / firstv3b: firstv1-in üstündən öyrət və dəqiq seç.
# ci_v3.sh NAME train ARGS... | ci_v3.sh NAME pick      (ölçülər: MIN, N1, N2, SNAP, EV)
set -euo pipefail
NAME=$1; ST=$2; shift 2
MIN=${MIN:-290}; N1=${N1:-3000}; N2=${N2:-4000}; SNAP=${SNAP:-20000}; EV=${EV:-10000}; S=${SNAPS:-/tmp/snaps}
LOG=models/log_$NAME.txt
G() { node -e "console.log(JSON.parse(require('fs').readFileSync('$1')).meta.games)"; }
if [ "$ST" = train ]; then
  mkdir -p $S; cp models/first_v1.json $S/base.json; cp models/first_v1.json models/$NAME.json
  echo "$(date -u +%FT%T) $NAME: başlanğıc firstv1 ($(G models/first_v1.json) oyun), $*" >> $LOG
  node trainn.js --goal first --minutes $MIN --model models/$NAME.json --log $LOG --evalEvery $EV \
    --pn 0.2,0.4,0.4 --nb4 0.5 --lr 0.0005 --snapEvery $SNAP --snapDir $S "$@"
  cp models/$NAME.json $S/final.json
else
  { echo $S/final.json; ls $S/*.json | grep -v -e '/final.json$' -e '/base.json$' | awk 'NR%2==0'; } > /tmp/sn_$NAME.txt   # nüsxələrin yarısı (vaxt üçün)
  xargs -a /tmp/sn_$NAME.txt -d '\n' -P 4 -I{} sh -c 'node evalfirst.js {} '$N1' --json {}.res > /dev/null'
  node select3.js --round1 $(sed 's/$/.res/' /tmp/sn_$NAME.txt) --top /tmp/top_$NAME.txt --name $NAME --log $LOG
  xargs -a /tmp/top_$NAME.txt -d '\n' -P 3 -I{} sh -c 'node evalfirst.js {} '$N2' --seed 777 --json {}.res2 > /dev/null'
  node select3.js --final $(sed 's/.*/& &/' /tmp/top_$NAME.txt | awk '{print $1".res", $2".res2"}') --out /tmp/best_$NAME.txt --name $NAME --log $LOG
  cp $(cat /tmp/best_$NAME.txt) models/$NAME.json
  echo "$NAME = $(G models/$NAME.json) oyun"
fi
