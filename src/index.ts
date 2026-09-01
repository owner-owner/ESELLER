import mineflayer from 'mineflayer';
import express from 'express';

// 1. إعداد سيرفر Express لإبقاء Render شغالاً
const PORT = parseInt(process.env.PORT || '10000', 10);
const app = express();
app.get('/', (_req, res) => res.status(200).send('Seller Bot Active'));
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] Server running on port ${PORT}`);
});

// منع انهيار العملية عند حدوث أخطاء قراءة الحزم
process.on('uncaughtException', (err: Error) => {
  if (err.message.includes('abnormally large') || err.message.includes('Chunk size') || err.message.includes('Read error')) {
    console.log('[Seller-Bot] 🛡️ تم التقاط وتجاهل خطأ حزمة عابر لتفادي الخروج.');
  } else {
    console.error('[UncaughtException]', err);
  }
});

// 2. إعدادات بوت البيع
const BOT_CONFIG = {
  host: 'zero7even.net',
  port: 25565,
  username: 'EDKF875HD',
  version: '1.20.4',
};

const RECONNECT_DELAY_MS = 5000;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let antiAfkInterval: ReturnType<typeof setInterval> | null = null;

function scheduleReconnect(reason: string) {
  console.log(`[Seller-Bot] 🔄 إعادة الاتصال خلال 5 ثوانٍ بسبب: ${reason}`);
  if (reconnectTimeout) return;
  if (antiAfkInterval) clearInterval(antiAfkInterval);

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    startBot();
  }, RECONNECT_DELAY_MS);
}

function startBot() {
  console.log('[Seller-Bot] ⏳ جاري بدء الاتصال بالسيرفر zero7even.net...');

  const bot = mineflayer.createBot({
    ...BOT_CONFIG,
    viewDistance: 'tiny',
    physicsEnabled: true,
    checkTimeoutInterval: 60 * 1000
  });

  bot.on('login', () => {
    console.log('[Seller-Bot] ✅ تم الاتصال بالهوست وقبول الحساب!');
  });

  // 💰 دالة تنفيذ أمر البيع
  function triggerSell() {
    console.log('[Seller-Bot] 💰 تم التقاط أغراض! جاري كتابة أمر /sell...');
    bot.chat('/sell');
  }

  // 🛒 مراقبة التقاط الأغراض فور ورودها للحقيبة
  bot.on('playerCollect', (collector) => {
    if (collector.username === bot.username) {
      setTimeout(() => {
        triggerSell();
      }, 500);
    }
  });

  // 🔑 إدارة الدخول، التسجيل، والموافقة على الانتقال التلقائي
  bot.on('message', (jsonMsg) => {
    const text = jsonMsg.toString();
    console.log(`[Chat] ${text}`);

    const lowerText = text.toLowerCase();

    // الموافقة الفورية على طلب الانتقال التلقائي عند رؤية AZSRGDTS34245
    if (text.includes('AZSRGDTS34245')) {
      console.log('[Seller-Bot] 🚀 تم رصد الرسالة AZSRGDTS34245! جاري إرسال /tpaccept...');
      bot.chat('/tpaccept');
    }

    // التسجيل والدخول
    if (lowerText.includes('/register') || lowerText.includes('register')) {
      console.log('[Seller-Bot] 🔑 جاري إرسال أمر التسجيل /register...');
      bot.chat('/register AZERTY65 AZERTY65');
    } else if (lowerText.includes('/login') || lowerText.includes('login') || lowerText.includes('تسجيل الدخول')) {
      console.log('[Seller-Bot] 🔑 جاري إرسال أمر تسجيل الدخول /login...');
      bot.chat('/login AZERTY65');
    }
  });

  // 🌐 عند رسبونة البوت داخل السيرفر
  bot.on('spawn', () => {
    console.log('[Seller-Bot] 🎉 البوت جاهز ويراقب الحقيبة والشات!');

    if (antiAfkInterval) clearInterval(antiAfkInterval);

    // قفز خفيف كل 30 ثانية لتفادي طرد الـ AFK
    antiAfkInterval = setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 30000);
  });

  bot.on('kicked', (reason) => {
    let readableReason = reason;
    try {
      readableReason = typeof reason === 'object' ? JSON.stringify(reason) : reason;
    } catch (e) {}
    scheduleReconnect(`Kicked: ${readableReason}`);
  });

  bot.on('end', (reason) => scheduleReconnect(`Disconnected: ${reason}`));

  bot.on('error', (err) => {
    console.log('[Seller-Bot] ⚠️ تنبيه خطأ:', err.message);
    if (!err.message.includes('abnormally large') && !err.message.includes('Chunk size')) {
      scheduleReconnect(`Error: ${err.message}`);
    }
  });
}

startBot();
