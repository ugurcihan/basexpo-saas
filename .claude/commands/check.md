# /check — TypeScript + Build Kontrol

Kullanıcı kodun hata verip vermediğini kontrol etmek istiyor.

## Adım 1 — TypeScript kontrol (hızlı)
```bash
cd bsexp2 && npx tsc --noEmit 2>&1
```
Hata yoksa "TypeScript ✓" yaz. Hata varsa her hatayı dosya:satır ile birlikte listele ve ne anlama geldiğini açıkla.

## Adım 2 — ESLint (varsa)
```bash
cd bsexp2 && npm run lint 2>&1 | head -50
```

## Adım 3 — Next.js build (kullanıcı `--build` veya `--full` belirttiyse)
```bash
cd bsexp2 && npm run build 2>&1 | tail -30
```
Build başarılıysa kaç sayfa oluşturulduğunu, dynamic/static dağılımını özetle.
Build hata verirse hatayı analiz et ve nerede olduğunu belirt.

## Argüman yoksa
Sadece TypeScript + lint çalıştır (build atla, yavaş).
