# Kart AI (cardnet) — öyrətmə faylları

- `prep7.py` → `ds/data7.npz` (məlumat dəsti; `x/` — "kart deyil" nümunələri daxil)
- `exp10.py` → `cardnet_v8b.json` (v8: 14 sinif, X = kart deyil; 180° və künc-çevirmə mənfi nümunələri; istifadəçi X çəkisi 15)
- Tətbiqə əlavə: `cardnet_v8b.json` → durak-ai repo-da `ai/models/cardnet_v8.json` (build.py ən böyük nömrəni seçir)
- Bütün köhnə modellər (v4–v8) saxlanılır, silinmir
- `video/` — video analiz alətləri (çərçivə, uçan kart); `r1.py` — durak-ai-da tək test işlətmək
- `run/` və `*.log` — təcrübə nəticələri
