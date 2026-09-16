# ParaAsistan

ParaAsistan, gelir, gider, butce, hedef ve aboneliklerini takip eden React + Supabase tabanli kisisel finans uygulamasidir. Uygulamada premium bir AI Finans Kocu bulunur.

## Kurulum

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` icinde su frontend degiskenleri bulunmalidir:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`OPENAI_API_KEY` frontend ortaminda tutulmamali, Supabase Edge Function secret olarak tanimlanmalidir.

## Komutlar

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Supabase ve guvenlik

AI Function: `supabase/functions/finance-coach/index.ts`

Function deploy edildikten sonra `OPENAI_API_KEY` Supabase secret olarak ayarlanmalidir. `memberships` tablosunda `user_id`, `plan` ve `status` alanlari bulunmalidir.

Finansal tablolar icin Row Level Security etkin olmali ve policy'ler her islemi `auth.uid()` ile ilgili kullaniciya sinirlamalidir.

## Uygulama alanlari

- Dashboard ve aylik finans ozeti
- Gelir/gider islemleri
- Finansal hedefler
- Abonelikler
- Butce takibi
- Raporlar ve finansal saglik skoru
- Premium AI Finans Kocu

## Tekrarlayan kayıtlar

`subscriptions` kayıtları `income` veya `expense` türünde olabilir. Aylık kayıt üretimi için `generate-recurring-transactions` Edge Function deploy edilmiştir. Function yalnızca service-role Authorization ile çalışır; normal kullanıcı JWT'leriyle çağrılamaz. Function'ı her ayın ilk günü çalıştırmak için Supabase Dashboard'da Edge Function schedule ayarına service-role Authorization içeren aylık bir cron tanımı eklenmelidir.

Function aynı abonelik ve ay için ikinci bir transaction oluşturmaz. Bu garanti `subscription_id` ve `recurring_month` alanları üzerindeki unique index ile sağlanır.
