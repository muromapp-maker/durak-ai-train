#!/bin/bash
# firstv1, firstv2, firstv3a, firstv3b və v4-ün müqayisəsi → models/cmp_first3.txt   (ölçülər: NE, NH)
set -euo pipefail
NE=${NE:-4000}; NH=${NH:-2000}; P=${P:-4}
M="first_v1 first_v2 first_v3a first_v3b"
for m in $M v4; do [ -f models/$m.json ] && echo "node evalfirst.js models/$m.json $NE --seed 31 > /tmp/e_$m.txt"; done > /tmp/jobs.txt
for m in $M; do [ -f models/$m.json ] && echo "node h2h.js models/$m.json models/v4.json $NH --name '$m vs v4' > /tmp/v_$m.txt"; done >> /tmp/jobs.txt
for p in "first_v2 first_v1" "first_v3a first_v1" "first_v3b first_v1" "first_v3a first_v2" "first_v3b first_v2" "first_v3a first_v3b"; do
  set -- $p; [ -f models/$1.json ] && [ -f models/$2.json ] && echo "node h2h.js models/$1.json models/$2.json $NH --name '$1 vs $2' > /tmp/b_$1_$2.txt"
done >> /tmp/jobs.txt
rm -f /tmp/e_*.txt /tmp/v_*.txt /tmp/b_*.txt
xargs -a /tmp/jobs.txt -d '\n' -P $P -I{} sh -c '{}'
{ echo "# firstv1 / firstv2 / firstv3a / firstv3b / v4 müqayisəsi ($(date -u +%F)); 3a və 3b firstv1-in üstündən öyrədilib"
  echo "## qaydalı botlara qarşı (hər növdə $NE oyun)"; for m in $M v4; do [ -f /tmp/e_$m.txt ] && echo "$m: $(cat /tmp/e_$m.txt)"; done
  echo "## üz-üzə (bir yerdə birinci model, qalan yerlərdə ikinci; hər növdə $NH oyun)"; cat /tmp/v_*.txt /tmp/b_*.txt 2>/dev/null; } > /tmp/cmp.txt
cat /tmp/cmp.txt; cat /tmp/cmp.txt >> models/cmp_first3.txt
