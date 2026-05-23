# 🎮 Flappy Miden — Vercel Edition

بازی Flappy Bird با ثبت امتیازات روی Miden testnet، deploy شده روی **Vercel رایگان** با **Supabase** به‌عنوان دیتابیس.

## 💯 چی تو این نسخه هست؟

دقیقاً همون ویژگی‌های نسخه VPS:
- ✅ بازی Flappy Bird با گرافیک cyberpunk
- ✅ اتصال Miden Wallet Extension
- ✅ ثبت امتیاز روی Miden testnet (Note ها)
- ✅ Leaderboard جهانی
- ✅ آمار شخصی هر بازیکن
- ✅ Anti-cheat با signature
- ✅ Demo mode اگه wallet نصب نباشه

تفاوت با نسخه VPS: **همه‌چیز رایگانه و خودکار deploy می‌شه**.

## 📦 ساختار

```
flappy-miden-vercel/
├── public/                  # فایل‌های static
│   ├── index.html
│   ├── styles.css
│   ├── game.js
│   ├── miden.js
│   └── app.js
├── api/                     # Vercel Serverless Functions
│   ├── _lib/
│   │   └── db.js           # کلاینت Supabase
│   ├── health.js
│   ├── leaderboard.js
│   ├── validate-score.js
│   ├── record-score.js
│   └── stats/
│       └── [address].js
├── package.json
├── vercel.json
├── supabase-schema.sql      # ⭐ SQL برای ساخت جدول
├── .env.example
└── README.md
```

---

## 🚀 راهنمای کامل deploy (مرحله به مرحله)

### مرحله ۱: ساخت اکانت Supabase (دیتابیس رایگان)

۱. برو به https://supabase.com
۲. روی «Start your project» کلیک کن
۳. با GitHub یا email ثبت‌نام کن
۴. یک پروژه جدید بساز:
   - Name: `flappy-miden`
   - Database Password: یک پسورد قوی بزن (یادداشت کن)
   - Region: نزدیک‌ترین به کاربرات
   - Pricing: **Free**

پروژه چند دقیقه طول می‌کشه ساخته بشه.

### مرحله ۲: ساخت جدول scores

۱. وارد پروژه Supabase شو
۲. از منوی چپ روی **SQL Editor** کلیک کن
۳. **New Query** بزن
۴. کل محتوای فایل `supabase-schema.sql` رو copy/paste کن
۵. روی **Run** کلیک کن

اگه پیغام `Success. No rows returned` دیدی، یعنی جدول ساخته شد.

### مرحله ۳: گرفتن کلیدهای Supabase

۱. از منوی چپ روی ⚙️ **Settings** → **API**
۲. این دو مقدار رو کپی کن:
   - **Project URL** (یه چیزی مثل `https://abc.supabase.co`)
   - **service_role key** (مهم: نه anon key، حتماً service_role) — این key مخفیه

⚠️ **هشدار:** service_role key رو هیچ‌وقت در کد عمومی نذار. فقط در Vercel environment variables.

### مرحله ۴: ساخت اکانت Vercel

۱. برو به https://vercel.com
۲. با GitHub ثبت‌نام کن
۳. وارد Dashboard شو

### مرحله ۵: آپلود پروژه به GitHub

روی کامپیوتر محلی:

```bash
# اگه repo نداری
cd flappy-miden-vercel
git init
git add .
git commit -m "Initial commit"

# روی github.com یک repo جدید بساز با اسم flappy-miden
git remote add origin https://github.com/USERNAME/flappy-miden.git
git branch -M main
git push -u origin main
```

اگه git بلد نیستی، روش جایگزین:
- روی github.com یک repo جدید بساز
- روی صفحه repo، روی **"uploading an existing file"** کلیک کن
- همه فایل‌های پوشه `flappy-miden-vercel` رو drag & drop کن

### مرحله ۶: Import پروژه به Vercel

۱. در Vercel Dashboard، روی **Add New → Project** کلیک کن
۲. repo `flappy-miden` رو پیدا و **Import** کن
۳. در صفحه تنظیمات:
   - **Framework Preset:** `Other`
   - **Root Directory:** خالی بذار
   - **Build Command:** خالی بذار
   - **Output Directory:** `public`

### مرحله ۷: تنظیم Environment Variables

قبل از deploy، این متغیرها رو اضافه کن (در همون صفحه import):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Project URL ای که از مرحله ۳ گرفتی |
| `SUPABASE_KEY` | service_role key ای که از مرحله ۳ گرفتی |
| `SCORE_SECRET` | یک رشته تصادفی (مثلاً `openssl rand -hex 32` یا چیزی شبیه `a8f3...`) |

