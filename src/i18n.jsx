import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pdc_lang';

export const translations = {
  en: {
    'nav.explore': 'Explore',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.schedule': 'Schedule',
    'nav.needHelp': 'Need help?',
    'nav.callClinic': 'Call the clinic',
    'nav.brand': 'Pancholi',
    'nav.brandSub': 'Dental & Hair Transplant',

    'hero.title': 'Pancholi Dental Care & Hair Transplant Center',
    'hero.subheader': 'Confident Smiles & Healthy Hair Start Here',
    'hero.cta': 'Schedule Appointment',

    'stats.patients': 'Patients Treated',
    'stats.years': 'Years in Practice',
    'stats.consult': 'Per Consultation',

    'about.paragraph':
      'Dr. Pancholi is our lead dentist and hair transplant surgeon, bringing over 19 years of experience and a degree from Darshan Dental College. We believe everyone deserves a confident, healthy smile in a comfortable environment, so every visit is built around gentle, personalized care using the latest dental and hair restoration technology.',

    'services.title': 'Our Services',
    'services.rootCanal.title': 'Root Canal',
    'services.rootCanal.desc': 'Pain-free root canal therapy to save your natural tooth and stop the ache for good.',
    'services.denture.title': 'Denture',
    'services.denture.desc': 'Custom-fit full and partial dentures that look natural and feel comfortable.',
    'services.crown.title': 'Crown & Bridge',
    'services.crown.desc': 'Durable crowns and bridges to restore damaged or missing teeth.',
    'services.cosmetic.title': 'Cosmetic Dentistry',
    'services.cosmetic.desc': 'Whitening, veneers, and smile makeovers to help you look your best.',
    'services.hair.title': 'Hair Transplant',
    'services.hair.desc': 'Advanced hair restoration to help you get your confidence back.',

    'reviews.title': 'What Our Patients Say',
    'reviews.leaveReview': 'Leave a Review',
    'reviews.form.title': 'Share your experience',
    'reviews.form.name': 'Your Name',
    'reviews.form.rating': 'Rating',
    'reviews.form.message': 'Your Review',
    'reviews.form.messagePlaceholder': 'Tell other patients about your visit.',
    'reviews.form.submit': 'Submit Review',
    'reviews.form.sending': 'Sending…',
    'reviews.form.moderationNote': "Reviews are checked by the clinic before they appear on the site.",
    'reviews.form.thanksTitle': 'Thank you!',
    'reviews.form.thanksBody': "Your review has been submitted and will appear once it's approved.",

    'contact.title': 'Contact Us',
    'contact.firstName': 'First Name',
    'contact.lastName': 'Last Name',
    'contact.email': 'Email',
    'contact.message': 'Message',
    'contact.messagePlaceholder': "Tell us how we can help, and we'll get back to you shortly.",
    'contact.submit': 'Send Message',
    'contact.thanks': 'Thanks, {name}!',
    'contact.thanksBody': "Your message has been sent. We'll get back to you shortly.",
    'contact.sendAnother': 'Send another message',
    'contact.openMaps': 'Open in Google Maps →',

    'footer.rights': 'All rights reserved.',

    'schedule.step1': 'Before we start, can I please get your name',
    'schedule.step2': 'Great, {name} — how can we reach you?',
    'schedule.step3': 'Select a date and time for your appointment',
    'schedule.step4': "Thanks, {name} — we'll be in touch soon.",
    'schedule.back': '← Back',
    'schedule.homepage': 'Back to homepage →',
    'schedule.firstName': 'First Name',
    'schedule.lastName': 'Last Name',
    'schedule.email': 'Email',
    'schedule.countryCode': 'Country Code',
    'schedule.phone': 'Phone Number',
    'schedule.date': 'Date',
    'schedule.time': 'Time',
    'schedule.continue': 'Continue',
    'schedule.finish': 'Finish',
    'schedule.closed': 'Closed this day — pick another date.',

    'lang.toggle': 'हिंदी',

    'welcome.title': 'Welcome to Pancholi Dental Care',
    'welcome.subtitle': 'Choose your language to continue',
    'welcome.english': 'English',
    'welcome.hindi': 'हिंदी',

    'tutorial.skip': 'Skip tutorial',
    'tutorial.next': 'Next',
    'tutorial.done': "Let's go",
    'tutorial.step.menu.title': 'Open the menu anytime',
    'tutorial.step.menu.body': 'Tap here to jump to Home, About, Services, or Schedule.',
    'tutorial.step.review.title': 'Share your experience',
    'tutorial.step.review.body': 'Tap here anytime to leave a review — the clinic reviews it before it goes live.',
    'tutorial.step.cta.title': 'Book an appointment',
    'tutorial.step.cta.body': "Tap 'Schedule Appointment' whenever you're ready to book a visit.",
    'tutorial.step.services.title': 'Browse our services',
    'tutorial.step.services.body': 'See everything we offer, from root canals to hair transplants.',
    'tutorial.step.contact.title': 'Have a question?',
    'tutorial.step.contact.body': 'Send us a message here and we will get back to you shortly.',
    'tutorial.step.music.title': 'Relaxing music',
    'tutorial.step.music.body': 'Tap this button anytime to turn the background music on or off.',

    'music.on': 'Music on',
    'music.off': 'Music off'
  },
  hi: {
    'nav.explore': 'अन्वेषण करें',
    'nav.home': 'होम',
    'nav.about': 'परिचय',
    'nav.services': 'सेवाएं',
    'nav.schedule': 'अपॉइंटमेंट',
    'nav.needHelp': 'सहायता चाहिए?',
    'nav.callClinic': 'क्लिनिक को कॉल करें',
    'nav.brand': 'पांचोली',
    'nav.brandSub': 'डेंटल एंड हेयर ट्रांसप्लांट',

    'hero.title': 'पांचोली डेंटल केयर एंड हेयर ट्रांसप्लांट सेंटर',
    'hero.subheader': 'आत्मविश्वासी मुस्कान और स्वस्थ बालों की शुरुआत यहीं से',
    'hero.cta': 'अपॉइंटमेंट बुक करें',

    'stats.patients': 'इलाज किए गए मरीज़',
    'stats.years': 'वर्षों का अनुभव',
    'stats.consult': 'प्रति परामर्श',

    'about.paragraph':
      'डॉ. पांचोली हमारे प्रमुख दंत चिकित्सक और हेयर ट्रांसप्लांट सर्जन हैं, जिनके पास 19 वर्षों से अधिक का अनुभव और दर्शन डेंटल कॉलेज की डिग्री है। हमारा मानना है कि हर किसी को एक आरामदायक माहौल में आत्मविश्वासी, स्वस्थ मुस्कान पाने का हक़ है, इसलिए हर विज़िट नवीनतम डेंटल और हेयर रिस्टोरेशन तकनीक का उपयोग करते हुए कोमल, व्यक्तिगत देखभाल पर आधारित होती है।',

    'services.title': 'हमारी सेवाएं',
    'services.rootCanal.title': 'रूट कैनाल',
    'services.rootCanal.desc': 'आपके प्राकृतिक दांत को बचाने और दर्द को हमेशा के लिए रोकने के लिए दर्द रहित रूट कैनाल थेरेपी।',
    'services.denture.title': 'डेन्चर',
    'services.denture.desc': 'कस्टम-फिट पूर्ण और आंशिक डेन्चर जो स्वाभाविक दिखते हैं और आरामदायक महसूस होते हैं।',
    'services.crown.title': 'क्राउन और ब्रिज',
    'services.crown.desc': 'क्षतिग्रस्त या टूटे हुए दांतों को ठीक करने के लिए टिकाऊ क्राउन और ब्रिज।',
    'services.cosmetic.title': 'कॉस्मेटिक डेंटिस्ट्री',
    'services.cosmetic.desc': 'व्हाइटनिंग, वीनियर और स्माइल मेकओवर जो आपको सबसे अच्छा दिखने में मदद करते हैं।',
    'services.hair.title': 'हेयर ट्रांसप्लांट',
    'services.hair.desc': 'आपका आत्मविश्वास वापस पाने में मदद के लिए उन्नत हेयर रिस्टोरेशन।',

    'reviews.title': 'हमारे मरीज़ों की राय',
    'reviews.leaveReview': 'समीक्षा लिखें',
    'reviews.form.title': 'अपना अनुभव साझा करें',
    'reviews.form.name': 'आपका नाम',
    'reviews.form.rating': 'रेटिंग',
    'reviews.form.message': 'आपकी समीक्षा',
    'reviews.form.messagePlaceholder': 'अपनी विज़िट के बारे में अन्य मरीज़ों को बताएं।',
    'reviews.form.submit': 'समीक्षा जमा करें',
    'reviews.form.sending': 'भेजा जा रहा है…',
    'reviews.form.moderationNote': 'समीक्षाएं साइट पर दिखने से पहले क्लिनिक द्वारा जांची जाती हैं।',
    'reviews.form.thanksTitle': 'धन्यवाद!',
    'reviews.form.thanksBody': 'आपकी समीक्षा जमा कर दी गई है और स्वीकृत होने के बाद दिखाई देगी।',

    'contact.title': 'संपर्क करें',
    'contact.firstName': 'पहला नाम',
    'contact.lastName': 'अंतिम नाम',
    'contact.email': 'ईमेल',
    'contact.message': 'संदेश',
    'contact.messagePlaceholder': 'बताएं हम आपकी कैसे मदद कर सकते हैं, हम जल्द ही आपसे संपर्क करेंगे।',
    'contact.submit': 'संदेश भेजें',
    'contact.thanks': 'धन्यवाद, {name}!',
    'contact.thanksBody': 'आपका संदेश भेज दिया गया है। हम जल्द ही आपसे संपर्क करेंगे।',
    'contact.sendAnother': 'एक और संदेश भेजें',
    'contact.openMaps': 'गूगल मैप्स में खोलें →',

    'footer.rights': 'सर्वाधिकार सुरक्षित।',

    'schedule.step1': 'शुरू करने से पहले, क्या मुझे आपका नाम मिल सकता है',
    'schedule.step2': 'बढ़िया, {name} — हम आपसे कैसे संपर्क करें?',
    'schedule.step3': 'अपनी अपॉइंटमेंट के लिए तारीख और समय चुनें',
    'schedule.step4': 'धन्यवाद, {name} — हम जल्द ही संपर्क करेंगे।',
    'schedule.back': '← वापस',
    'schedule.homepage': 'होमपेज पर वापस जाएं →',
    'schedule.firstName': 'पहला नाम',
    'schedule.lastName': 'अंतिम नाम',
    'schedule.email': 'ईमेल',
    'schedule.countryCode': 'कंट्री कोड',
    'schedule.phone': 'फ़ोन नंबर',
    'schedule.date': 'तारीख',
    'schedule.time': 'समय',
    'schedule.continue': 'आगे बढ़ें',
    'schedule.finish': 'पूर्ण करें',
    'schedule.closed': 'इस दिन बंद है — कोई और तारीख चुनें।',

    'lang.toggle': 'English',

    'welcome.title': 'पांचोली डेंटल केयर में आपका स्वागत है',
    'welcome.subtitle': 'जारी रखने के लिए अपनी भाषा चुनें',
    'welcome.english': 'English',
    'welcome.hindi': 'हिंदी',

    'tutorial.skip': 'ट्यूटोरियल छोड़ें',
    'tutorial.next': 'आगे',
    'tutorial.done': 'शुरू करें',
    'tutorial.step.menu.title': 'कभी भी मेनू खोलें',
    'tutorial.step.menu.body': 'होम, परिचय, सेवाएं या अपॉइंटमेंट पर जाने के लिए यहां टैप करें।',
    'tutorial.step.review.title': 'अपना अनुभव साझा करें',
    'tutorial.step.review.body': 'समीक्षा लिखने के लिए कभी भी यहां टैप करें — साइट पर दिखने से पहले क्लिनिक इसकी जांच करता है।',
    'tutorial.step.cta.title': 'अपॉइंटमेंट बुक करें',
    'tutorial.step.cta.body': "जब भी आप विज़िट बुक करने के लिए तैयार हों, 'अपॉइंटमेंट बुक करें' पर टैप करें।",
    'tutorial.step.services.title': 'हमारी सेवाएं देखें',
    'tutorial.step.services.body': 'रूट कैनाल से लेकर हेयर ट्रांसप्लांट तक, हम जो कुछ भी प्रदान करते हैं वह देखें।',
    'tutorial.step.contact.title': 'कोई सवाल है?',
    'tutorial.step.contact.body': 'यहां हमें संदेश भेजें, हम जल्द ही आपसे संपर्क करेंगे।',
    'tutorial.step.music.title': 'सुकून भरा संगीत',
    'tutorial.step.music.body': 'बैकग्राउंड संगीत चालू या बंद करने के लिए कभी भी इस बटन पर टैप करें।',

    'music.on': 'संगीत चालू',
    'music.off': 'संगीत बंद'
  }
};

const LanguageContext = createContext({ lang: 'en', toggleLang: () => {}, setLang: () => {}, t: key => key });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem(STORAGE_KEY) === 'hi' ? 'hi' : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const dict = translations[lang];
    const t = (key, vars) => {
      let str = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    };
    return {
      lang,
      toggleLang: () => setLang(prev => (prev === 'en' ? 'hi' : 'en')),
      setLang,
      t
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
