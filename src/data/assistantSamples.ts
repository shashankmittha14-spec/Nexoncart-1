export type AssistantSample = {
  q: string;
  a: string;
  lang?: string;
  a_hi?: string;
  a_en?: string;
};

export const assistantSamples: AssistantSample[] = [
  {
    q: 'How do I start shopping?',
    a: 'Open the app, scan the product barcode with your phone camera, and items will be added to your cart automatically.',
    a_hi: 'एप खोलें, उत्पाद का बारकोड अपने फोन कैमरे से स्कैन करें, और आइटम स्वतः ही आपके कार्ट में जुड़ जाएगा।',
  },
  {
    q: 'How do I pay?',
    a: 'You can pay using UPI from the cart page — choose your UPI app and confirm the payment.',
    a_hi: 'आप कार्ट पेज से UPI के जरिए भुगतान कर सकते हैं — अपनी UPI ऐप चुनें और भुगतान की पुष्टि करें।',
  },
  {
    q: 'What is NexonCart?',
    a: 'NexonCart is a queue-free supermarket checkout experience: scan, track, pay, and walk out.',
    a_hi: 'NexonCart एक कतार-रहित सुपरमार्केट चेकआउट अनुभव है: स्कैन करें, ट्रैक करें, भुगतान करें और निकल जाएँ।',
  },
  {
    q: 'How to set my budget?',
    a: 'Go to the Shop page and click "Set Budget" to configure your spending limit for the session.',
    a_hi: 'Shop पेज पर जाएँ और अपने सत्र के लिए खर्च सीमा सेट करने के लिए "Set Budget" पर क्लिक करें।',
  },
  {
    q: 'I need help',
    a: 'You can ask me about scanning, payments, or your cart — or open the help section on the Shop page.',
    a_hi: 'आप मुझसे स्कैनिंग, भुगतान, या अपने कार्ट के बारे में पूछ सकते हैं — या Shop पेज पर हेल्प सेक्शन खोलें।',
  },
  // User-provided training Q&A (added 2026-02-23)
  {
    q: 'What if I scan the wrong product?',
    a: 'You can remove or edit items in your cart before making payment. Once payment is completed, changes are not allowed.',
    a_hi: 'यदि आपने गलत उत्पाद स्कैन कर दिया है, तो भुगतान करने से पहले आप अपने कार्ट में आइटम्स को हटा या संपादित कर सकते हैं। भुगतान के बाद परिवर्तन की अनुमति नहीं है।',
  },
  {
    q: 'How can I scan products?',
    a: 'Open NexonCart, tap Scan Product, allow camera access, and point your camera at the product’s QR code or barcode. The item will be added to your cart instantly.',
    a_hi: 'NexonCart खोलें, Scan Product पर टैप करें, कैमरा एक्सेस की अनुमति दें, और उत्पाद के QR कोड या बारकोड पर अपना कैमरा पॉइंट करें। आइटम तुरंत आपके कार्ट में जुड़ जाएगा।',
  },
  {
    q: 'Where can I see my recent transactions?',
    a: 'Go to your Profile and tap on Transaction History. You’ll see all your recent payments and receipts there.',
    a_hi: 'अपनी प्रोफ़ाइल पर जाएँ और Transaction History पर टैप करें। आप वहां अपने हाल के सभी भुगतान और रसीदें देख पाएँगे।',
  },
  {
    q: 'How can I increase the quantity of the same product without scanning every time?',
    a: 'After scanning the product once, go to your cart and tap the “+” button next to the item to increase the quantity. No need to scan again.',
    a_hi: 'एक बार उत्पाद स्कैन करने के बाद, अपने कार्ट पर जाएँ और आइटम के पास "+" बटन पर टैप करके मात्रा बढ़ाएँ। फिर से स्कैन करने की आवश्यकता नहीं है।',
  },
];

export default assistantSamples;
