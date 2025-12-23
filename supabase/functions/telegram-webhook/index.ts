import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Multi-language translations
type Language = 'en' | 'bn' | 'hi';

const translations: Record<string, Record<Language, string>> = {
  welcome: {
    en: "🎉 <b>Welcome!</b>\n\n💰 Your current balance: <b>{balance} credits</b>\n\n📌 <b>Available Commands:</b>\n/daily - Claim daily bonus (1 credit every 24 hours)\n/balance - Check your balance\n/deposit - Deposit credits\n/referral - Get your referral link\n/redeem CODE - Redeem a coupon code\n/language - Change language",
    bn: "🎉 <b>স্বাগতম!</b>\n\n💰 আপনার বর্তমান ব্যালেন্স: <b>{balance} ক্রেডিট</b>\n\n📌 <b>উপলব্ধ কমান্ড:</b>\n/daily - ডেইলি বোনাস নিন (প্রতি ২৪ ঘন্টায় ১ ক্রেডিট)\n/balance - ব্যালেন্স দেখুন\n/deposit - ক্রেডিট জমা দিন\n/referral - রেফারেল লিংক পান\n/redeem CODE - কুপন কোড রিডিম করুন\n/language - ভাষা পরিবর্তন করুন",
    hi: "🎉 <b>स्वागत है!</b>\n\n💰 आपका वर्तमान बैलेंस: <b>{balance} क्रेडिट</b>\n\n📌 <b>उपलब्ध कमांड:</b>\n/daily - डेली बोनस लें (हर 24 घंटे में 1 क्रेडिट)\n/balance - बैलेंस देखें\n/deposit - क्रेडिट जमा करें\n/referral - रेफरल लिंक पाएं\n/redeem CODE - कूपन कोड रिडीम करें\n/language - भाषा बदलें",
  },
  welcomeReferred: {
    en: "🎉 <b>Welcome!</b>\n\n🎁 You joined via referral and got <b>+1 bonus credit!</b>\n💰 Your current balance: <b>{balance} credits</b>\n\n📌 <b>Available Commands:</b>\n/daily - Claim daily bonus (1 credit every 24 hours)\n/balance - Check your balance\n/deposit - Deposit credits\n/referral - Get your referral link\n/redeem CODE - Redeem a coupon code\n/language - Change language",
    bn: "🎉 <b>স্বাগতম!</b>\n\n🎁 আপনি রেফারেলের মাধ্যমে যোগ দিয়েছেন এবং <b>+১ বোনাস ক্রেডিট</b> পেয়েছেন!\n💰 আপনার বর্তমান ব্যালেন্স: <b>{balance} ক্রেডিট</b>\n\n📌 <b>উপলব্ধ কমান্ড:</b>\n/daily - ডেইলি বোনাস নিন\n/balance - ব্যালেন্স দেখুন\n/deposit - ক্রেডিট জমা দিন\n/referral - রেফারেল লিংক পান\n/redeem CODE - কুপন কোড রিডিম করুন\n/language - ভাষা পরিবর্তন করুন",
    hi: "🎉 <b>स्वागत है!</b>\n\n🎁 आप रेफरल से जुड़े और <b>+1 बोनस क्रेडिट</b> मिला!\n💰 आपका बैलेंस: <b>{balance} क्रेडिट</b>\n\n📌 <b>उपलब्ध कमांड:</b>\n/daily - डेली बोनस लें\n/balance - बैलेंस देखें\n/deposit - क्रेडिट जमा करें\n/referral - रेफरल लिंक पाएं\n/redeem CODE - कूपन कोड रिडीम करें\n/language - भाषा बदलें",
  },
  balance: {
    en: "💰 Your current balance: <b>{balance} credits</b>",
    bn: "💰 আপনার বর্তমান ব্যালেন্স: <b>{balance} ক্রেডিট</b>",
    hi: "💰 आपका वर्तमान बैलेंस: <b>{balance} क्रेडिट</b>",
  },
  dailyAlreadyClaimed: {
    en: "⏰ You have already claimed today's bonus!\n\n⏳ Wait for next bonus: <b>{hours} hours {minutes} minutes</b>",
    bn: "⏰ আপনি ইতিমধ্যে আজকের বোনাস নিয়েছেন!\n\n⏳ পরবর্তী বোনাস পেতে অপেক্ষা করুন: <b>{hours} ঘন্টা {minutes} মিনিট</b>",
    hi: "⏰ आपने आज का बोनस पहले ही ले लिया है!\n\n⏳ अगले बोनस के लिए प्रतीक्षा करें: <b>{hours} घंटे {minutes} मिनट</b>",
  },
  dailySuccess: {
    en: "🎁 <b>Daily Bonus!</b>\n\n✅ You received +1 credit!\n💰 New balance: <b>{balance} credits</b>\n\n⏰ Next bonus in 24 hours",
    bn: "🎁 <b>ডেইলি বোনাস!</b>\n\n✅ আপনি +১ ক্রেডিট পেয়েছেন!\n💰 নতুন ব্যালেন্স: <b>{balance} ক্রেডিট</b>\n\n⏰ পরবর্তী বোনাস ২৪ ঘন্টা পর",
    hi: "🎁 <b>डेली बोनस!</b>\n\n✅ आपको +1 क्रेडिट मिला!\n💰 नया बैलेंस: <b>{balance} क्रेडिट</b>\n\n⏰ अगला बोनस 24 घंटे बाद",
  },
  dailyError: {
    en: "❌ Error giving bonus. Please try again later.",
    bn: "❌ বোনাস প্রদানে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।",
    hi: "❌ बोनस देने में त्रुटि। कृपया बाद में पुनः प्रयास करें।",
  },
  languageSelect: {
    en: "🌐 <b>Select Language / ভাষা নির্বাচন করুন / भाषा चुनें</b>\n\n/lang_en - English 🇬🇧\n/lang_bn - বাংলা 🇧🇩\n/lang_hi - हिन्दी 🇮🇳",
    bn: "🌐 <b>Select Language / ভাষা নির্বাচন করুন / भाषा चुनें</b>\n\n/lang_en - English 🇬🇧\n/lang_bn - বাংলা 🇧🇩\n/lang_hi - हिन्दी 🇮🇳",
    hi: "🌐 <b>Select Language / ভাষা নির্বাচন করুন / भाषा चुनें</b>\n\n/lang_en - English 🇬🇧\n/lang_bn - বাংলা 🇧🇩\n/lang_hi - हिन्दी 🇮🇳",
  },
  languageChanged: {
    en: "✅ Language changed to <b>English</b> 🇬🇧",
    bn: "✅ ভাষা পরিবর্তন হয়েছে <b>বাংলা</b> 🇧🇩",
    hi: "✅ भाषा बदल गई <b>हिन्दी</b> 🇮🇳",
  },
  referralLink: {
    en: "🔗 <b>Your Referral Link:</b>\n\nhttps://t.me/{botUsername}?start=ref_{referralCode}\n\n👥 Total Referrals: <b>{referralCount}</b>\n💰 You get <b>+1 credit</b> for each friend who joins!",
    bn: "🔗 <b>আপনার রেফারেল লিংক:</b>\n\nhttps://t.me/{botUsername}?start=ref_{referralCode}\n\n👥 মোট রেফারেল: <b>{referralCount}</b>\n💰 প্রতিটি বন্ধু যোগ দিলে আপনি <b>+১ ক্রেডিট</b> পাবেন!",
    hi: "🔗 <b>आपका रेफरल लिंक:</b>\n\nhttps://t.me/{botUsername}?start=ref_{referralCode}\n\n👥 कुल रेफरल: <b>{referralCount}</b>\n💰 हर दोस्त के जुड़ने पर आपको <b>+1 क्रेडिट</b> मिलेगा!",
  },
  referralBonus: {
    en: "🎉 <b>Referral Bonus!</b>\n\n👤 {userName} joined using your link!\n✅ You received <b>+1 credit</b>\n💰 New balance: <b>{balance} credits</b>\n👥 Total referrals: <b>{referralCount}</b>",
    bn: "🎉 <b>রেফারেল বোনাস!</b>\n\n👤 {userName} আপনার লিংক দিয়ে যোগ দিয়েছে!\n✅ আপনি <b>+১ ক্রেডিট</b> পেয়েছেন\n💰 নতুন ব্যালেন্স: <b>{balance} ক্রেডিট</b>\n👥 মোট রেফারেল: <b>{referralCount}</b>",
    hi: "🎉 <b>रेफरल बोनस!</b>\n\n👤 {userName} आपके लिंक से जुड़ा!\n✅ आपको <b>+1 क्रेडिट</b> मिला\n💰 नया बैलेंस: <b>{balance} क्रेडिट</b>\n👥 कुल रेफरल: <b>{referralCount}</b>",
  },
  redeemUsage: {
    en: "📝 <b>How to redeem:</b>\n\nUse: /redeem YOUR_CODE\n\nExample: /redeem BONUS2024",
    bn: "📝 <b>রিডিম করার নিয়ম:</b>\n\nব্যবহার করুন: /redeem আপনার_কোড\n\nউদাহরণ: /redeem BONUS2024",
    hi: "📝 <b>रिडीम करने का तरीका:</b>\n\nउपयोग करें: /redeem YOUR_CODE\n\nउदाहरण: /redeem BONUS2024",
  },
  redeemSuccess: {
    en: "🎉 <b>Coupon Redeemed!</b>\n\n🎫 Code: <b>{code}</b>\n✅ You received <b>+{credits} credits</b>!\n💰 New balance: <b>{balance} credits</b>",
    bn: "🎉 <b>কুপন রিডিম হয়েছে!</b>\n\n🎫 কোড: <b>{code}</b>\n✅ আপনি <b>+{credits} ক্রেডিট</b> পেয়েছেন!\n💰 নতুন ব্যালেন্স: <b>{balance} ক্রেডিট</b>",
    hi: "🎉 <b>कूपन रिडीम हुआ!</b>\n\n🎫 कोड: <b>{code}</b>\n✅ आपको <b>+{credits} क्रेडिट</b> मिला!\n💰 नया बैलेंस: <b>{balance} क्रेडिट</b>",
  },
  redeemInvalid: {
    en: "❌ Invalid or expired coupon code.",
    bn: "❌ ভুল বা মেয়াদোত্তীর্ণ কুপন কোড।",
    hi: "❌ गलत या समाप्त कूपन कोड।",
  },
  redeemAlreadyUsed: {
    en: "❌ You have already used this coupon code.",
    bn: "❌ আপনি এই কুপন কোড আগেই ব্যবহার করেছেন।",
    hi: "❌ आप इस कूपन कोड का पहले ही उपयोग कर चुके हैं।",
  },
  redeemMaxUsed: {
    en: "❌ This coupon code has reached its maximum usage limit.",
    bn: "❌ এই কুপন কোড সর্বাধিক ব্যবহার সীমায় পৌঁছে গেছে।",
    hi: "❌ इस कूपन कोड की अधिकतम उपयोग सीमा पूरी हो गई है।",
  },
  depositMenu: {
    en: "💳 <b>Deposit Credits</b>\n\n📱 <b>Available Payment Methods:</b>\n{methods}\n\n📝 <b>How to deposit:</b>\n1. Send money to one of the above accounts\n2. Use: /pay METHOD AMOUNT TRX_ID\n\nExample: /pay bkash 100 ABC123XYZ",
    bn: "💳 <b>ক্রেডিট জমা দিন</b>\n\n📱 <b>উপলব্ধ পেমেন্ট মেথড:</b>\n{methods}\n\n📝 <b>জমা দেওয়ার নিয়ম:</b>\n১. উপরের যেকোনো একাউন্টে টাকা পাঠান\n২. ব্যবহার করুন: /pay মেথড পরিমাণ ট্রানজেকশন_আইডি\n\nউদাহরণ: /pay bkash 100 ABC123XYZ",
    hi: "💳 <b>क्रेडिट जमा करें</b>\n\n📱 <b>उपलब्ध पेमेंट मेथड:</b>\n{methods}\n\n📝 <b>जमा करने का तरीका:</b>\n1. ऊपर दिए गए किसी खाते में पैसे भेजें\n2. उपयोग करें: /pay METHOD AMOUNT TRX_ID\n\nउदाहरण: /pay bkash 100 ABC123XYZ",
  },
  depositNoMethods: {
    en: "❌ No payment methods available at the moment. Please try again later.",
    bn: "❌ এই মুহূর্তে কোন পেমেন্ট মেথড নেই। পরে আবার চেষ্টা করুন।",
    hi: "❌ इस समय कोई पेमेंट मेथड उपलब्ध नहीं है। कृपया बाद में प्रयास करें।",
  },
  depositUsage: {
    en: "📝 <b>Deposit Usage:</b>\n\nUse: /pay METHOD AMOUNT TRX_ID\n\nMethods: bkash, nagad, rocket, binance\n\nExample: /pay bkash 100 ABC123XYZ",
    bn: "📝 <b>ডিপোজিট নিয়ম:</b>\n\nব্যবহার: /pay মেথড পরিমাণ ট্রানজেকশন_আইডি\n\nমেথড: bkash, nagad, rocket, binance\n\nউদাহরণ: /pay bkash 100 ABC123XYZ",
    hi: "📝 <b>डिपॉजिट नियम:</b>\n\nउपयोग: /pay METHOD AMOUNT TRX_ID\n\nमेथड: bkash, nagad, rocket, binance\n\nउदाहरण: /pay bkash 100 ABC123XYZ",
  },
  depositInvalidMethod: {
    en: "❌ Invalid payment method. Available: bkash, nagad, rocket, binance",
    bn: "❌ ভুল পেমেন্ট মেথড। উপলব্ধ: bkash, nagad, rocket, binance",
    hi: "❌ गलत पेमेंट मेथड। उपलब्ध: bkash, nagad, rocket, binance",
  },
  depositInvalidAmount: {
    en: "❌ Invalid amount. Please enter a valid number.",
    bn: "❌ ভুল পরিমাণ। সঠিক সংখ্যা দিন।",
    hi: "❌ गलत राशि। कृपया सही संख्या दर्ज करें।",
  },
  depositSuccess: {
    en: "✅ <b>Deposit Request Submitted!</b>\n\n💳 Method: <b>{method}</b>\n💰 Amount: <b>৳{amount}</b>\n🔢 Transaction ID: <b>{txnId}</b>\n\n⏳ Your request is being reviewed. Credits will be added after verification.",
    bn: "✅ <b>ডিপোজিট রিকোয়েস্ট জমা হয়েছে!</b>\n\n💳 মেথড: <b>{method}</b>\n💰 পরিমাণ: <b>৳{amount}</b>\n🔢 ট্রানজেকশন আইডি: <b>{txnId}</b>\n\n⏳ আপনার রিকোয়েস্ট রিভিউ করা হচ্ছে। ভেরিফিকেশনের পর ক্রেডিট যোগ হবে।",
    hi: "✅ <b>डिपॉजिट रिक्वेस्ट जमा हुई!</b>\n\n💳 मेथड: <b>{method}</b>\n💰 राशि: <b>৳{amount}</b>\n🔢 ट्रांजेक्शन ID: <b>{txnId}</b>\n\n⏳ आपकी रिक्वेस्ट रिव्यू हो रही है। वेरिफिकेशन के बाद क्रेडिट जोड़े जाएंगे।",
  },
  depositError: {
    en: "❌ Error submitting deposit request. Please try again later.",
    bn: "❌ ডিপোজিট রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।",
    hi: "❌ डिपॉजिट रिक्वेस्ट जमा करने में त्रुटि। कृपया बाद में पुनः प्रयास करें।",
  },
  topUsage: {
    en: "📊 <b>Leaderboard</b>\n\nUse:\n/top balance - Top users by credits\n/top referrals - Top users by referrals",
    bn: "📊 <b>লিডারবোর্ড</b>\n\nব্যবহার:\n/top balance - ক্রেডিট অনুযায়ী টপ ইউজার\n/top referrals - রেফারেল অনুযায়ী টপ ইউজার",
    hi: "📊 <b>लीडरबोर्ड</b>\n\nउपयोग:\n/top balance - क्रेडिट के अनुसार टॉप यूजर\n/top referrals - रेफरल के अनुसार टॉप यूजर",
  },
  topBalance: {
    en: "🏆 <b>Top Users by Credits</b>\n\n{list}",
    bn: "🏆 <b>ক্রেডিট অনুযায়ী টপ ইউজার</b>\n\n{list}",
    hi: "🏆 <b>क्रेडिट के अनुसार टॉप यूजर</b>\n\n{list}",
  },
  topReferrals: {
    en: "🏆 <b>Top Users by Referrals</b>\n\n{list}",
    bn: "🏆 <b>রেফারেল অনুযায়ী টপ ইউজার</b>\n\n{list}",
    hi: "🏆 <b>रेफरल के अनुसार टॉप यूजर</b>\n\n{list}",
  },
  adminDepositNotification: {
    en: "🔔 <b>New Deposit Request!</b>\n\n👤 User: {userName} (@{username})\n🆔 Telegram ID: {telegramId}\n💳 Method: {method}\n💰 Amount: ৳{amount}\n🔢 TXN ID: {txnId}\n\n⏳ Awaiting approval",
    bn: "🔔 <b>নতুন ডিপোজিট রিকোয়েস্ট!</b>\n\n👤 ইউজার: {userName} (@{username})\n🆔 টেলিগ্রাম ID: {telegramId}\n💳 মেথড: {method}\n💰 পরিমাণ: ৳{amount}\n🔢 TXN ID: {txnId}\n\n⏳ অ্যাপ্রুভাল পেন্ডিং",
    hi: "🔔 <b>नई डिपॉजिट रिक्वेस्ट!</b>\n\n👤 यूजर: {userName} (@{username})\n🆔 टेलीग्राम ID: {telegramId}\n💳 मेथड: {method}\n💰 राशि: ৳{amount}\n🔢 TXN ID: {txnId}\n\n⏳ अप्रूवल पेंडिंग",
  },
};