### مرحله ۸: Deploy

روی **Deploy** کلیک کن.

تو ۱-۲ دقیقه پروژه بالا میاد و یه URL مثل `https://flappy-miden.vercel.app` می‌گیری.

### مرحله ۹: تنظیم آدرس wallet گیرنده

در فایل `public/miden.js` این خط رو پیدا کن:

```javascript
gameReceiver: '0xade4a7d35f1fcb8037f1b6ab907cf5'
```

و آدرس wallet خودت رو بذار. بعد:

```bash
git add public/miden.js
git commit -m "Update game receiver address"
git push
```

Vercel خودکار دوباره deploy می‌کنه.

---

## ✅ تست نهایی

برو به URL سایتت و:

1. روی **Connect Wallet** کلیک کن
2. اگه Miden Wallet نصب نداری، Mock Mode فعال می‌شه (برای تست)
3. بازی کن
4. **Submit to Chain** بزن
5. در leaderboard ببین

---

## 🔄 آپدیت کد بعداً

هر بار که کدی تغییر دادی:

```bash
git add .
git commit -m "Your message"
git push
```

Vercel خودکار deploy می‌کنه. **بدون restart دستی، بدون نگرانی**.

---

## 💰 هزینه‌ها

| سرویس | پلن | محدودیت‌ها | کافی برای |
|------|------|-----------|----------|
| Vercel | Hobby (رایگان) | 100GB bandwidth، 100K functions/day | تا چند هزار کاربر روزانه |
| Supabase | Free | 500MB DB، 50K monthly active users | تا چند هزار کاربر روزانه |

برای پروژه Flappy Bird، **هر دو سرویس بیشتر از کافی** هستن.

---

## 🐛 عیب‌یابی

### سایت میاد ولی Connect Wallet کار نمی‌کنه
- Miden Wallet Extension نصبه؟
- Mock Mode خودکار فعال می‌شه — تست کن

### امتیازات ثبت نمی‌شن
- بررسی کن `SUPABASE_URL` و `SUPABASE_KEY` در Vercel تنظیم شده باشن
- در Vercel Dashboard → Logs نگاه کن

### Leaderboard خالیه
- بررسی کن جدول `scores` در Supabase ساخته شده باشه
- SQL `SELECT * FROM scores;` در Supabase SQL Editor بزن

### فعال‌سازی لاگ‌ها در Vercel
- Vercel Dashboard → Project → Deployments → آخرین deploy → Functions
- روی هر function کلیک کن تا لاگ‌هاش رو ببینی

---

## 🔒 امنیت

### چیزایی که Vercel/Supabase خودکار انجام می‌دن:
- ✅ SSL/HTTPS
- ✅ DDoS protection
- ✅ Rate limiting پایه

### چیزایی که خودت باید بکنی:
- ✅ `SCORE_SECRET` قوی استفاده کن
- ✅ `service_role key` رو هیچ‌وقت در کد public نذار
- ✅ از RLS (Row Level Security) در Supabase استفاده کن (در schema هست)

---

## 🌐 دامنه سفارشی (اختیاری)

اگه دامنه داری:

۱. در Vercel Dashboard → Project → Settings → Domains
۲. دامنه‌ات رو اضافه کن (مثلاً `flappy.example.com`)
۳. Vercel بهت DNS records می‌ده
۴. در پنل دامنه‌ات اون records رو اضافه کن
۵. تا ۲۴ ساعت SSL نصب می‌شه

---

## 📚 منابع

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Miden Wallet Extension](https://chromewebstore.google.com/detail/miden-wallet/ablmompanofnodfdkgchkpmphailefpb)
- [Miden Testnet Explorer](https://testnet.midenscan.com)
- [Miden Faucet](https://faucet.testnet.miden.io)

---

## 🎯 خلاصه فرق با نسخه VPS

| ویژگی | نسخه VPS | نسخه Vercel |
|------|---------|-------------|
| هزینه | ماهی ۵-۲۰ دلار | **رایگان** |
| SSL | باید خودت نصب کنی | خودکار |
| Scale | محدود به سرور | خودکار scale |
| نگه‌داری | restart، monitor، backup | صفر |
| دیتابیس | فایل JSON محلی | Supabase (دیتابیس واقعی) |
| Deploy | اسکریپت bash | `git push` |
| دامنه | باید بخری | `.vercel.app` رایگان |
| سرعت جهانی | یک region | CDN جهانی |

این نسخه برای پروژه تو ایده‌آله. 🚀
