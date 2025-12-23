import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "bn" | "hi";

type Translations = {
  [key: string]: {
    en: string;
    bn: string;
    hi: string;
  };
};

export const translations: Translations = {
  // Dashboard
  dashboard: { en: "Dashboard", bn: "ড্যাশবোর্ড", hi: "डैशबोर्ड" },
  totalUsers: { en: "Total Users", bn: "মোট ব্যবহারকারী", hi: "कुल उपयोगकर्ता" },
  activeUsers: { en: "Active Users", bn: "সক্রিয় ব্যবহারকারী", hi: "सक्रिय उपयोगकर्ता" },
  totalMessages: { en: "Total Messages", bn: "মোট বার্তা", hi: "कुल संदेश" },
  totalBalance: { en: "Total Balance", bn: "মোট ব্যালেন্স", hi: "कुल शेष" },
  credits: { en: "Credits", bn: "ক্রেডিট", hi: "क्रेडिट" },
  
  // Panels
  botUsers: { en: "Bot Users", bn: "বট ব্যবহারকারী", hi: "बॉट उपयोगकर्ता" },
  messages: { en: "Messages", bn: "বার্তা", hi: "संदेश" },
  botCommands: { en: "Bot Commands", bn: "বট কমান্ড", hi: "बॉट कमांड" },
  
  // Users Panel
  user: { en: "User", bn: "ব্যবহারকারী", hi: "उपयोगकर्ता" },
  username: { en: "Username", bn: "ইউজারনেম", hi: "यूज़रनेम" },
  balance: { en: "Balance", bn: "ব্যালেন্স", hi: "शेष" },
  lastActive: { en: "Last Active", bn: "সর্বশেষ সক্রিয়", hi: "अंतिम सक्रिय" },
  joined: { en: "Joined", bn: "যোগদান", hi: "शामिल हुए" },
  noUsers: { en: "No users yet", bn: "এখনো কোনো ব্যবহারকারী নেই", hi: "अभी तक कोई उपयोगकर्ता नहीं" },
  
  // Messages Panel
  from: { en: "From", bn: "প্রেরক", hi: "प्रेषक" },
  message: { en: "Message", bn: "বার্তা", hi: "संदेश" },
  time: { en: "Time", bn: "সময়", hi: "समय" },
  noMessages: { en: "No messages yet", bn: "এখনো কোনো বার্তা নেই", hi: "अभी तक कोई संदेश नहीं" },
  
  // Commands Panel
  command: { en: "Command", bn: "কমান্ড", hi: "कमांड" },
  response: { en: "Response", bn: "প্রতিক্রিয়া", hi: "प्रतिक्रिया" },
  status: { en: "Status", bn: "স্ট্যাটাস", hi: "स्थिति" },
  actions: { en: "Actions", bn: "অ্যাকশন", hi: "क्रियाएं" },
  active: { en: "Active", bn: "সক্রিয়", hi: "सक्रिय" },
  inactive: { en: "Inactive", bn: "নিষ্ক্রিয়", hi: "निष्क्रिय" },
  addCommand: { en: "Add Command", bn: "কমান্ড যোগ করুন", hi: "कमांड जोड़ें" },
  noCommands: { en: "No commands configured", bn: "কোনো কমান্ড কনফিগার করা হয়নি", hi: "कोई कमांड कॉन्फ़िगर नहीं किया गया" },
  
  // Sidebar
  orders: { en: "Orders", bn: "অর্ডার", hi: "ऑर्डर" },
  customers: { en: "Customers", bn: "গ্রাহক", hi: "ग्राहक" },
  settings: { en: "Settings", bn: "সেটিংস", hi: "सेटिंग्स" },
  logout: { en: "Logout", bn: "লগআউট", hi: "लॉगआउट" },
  
  // Common
  loading: { en: "Loading...", bn: "লোড হচ্ছে...", hi: "लोड हो रहा है..." },
  error: { en: "Error", bn: "ত্রুটি", hi: "त्रुटि" },
  save: { en: "Save", bn: "সংরক্ষণ", hi: "सहेजें" },
  cancel: { en: "Cancel", bn: "বাতিল", hi: "रद्द करें" },
  delete: { en: "Delete", bn: "মুছুন", hi: "हटाएं" },
  edit: { en: "Edit", bn: "সম্পাদনা", hi: "संपादित करें" },
  language: { en: "Language", bn: "ভাষা", hi: "भाषा" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