function t(key: string, lang: Language, replacements: Record<string, string | number> = {}): string {
  let text = translations[key]?.[lang] || translations[key]?.['en'] || key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const update = await req.json();
    console.log('Telegram update received:', JSON.stringify(update));

    const message = update.message || update.edited_message || update.callback_query?.message;
    
    if (!message?.from) {
      console.log('No user info in update');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const telegramUser = message.from;
    const chatId = message.chat.id;
    const messageText = message.text || '';
    
    console.log('Telegram user:', JSON.stringify(telegramUser));
    console.log('Message:', messageText);

    // Generate unique referral code for user
    const generateReferralCode = (telegramId: number): string => {
      return telegramId.toString(36).toUpperCase();
    };

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    const isNewUser = !existingUser;
    let referrerId: number | null = null;

    // Check for referral code in /start command
    if (messageText.startsWith('/start ref_')) {
      const refCode = messageText.replace('/start ref_', '').trim();
      const { data: referrer } = await supabase
        .from('telegram_users')
        .select('telegram_id, balance, referral_count, language')
        .eq('referral_code', refCode)
        .maybeSingle();
      
      if (referrer && referrer.telegram_id !== telegramUser.id && isNewUser) {
        referrerId = referrer.telegram_id;
      }
    }

    // Upsert user into database
    const referralCode = generateReferralCode(telegramUser.id);
    const { error: userError } = await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        last_active_at: new Date().toISOString(),
        referral_code: referralCode,
        ...(isNewUser && referrerId ? { referred_by: referrerId, balance: 1 } : {}),
      }, {
        onConflict: 'telegram_id',
      });

    if (userError) {
      console.error('User upsert error:', userError);
    }

    // If new user was referred, give bonus to referrer
    if (isNewUser && referrerId) {
      const { data: referrer } = await supabase
        .from('telegram_users')
        .select('balance, referral_count, language')
        .eq('telegram_id', referrerId)
        .single();

      if (referrer) {
        const newBalance = (referrer.balance || 0) + 1;
        const newReferralCount = (referrer.referral_count || 0) + 1;
        const referrerLang = (referrer.language || 'en') as Language;

        await supabase
          .from('telegram_users')
          .update({
            balance: newBalance,
            referral_count: newReferralCount,
          })
          .eq('telegram_id', referrerId);

        // Notify referrer
        const newUserName = telegramUser.first_name || telegramUser.username || 'Someone';
        await sendTelegramMessage(referrerId, t('referralBonus', referrerLang, {
          userName: newUserName,
          balance: newBalance,
          referralCount: newReferralCount,
        }));
      }
    }

    // Get user's current data including language
    const { data: currentUser } = await supabase
      .from('telegram_users')
      .select('balance, last_daily_claim, language, referral_code, referral_count')
      .eq('telegram_id', telegramUser.id)
      .single();

    const userLang = (currentUser?.language || 'en') as Language;

    // Save message to database
    const { error: msgError } = await supabase
      .from('telegram_messages')
      .insert({
        telegram_user_id: telegramUser.id,
        message_text: messageText,
        message_type: message.photo ? 'photo' : message.document ? 'document' : 'text',
        chat_id: chatId,
      });

    if (msgError) {
      console.error('Message insert error:', msgError);
    }

    // Handle commands
    if (messageText.startsWith('/')) {
      const command = messageText.split(' ')[0].toLowerCase().replace('/', '');
      
      // Handle /start command with referral
      if (command === 'start' || messageText.startsWith('/start ref_')) {
        const balance = currentUser?.balance || 0;
        const welcomeKey = isNewUser && referrerId ? 'welcomeReferred' : 'welcome';
        await sendTelegramMessage(chatId, t(welcomeKey, userLang, { balance }));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /referral command
      if (command === 'referral') {
        const botInfo = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`).then(r => r.json());
        const botUsername = botInfo.result?.username || 'your_bot';
        await sendTelegramMessage(chatId, t('referralLink', userLang, {
          botUsername,
          referralCode: currentUser?.referral_code || generateReferralCode(telegramUser.id),
          referralCount: currentUser?.referral_count || 0,
        }));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /balance command
      if (command === 'balance') {
        const balance = currentUser?.balance || 0;
        await sendTelegramMessage(chatId, t('balance', userLang, { balance }));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /language command
      if (command === 'language') {
        await sendTelegramMessage(chatId, t('languageSelect', userLang));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle language change commands
      if (command === 'lang_en' || command === 'lang_bn' || command === 'lang_hi') {
        const newLang = command.replace('lang_', '') as Language;
        await supabase
          .from('telegram_users')
          .update({ language: newLang })
          .eq('telegram_id', telegramUser.id);
        
        await sendTelegramMessage(chatId, t('languageChanged', newLang));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /redeem command
      if (command === 'redeem') {
        const codeToRedeem = messageText.split(' ')[1]?.toUpperCase()?.trim();
        
        if (!codeToRedeem) {
          await sendTelegramMessage(chatId, t('redeemUsage', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if coupon exists and is valid
        const { data: coupon } = await supabase
          .from('coupon_codes')
          .select('*')
          .eq('code', codeToRedeem)
          .eq('is_active', true)
          .maybeSingle();

        if (!coupon) {
          await sendTelegramMessage(chatId, t('redeemInvalid', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if coupon is expired
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          await sendTelegramMessage(chatId, t('redeemInvalid', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if max uses reached
        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
          await sendTelegramMessage(chatId, t('redeemMaxUsed', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user already redeemed this coupon
        const { data: existingRedemption } = await supabase
          .from('coupon_redemptions')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('telegram_user_id', telegramUser.id)
          .maybeSingle();

        if (existingRedemption) {
          await sendTelegramMessage(chatId, t('redeemAlreadyUsed', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Redeem coupon - add credits to user
        const newBalance = (currentUser?.balance || 0) + coupon.credits;
        await supabase
          .from('telegram_users')
          .update({ balance: newBalance })
          .eq('telegram_id', telegramUser.id);

        // Record redemption
        await supabase
          .from('coupon_redemptions')
          .insert({
            coupon_id: coupon.id,
            telegram_user_id: telegramUser.id,
          });

        // Update coupon usage count
        await supabase
          .from('coupon_codes')
          .update({ current_uses: coupon.current_uses + 1 })
          .eq('id', coupon.id);

        await sendTelegramMessage(chatId, t('redeemSuccess', userLang, {
          code: coupon.code,
          credits: coupon.credits,
          balance: newBalance,
        }));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /deposit command
      if (command === 'deposit') {
        // Get active payment methods
        const { data: paymentMethods } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true);

        if (!paymentMethods || paymentMethods.length === 0) {
          await sendTelegramMessage(chatId, t('depositNoMethods', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const methodTypeLabels: Record<string, string> = {
          bkash: '📱 বিকাশ',
          nagad: '💳 নগদ',
          rocket: '🚀 রকেট',
          binance: '₿ Binance',
        };

        const methodsList = paymentMethods.map((pm: { type: string; name: string; account_number: string; account_name: string | null; instructions: string | null }) => {
          let info = `${methodTypeLabels[pm.type] || pm.type}\n   📍 ${pm.name}\n   📞 ${pm.account_number}`;
          if (pm.account_name) info += `\n   👤 ${pm.account_name}`;
          if (pm.instructions) info += `\n   ℹ️ ${pm.instructions}`;
          return info;
        }).join('\n\n');

        await sendTelegramMessage(chatId, t('depositMenu', userLang, { methods: methodsList }));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /pay command for deposit
      if (command === 'pay') {
        const parts = messageText.split(' ');
        
        if (parts.length < 4) {
          await sendTelegramMessage(chatId, t('depositUsage', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const methodType = parts[1].toLowerCase();
        const amount = parseFloat(parts[2]);
        const txnId = parts.slice(3).join(' ');

        const validMethods = ['bkash', 'nagad', 'rocket', 'binance'];
        if (!validMethods.includes(methodType)) {
          await sendTelegramMessage(chatId, t('depositInvalidMethod', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (isNaN(amount) || amount <= 0) {
          await sendTelegramMessage(chatId, t('depositInvalidAmount', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get the payment method
        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('id, name')
          .eq('type', methodType)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!paymentMethod) {
          await sendTelegramMessage(chatId, t('depositInvalidMethod', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create deposit request
        const { error: depositError } = await supabase
          .from('deposits')
          .insert({
            telegram_user_id: telegramUser.id,
            amount,
            payment_method_id: paymentMethod.id,
            transaction_id: txnId,
            status: 'pending',
          });

        if (depositError) {
          console.error('Deposit insert error:', depositError);
          await sendTelegramMessage(chatId, t('depositError', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const methodLabels: Record<string, string> = {
          bkash: 'বিকাশ',
          nagad: 'নগদ',
          rocket: 'রকেট',
          binance: 'Binance',
        };

        // Send notification to all active admins
        const { data: adminIds } = await supabase
          .from('admin_telegram_ids')
          .select('telegram_chat_id')
          .eq('is_active', true);

        if (adminIds && adminIds.length > 0) {
          const userName = telegramUser.first_name || 'Unknown';
          const username = telegramUser.username || 'no_username';
          
          for (const admin of adminIds) {
            await sendTelegramMessage(admin.telegram_chat_id, t('adminDepositNotification', 'en', {
              userName,
              username,
              telegramId: telegramUser.id,
              method: methodLabels[methodType] || methodType,
              amount,
              txnId,
            }));
          }
        }

        await sendTelegramMessage(chatId, t('depositSuccess', userLang, {
          method: methodLabels[methodType] || methodType,
          amount,
          txnId,
        }));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /top command for leaderboard
      if (command === 'top') {
        const subCommand = messageText.split(' ')[1]?.toLowerCase();

        if (!subCommand || (subCommand !== 'balance' && subCommand !== 'referrals')) {
          await sendTelegramMessage(chatId, t('topUsage', userLang));
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (subCommand === 'balance') {
          const { data: topUsers } = await supabase
            .from('telegram_users')
            .select('first_name, username, balance')
            .order('balance', { ascending: false })
            .limit(10);

          if (topUsers && topUsers.length > 0) {
            const medals = ['🥇', '🥈', '🥉'];
            const list = topUsers.map((user, index) => {
              const medal = medals[index] || `${index + 1}.`;
              const name = user.first_name || user.username || 'Unknown';
              return `${medal} ${name} - <b>${user.balance}</b> credits`;
            }).join('\n');

            await sendTelegramMessage(chatId, t('topBalance', userLang, { list }));
          }
        } else if (subCommand === 'referrals') {
          const { data: topUsers } = await supabase
            .from('telegram_users')
            .select('first_name, username, referral_count')
            .order('referral_count', { ascending: false })
            .limit(10);

          if (topUsers && topUsers.length > 0) {
            const medals = ['🥇', '🥈', '🥉'];
            const list = topUsers.map((user, index) => {
              const medal = medals[index] || `${index + 1}.`;
              const name = user.first_name || user.username || 'Unknown';
              return `${medal} ${name} - <b>${user.referral_count || 0}</b> referrals`;
            }).join('\n');

            await sendTelegramMessage(chatId, t('topReferrals', userLang, { list }));
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle /daily command - give 1 credit every 24 hours
      if (command === 'daily') {
        const lastClaim = currentUser?.last_daily_claim;
        const now = new Date();
        
        if (lastClaim) {
          const lastClaimDate = new Date(lastClaim);
          const hoursSinceLastClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastClaim < 24) {
            const hoursRemaining = Math.floor(24 - hoursSinceLastClaim);
            const minutesRemaining = Math.ceil((24 - hoursSinceLastClaim - hoursRemaining) * 60);
            await sendTelegramMessage(chatId, t('dailyAlreadyClaimed', userLang, { 
              hours: hoursRemaining, 
              minutes: minutesRemaining 
            }));
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Give daily bonus
        const newBalance = (currentUser?.balance || 0) + 1;
        const { error: updateError } = await supabase
          .from('telegram_users')
          .update({
            balance: newBalance,
            last_daily_claim: now.toISOString(),
          })
          .eq('telegram_id', telegramUser.id);

        if (updateError) {
          console.error('Balance update error:', updateError);
          await sendTelegramMessage(chatId, t('dailyError', userLang));
        } else {
          await sendTelegramMessage(chatId, t('dailySuccess', userLang, { balance: newBalance }));
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check for custom commands
      const { data: commandData } = await supabase
        .from('bot_commands')
        .select('response')
        .eq('command', command)
        .eq('is_active', true)
        .maybeSingle();

      if (commandData?.response) {
        console.log('Sending auto-reply for command:', command);
        await sendTelegramMessage(chatId, commandData.response);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
