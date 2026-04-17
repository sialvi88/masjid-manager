import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, CheckCircle2, QrCode, Smartphone, Building2, CreditCard, ExternalLink, ShieldCheck, Edit3, Save, X } from 'lucide-react';
import { useStore, PaymentMethod } from '../store';
import { translations } from '../translations';

const defaultPaymentMethods: Omit<PaymentMethod, 'id'>[] = [
  {
    name: 'JazzCash',
    accountName: 'مسجد و مدرسہ فنڈ',
    accountNumber: '03001234567',
    color: 'from-red-600 to-red-800',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=jazzcash:03001234567'
  },
  {
    name: 'EasyPaisa',
    accountName: 'مسجد و مدرسہ فنڈ',
    accountNumber: '03451234567',
    color: 'from-green-500 to-green-700',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=easypaisa:03451234567'
  },
  {
    name: 'Bank Transfer',
    bankName: 'Meezan Bank Ltd.',
    accountName: 'Masjid & Madrassa Welfare Trust',
    accountNumber: '12345678901234',
    color: 'from-emerald-700 to-emerald-900',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bank:meezan:12345678901234'
  },
  {
    name: 'Raast ID',
    accountName: 'مسجد و مدرسہ فنڈ',
    accountNumber: '03001234567',
    raastId: 'RAAST-12345678',
    color: 'from-blue-600 to-indigo-800',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=raast:03001234567'
  }
];

export default function DonationMethods() {
  const { paymentMethods, updatePaymentMethod, role, language } = useStore();
  const t = translations[language];
  const isRtl = language === 'ur';
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentMethod>>({});

  const isAdmin = role === 'admin';

  // Bootstrap default methods if none exist in Firestore
  useEffect(() => {
    if (isAdmin && paymentMethods.length === 0) {
      defaultPaymentMethods.forEach((method, index) => {
        updatePaymentMethod(`method_${index}`, method);
      });
    }
  }, [isAdmin, paymentMethods.length, updatePaymentMethod]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setEditForm(method);
  };

  const handleSave = async () => {
    if (editingId) {
      await updatePaymentMethod(editingId, editForm);
      setEditingId(null);
    }
  };

  const displayMethods = paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods.map((m, i) => ({ ...m, id: `default_${i}` } as PaymentMethod));

  return (
    <div className={`p-6 space-y-12 pb-32 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm mb-2"
        >
          <ShieldCheck className="w-4 h-4" />
          {t.secureAndDirectDonation}
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{t.donationMethodsTitle}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t.donationMethodsDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative group rounded-3xl overflow-hidden bg-gradient-to-br ${method.color} p-1 shadow-2xl hover:scale-[1.02] transition-all duration-500`}
          >
            <div className="bg-white rounded-[22px] p-8 h-full flex flex-col justify-between">
              {editingId === method.id ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{t.editMethod}: {method.name}</h3>
                    <button onClick={() => setEditingId(null)} className="p-2 hover:bg-gray-100 rounded-full">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {method.name === 'Bank Transfer' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">{t.bankName}</label>
                        <input
                          type="text"
                          value={editForm.bankName || ''}
                          onChange={e => setEditForm({ ...editForm, bankName: e.target.value })}
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">{t.accountName}</label>
                      <input
                        type="text"
                        value={editForm.accountName || ''}
                        onChange={e => setEditForm({ ...editForm, accountName: e.target.value })}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">{t.accountNumber}</label>
                      <input
                        type="text"
                        value={editForm.accountNumber || ''}
                        onChange={e => setEditForm({ ...editForm, accountNumber: e.target.value })}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    {method.raastId && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Raast ID</label>
                        <input
                          type="text"
                          value={editForm.raastId || ''}
                          onChange={e => setEditForm({ ...editForm, raastId: e.target.value })}
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {t.save}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${method.color} text-white shadow-lg`}>
                      {method.name === 'Bank Transfer' ? <Building2 className="w-8 h-8" /> : 
                       method.name === 'Raast ID' ? <CreditCard className="w-8 h-8" /> : 
                       <Smartphone className="w-8 h-8" />}
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <button 
                          onClick={() => handleEdit(method)}
                          className="p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl text-blue-500 transition-colors"
                        >
                          <Edit3 className="w-6 h-6" />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedQR(method.qrUrl || null)}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <QrCode className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{method.name}</h3>
                    {method.bankName && <p className="text-xl font-extrabold text-gray-900">{method.bankName}</p>}
                    <p className="text-2xl font-bold text-gray-800">{method.accountName}</p>
                  </div>

                  <div className="relative group/num">
                    <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group-hover/num:border-blue-400 transition-colors">
                      <p className="text-sm text-gray-500 mb-1">{t.accountNumber}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-3xl font-mono font-bold text-gray-900 tracking-tighter">
                          {method.accountNumber}
                        </p>
                        <button 
                          onClick={() => copyToClipboard(method.accountNumber, method.id)}
                          className="p-2 hover:bg-white rounded-xl transition-all active:scale-95"
                        >
                          {copiedId === method.id ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Copy className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    {copiedId === method.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-8 right-0 bg-green-500 text-white text-xs py-1 px-3 rounded-full font-bold shadow-lg"
                      >
                        {t.copied}
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button className={`flex-1 py-4 rounded-2xl bg-gradient-to-r ${method.color} text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}>
                      <ExternalLink className="w-5 h-5" />
                      {t.openApp}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedQR(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900">{t.scanQrCode}</h3>
              <div className="p-4 bg-gray-50 rounded-3xl border-4 border-gray-100">
                <img src={selectedQR} alt="QR Code" className="w-full h-auto rounded-2xl" />
              </div>
              <button 
                onClick={() => setSelectedQR(null)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
              >
                {t.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
