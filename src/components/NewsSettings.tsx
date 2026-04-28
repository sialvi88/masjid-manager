import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { translations } from '../translations';

export default function NewsSettings() {
  const { role, language, settings, updateSettings } = useStore();
  const t = translations[language];
  const isRtl = language === 'ur';
  
  const [news, setNews] = useState<string>(settings.news?.join('\n') || "");
  const [speed, setSpeed] = useState<number>(settings.ticker?.speed || 30);
  const [fontSize, setFontSize] = useState<number>(settings.ticker?.fontSize || 18);
  const [bgColor, setBgColor] = useState<string>(settings.ticker?.bgColor || "#b91c1c");
  const [textColor, setTextColor] = useState<string>(settings.ticker?.textColor || "#ffffff");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (settings.news) setNews(settings.news.join('\n'));
    if (settings.ticker) {
      setSpeed(settings.ticker.speed);
      setFontSize(settings.ticker.fontSize);
      setBgColor(settings.ticker.bgColor);
      setTextColor(settings.ticker.textColor);
    }
  }, [settings]);

  const handleSave = async () => {
    if (role === 'guest') {
      setMessage(t.guestPermissionDenied);
      return;
    }
    const newsArray = news.split(/\r?\n/).filter(line => line.trim() !== "");
    
    await updateSettings({
      news: newsArray,
      ticker: {
        speed,
        fontSize,
        bgColor,
        textColor
      }
    });

    setMessage(t.settingsUpdatedSuccess);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t.newsTickerSettings}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">{t.speedSeconds}:</label>
          <input 
            type="number"
            min="1"
            value={speed}
            onChange={(e) => setSpeed(Math.max(1, Number(e.target.value)))}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">{t.fontSizePixels}:</label>
          <input 
            type="number"
            min="8"
            max="100"
            value={fontSize}
            onChange={(e) => setFontSize(Math.max(8, Number(e.target.value)))}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">{t.stripBackground}:</label>
          <div className="flex gap-2">
            <input 
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-20 p-1 border border-gray-300 rounded"
            />
            <input 
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">{t.textColor}:</label>
          <div className="flex gap-2">
            <input 
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-10 w-20 p-1 border border-gray-300 rounded"
            />
            <input 
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <p className="mb-2 text-gray-700 font-medium">{t.writeOneNewsPerLine}:</p>
      <textarea
        value={news}
        onChange={(e) => setNews(e.target.value)}
        className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={t.writeNewsHere}
      />
      <button
        onClick={handleSave}
        disabled={role === 'guest'}
        className={`mt-4 px-6 py-2 rounded-lg transition-colors ${
          role === 'guest' 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {t.save}
      </button>
      {message && <p className="mt-4 text-green-600 font-medium">{message}</p>}
    </div>
  );
}
