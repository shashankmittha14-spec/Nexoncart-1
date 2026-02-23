import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "cta": { "startShopping": "Start Shopping", "buttonStartSession": "Start your first session with NexonCart" },
      "hero": {
        "badge": "Skip the queue, save your time",
        "title": "The Future of Supermarket is Here",
        "subtitle": "Scan products, track your cart in real-time, pay with UPI, and walk out. No billing counters. No waiting. Just shopping."
      },
      "assistant": {
        "placeholder": "Ask something...",
        "unavailable": "NexonCart.Assistant unavailable.",
        "label": "NexonCart.Assistant"
      }
      ,
      "header": {
        "wait": "The wait ends here",
        "setBudget": "Set Budget",
        "logout": "Log out",
        "startShopping": "Start Shopping",
        "customer": "Customer"
      },
      "scanner": {
        "scanning": "Scanning barcode...",
        "live": "Live",
        "itemsInCart": "Items in Cart",
        "totalAmount": "Total Amount",
        "budget": "Budget: {{current}} / {{limit}}"
      },
      "how": {
        "title": "How NexonCart Works",
        "subtitle": "Four simple steps to a queue-free shopping experience"
      },
      "features": {
        "scan": { "title": "Scan Products", "desc": "Simply scan barcodes with your phone camera" },
        "track": { "title": "Track Cart", "desc": "See real-time prices and total as you shop" },
        "pay": { "title": "Pay via UPI", "desc": "Secure payment with your preferred UPI app" },
        "exit": { "title": "Quick Exit", "desc": "Show QR code and walk out - no queues!" }
      },
      "benefits": {
        "b1": "Save up to 15 minutes per visit",
        "b2": "100% Secure Payments",
        "b3": "Instant Checkout",
        "b4": "Works on any smartphone"
      },
      "ctaFull": {
        "title": "Ready to Skip the Queue?",
        "subtitle": "Join thousands of smart shoppers who save time every day",
        "button": "Start your first session with NexonCart"
      },
      "products": {
        "title": "Shop by Category"
      },
      "footer": {
        "copyright": "© 2026 NexonCart. Revolutionizing supermarket checkout.",
        "admin": "Admin",
        "guard": "Guard Portal"
      }
      ,
      "step": "Step {{n}}"
      ,
      "shop": {
        "scanProducts": "Scan Products",
        "tapToStart": "Tap to Start Scanning",
        "pointCamera": "Point camera at product barcode",
        "stopScanner": "Stop Scanner",
        "quickAdd": "Quick Add (Demo)",
        "yourCart": "Your Cart",
        "proceedToPay": "Proceed to Pay",
        "proceedToPayment": "Proceed to Payment",
        "setBudgetTitle": "Set Budget Limit",
        "setBudgetDesc": "We'll alert you when your cart exceeds this amount",
        "enterAmount": "Enter amount in ₹",
        "cancel": "Cancel",
        "setLimit": "Set Limit",
        "items": "{{n}} items",
        "budgetRemaining": "Within budget — ₹{{remaining}} remaining",
        "budgetApproaching": "Approaching budget — ₹{{remaining}} remaining",
        "budgetExceeded": "BUDGET EXCEEDED BY ₹{{excess}}"
      }
      ,
      "login": {
        "adminSignIn": "Admin Sign in",
        "guardSignIn": "Guard Sign in",
        "welcomeBack": "Welcome back",
        "signinPrompt": "Sign in to continue",
        "emailOrPhone": "Email or phone",
        "password": "Password",
        "usePassword": "Use Password",
        "loginWithOtp": "Login with OTP",
        "forgotPassword": "Forgot password?",
        "sendOtp": "Send OTP",
        "enterOtp": "Enter OTP",
        "verifyOtp": "Verify OTP",
        "sendResetOtp": "Send Reset OTP",
        "newPassword": "New password",
        "resetPassword": "Reset Password",
        "signIn": "Sign In",
        "back": "Back",
        "signOut": "Sign Out",
        "noAccount": "No account found",
        "incorrectPassword": "Incorrect password",
        "invalidOtp": "Invalid OTP",
        "passwordUpdated": "Password updated successfully",
        "newHere": "New here?",
        "createAccount": "Create an account"
      },
      "signup": {
        "createAccountTitle": "Create your account",
        "getStarted": "Get started with NexonCart in seconds",
        "fullName": "Full name",
        "emailOrPhone": "Email or Phone",
        "password": "Password",
        "createPasswordPlaceholder": "Create a password",
        "createAccount": "Create account",
        "alreadyHave": "Already have an account?",
        "signIn": "Sign in"
      }
    }
  },
  hi: {
    translation: {
      "cta": { "startShopping": "खरीदारी शुरू करें", "buttonStartSession": "NexonCart के साथ अपना पहला सत्र शुरू करें" },
      "hero": {
        "badge": "क्यू छोड़िए, अपना समय बचाइए",
        "title": "सुपरमार्केट का भविष्य यहाँ है",
        "subtitle": "उत्पाद स्कैन करें, अपने कार्ट को रियल-टाइम में ट्रैक करें, UPI के जरिए भुगतान करें और निकल जाएँ। कोई बिलिंग काउंटर नहीं। कोई इंतज़ार नहीं। बस खरीदारी।"
      },
      "assistant": {
        "placeholder": "कुछ पूछें...",
        "unavailable": "NexonCart.Assistant उपलब्ध नहीं है।",
        "label": "NexonCart.Assistant"
      }
      ,
      "header": {
        "wait": "रोक समाप्त हो गया है",
        "setBudget": "बजट सेट करें",
        "logout": "लॉग आउट",
        "startShopping": "खरीदारी शुरू करें",
        "customer": "ग्राहक"
      },
      "scanner": {
        "scanning": "बारकोड स्कैन किया जा रहा है...",
        "live": "लाइव",
        "itemsInCart": "कार्ट में आइटम",
        "totalAmount": "कुल राशि",
        "budget": "बजट: {{current}} / {{limit}}"
      },
      "how": {
        "title": "NexonCart कैसे काम करता है",
        "subtitle": "क्यू-फ्री खरीदारी अनुभव के लिए चार सरल चरण"
      },
      "features": {
        "scan": { "title": "उत्पाद स्कैन करें", "desc": "अपने फोन कैमरा से बारकोड स्कैन करें" },
        "track": { "title": "कार्ट ट्रैक करें", "desc": "खरीदारी के दौरान रीयल-टाइम कीमतें और कुल देखें" },
        "pay": { "title": "UPI से भुगतान", "desc": "अपनी पसंदीदा UPI ऐप से सुरक्षित भुगतान" },
        "exit": { "title": "त्वरित निकास", "desc": "QR कोड दिखाएँ और निकल जाएं - कोई कतार नहीं!" }
      },
      "benefits": {
        "b1": "प्रत्येक यात्रा में 15 मिनट तक बचाएँ",
        "b2": "100% सुरक्षित भुगतान",
        "b3": "तुरंत चेकआउट",
        "b4": "किसी भी स्मार्टफोन पर काम करता है"
      },
      "ctaFull": {
        "title": "क्या आप कतार छोड़ने के लिए तैयार हैं?",
        "subtitle": "हजारों स्मार्ट खरीदारों में शामिल हों जो हर दिन समय बचाते हैं",
        "button": "NexonCart के साथ अपना पहला सत्र शुरू करें"
      },
      "products": {
        "title": "श्रेणी के अनुसार खरीदें"
      },
      "footer": {
        "copyright": "© 2026 NexonCart। सुपरमार्केट चेकआउट में क्रांति।",
        "admin": "एडमिन",
        "guard": "गार्ड पोर्टल"
      }
      ,
      "step": "चरण {{n}}"
      ,
      "shop": {
        "scanProducts": "उत्पाद स्कैन करें",
        "tapToStart": "टैप करके स्कैनिंग शुरू करें",
        "pointCamera": "उत्पाद बारकोड पर कैमरा पॉइंट करें",
        "stopScanner": "स्कैनर बंद करें",
        "quickAdd": "त्वरित जोड़ें (डेमो)",
        "yourCart": "आपकी कार्ट",
        "proceedToPay": "भुगतान के लिए आगे बढ़ें",
        "proceedToPayment": "भुगतान पर जाएँ",
        "setBudgetTitle": "बजट सीमा सेट करें",
        "setBudgetDesc": "जब आपकी कार्ट इस राशि से अधिक हो जाएगी तो हम आपको सूचित करेंगे",
        "enterAmount": "राशि दर्ज करें ₹ में",
        "cancel": "रद्द करें",
        "setLimit": "सीमा सेट करें",
        "items": "{{n}} आइटम",
        "budgetRemaining": "बजट के भीतर — ₹{{remaining}} शेष",
        "budgetApproaching": "बजट के करीब — ₹{{remaining}} शेष",
        "budgetExceeded": "बजट ₹{{excess}} से अधिक हुआ"
      }
        ,
        "login": {
          "adminSignIn": "एडमिन साइन इन",
          "guardSignIn": "गार्ड साइन इन",
          "welcomeBack": "वापसी पर स्वागत है",
          "signinPrompt": "जारी रखने के लिए साइन इन करें",
          "emailOrPhone": "ईमेल या फोन",
          "password": "पासवर्ड",
          "usePassword": "पासवर्ड का उपयोग करें",
          "loginWithOtp": "OTP से लॉगिन करें",
          "forgotPassword": "पासवर्ड भूल गए?",
          "sendOtp": "OTP भेजें",
          "enterOtp": "OTP दर्ज करें",
          "verifyOtp": "OTP सत्यापित करें",
          "sendResetOtp": "रीसेट OTP भेजें",
          "newPassword": "नया पासवर्ड",
          "resetPassword": "पासवर्ड रीसेट करें",
          "signIn": "साइन इन",
          "back": "वापस",
          "signOut": "साइन आउट",
          "noAccount": "खाता नहीं मिला",
          "incorrectPassword": "गलत पासवर्ड",
          "invalidOtp": "अमान्य OTP",
          "passwordUpdated": "पासवर्ड सफलतापूर्वक अपडेट हुआ",
          "newHere": "यहाँ नया है?",
          "createAccount": "खाता बनाएं"
        },
        "signup": {
          "createAccountTitle": "अपना खाता बनाएँ",
          "getStarted": "किसी भी समय NexonCart के साथ शुरू करें",
          "fullName": "पूरा नाम",
          "emailOrPhone": "ईमेल या फोन",
          "password": "पासवर्ड",
          "createPasswordPlaceholder": "एक पासवर्ड बनाएं",
          "createAccount": "खाता बनाएं",
          "alreadyHave": "पहले से एक खाता है?",
          "signIn": "साइन इन"
        }
    }
  }
};

const saved = (() => {
  try {
    return localStorage.getItem('locale') || undefined;
  } catch {
    return undefined;
  }
})();

i18n.use(initReactI18next).init({
  resources,
  lng: saved || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
