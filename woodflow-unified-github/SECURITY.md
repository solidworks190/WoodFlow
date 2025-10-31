# Security Policy - سياسة الأمان

## الإصدارات المدعومة

| الإصدار | مدعوم |
| ------- | ------ |
| 1.0.x   | ✅ |

## الإبلاغ عن الثغرات الأمنية

إذا اكتشفت ثغرة أمنية، يرجى عدم فتح issue عام. بدلاً من ذلك:

1. **أرسل إيميل** إلى: security@solidwood-ksa.com
2. **صف المشكلة** بالتفصيل
3. **أرفق خطوات** إعادة إنتاج المشكلة
4. **انتظر الرد** خلال 48 ساعة

## الممارسات الأمنية

### قاعدة البيانات:
- ✅ Row Level Security مفعلة
- ✅ HTTPS إجباري
- ✅ API Keys محمية
- ✅ نسخ احتياطية تلقائية

### الاستضافة:
- ✅ Vercel SSL certificates
- ✅ CORS محدد
- ✅ Rate limiting
- ✅ Environment variables آمنة

### التطبيق:
- ✅ Input validation
- ✅ XSS protection
- ✅ CSRF protection
- ✅ SQL injection prevention

## التحديثات الأمنية

نقوم بمراجعة الأمان دورياً ونشر التحديثات فوراً عند اكتشاف أي مشاكل.

---
**SolidWood KSA Security Team**