import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { FileText, Download, Printer, Settings2, Edit3, Image as ImageIcon, Plus } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { translations } from '../translations';

export default function Reports() {
  const componentRef = useRef<HTMLDivElement>(null);
  const language = useStore(state => state.language);
  const t = translations[language];
  const isRtl = language === 'ur';

  const [reportTitle, setReportTitle] = useState(t.donationReport);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePrint = () => {
    // Stage 1: Enter physical preview mode to break out of app layout
    setIsPreviewing(true);
    // Automatically try to print after a short delay for layout to settle
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error("Auto print failed:", err);
      }
    }, 500);
  };

  const openInNewTab = () => {
    const printContent = document.getElementById('printable-report')?.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>${reportTitle}</title>
            ${styles}
            <style>
              body { background: white !important; margin: 0; padding: 10mm; font-family: "Noto Nastaliq Urdu", sans-serif; position: relative; direction: rtl; }
              #printable-report { width: 100% !important; max-width: none !important; margin: 0 !important; }
              table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; border: 1.5pt solid black !important; }
              th, td { border: 1pt solid black !important; padding: 10px 5px !important; text-align: center !important; font-size: 11pt !important; line-height: 1.4 !important; }
              th { background-color: #f3f4f6 !important; font-weight: bold !important; white-space: normal !important; overflow: hidden; height: 60px !important; vertical-align: middle !important; }
              .col-date { width: 100px !important; white-space: nowrap !important; border-left: 1pt solid black !important; }
              .col-category { width: 120px !important; border-left: 1pt solid black !important; }
              .col-type { width: 80px !important; border-left: 1pt solid black !important; }
              .col-name { width: auto !important; text-align: right !important; padding-right: 15px !important; border-left: 1pt solid black !important; }
              .col-amount { width: 90px !important; border-left: 1pt solid black !important; }
              .col-percent { width: 70px !important; border-left: 1pt solid black !important; }
              .col-share { width: 90px !important; border-left: 1pt solid black !important; }
              .col-net { width: 100px !important; }
              .export-hide, .print-hide, .print\\:hidden { display: none !important; }
              /* Floating button for manual trigger if auto fails */
              #manual-print { 
                position: fixed; top: 10px; right: 10px; padding: 15px 30px; 
                background: #ea580c; color: white; border: none; border-radius: 8px; 
                font-weight: bold; cursor: pointer; z-index: 1000; font-size: 16px;
              }
              @media print { #manual-print { display: none !important; } }
            </style>
          </head>
          <body dir="rtl">
            <button id="manual-print" onclick="window.print()">پرنٹ کرنے کے لیے یہاں کلک کریں (Click to Print)</button>
            <div id="printable-report">${printContent}</div>
            <script>
              window.onload = () => { 
                setTimeout(() => { window.print(); }, 1500); 
              };
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      alert("Pop-up blocked! Please allow pop-ups or use the Full Screen button.");
    }
  };
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const isAdmin = currentUser?.role === 'Admin';
  const canManageDonations = !!currentUser && (isAdmin || (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('manage_donations')));
  const donations = useStore(state => state.donations);
  const expenses = useStore(state => state.expenses);
  const loadAllDonations = useStore(state => state.loadAllDonations);
  const loadAllExpenses = useStore(state => state.loadAllExpenses);
  const settings = useStore(state => state.settings);
  const { currency, dateFormat } = settings;

  useEffect(() => {
    loadAllDonations();
    loadAllExpenses();
  }, [loadAllDonations, loadAllExpenses]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      // Use parseISO for more reliable date parsing from string
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      // Ensure we have a valid pattern from settings or fallback
      const currentPattern = (dateFormat || 'DD-MM-YYYY')
        .replace('DD', 'dd')
        .replace('MM', 'MM')
        .replace('YYYY', 'yyyy');
        
      return format(date, currentPattern);
    } catch {
      return dateStr;
    }
  };

  // Update title when language changes if it hasn't been manually edited
  useEffect(() => {
    if (!isEditingTitle) {
      setReportTitle(t.donationReport);
    }
  }, [language, t.donationReport, isEditingTitle]);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [donorFilter, setDonorFilter] = useState('');

  // Columns visibility
  const [columns, setColumns] = useState({
    date: true,
    category: true,
    type: true,
    donorName: true,
    amount: true,
    percentage: true,
    collectorShare: true,
    netAmount: true,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Manual Entry State
  const [manualEntries, setManualEntries] = useState<any[]>([]);
  const [newManualEntry, setNewManualEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    donorName: '',
    amount: '',
    percentage: '',
    collectorShare: '',
    netAmount: ''
  });

  const handleAddManualEntry = () => {
    if (newManualEntry.donorName) {
      setManualEntries([...manualEntries, { ...newManualEntry, isManual: true, id: `manual-${Date.now()}` }]);
      setNewManualEntry({
        date: format(new Date(), 'yyyy-MM-dd'),
        donorName: '',
        amount: '',
        percentage: '',
        collectorShare: '',
        netAmount: ''
      });
    }
  };

  // Filter Data
  let filteredDonations = donations.filter(d => {
    let match = true;
    if (startDate && endDate) {
      const date = parseISO(d.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (!isWithinInterval(date, { start, end })) match = false;
    }
    if (minAmount && d.amount < Number(minAmount)) match = false;
    if (maxAmount && d.amount > Number(maxAmount)) match = false;
    if (donorFilter && !d.donorName.toLowerCase().includes(donorFilter.toLowerCase())) match = false;
    return match;
  });

  let filteredExpenses = expenses.filter(e => {
    let match = true;
    if (startDate && endDate) {
      const date = parseISO(e.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (!isWithinInterval(date, { start, end })) match = false;
    }
    if (minAmount && e.amount < Number(minAmount)) match = false;
    if (maxAmount && e.amount > Number(maxAmount)) match = false;
    if (donorFilter && !e.description.toLowerCase().includes(donorFilter.toLowerCase())) match = false;
    return match;
  });

  // Combine with manual entries and expenses
  const finalData = [
    ...filteredDonations.map(d => ({
      id: d.id,
      date: d.date,
      type: t.income,
      category: '-',
      donorName: d.donorName,
      amount: d.amount,
      percentage: d.percentage,
      collectorShare: d.collectorShare,
      netAmount: d.netAmount,
      isManual: false
    })),
    ...filteredExpenses.map(e => ({
      id: e.id,
      date: e.date,
      type: t.expense,
      category: e.category || '-',
      donorName: e.description,
      amount: e.amount,
      percentage: '-',
      collectorShare: '-',
      netAmount: -e.amount,
      isManual: false
    })),
    ...manualEntries.map(m => ({
      id: m.id,
      date: m.date,
      type: t.manualEntry,
      category: '-',
      donorName: m.donorName,
      amount: m.amount,
      percentage: m.percentage,
      collectorShare: m.collectorShare,
      netAmount: m.netAmount,
      isManual: true
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalIncome = finalData.filter(d => d.type === t.income || d.type === t.manualEntry).reduce((sum, d) => sum + Number(d.netAmount), 0);
  const totalExpense = finalData.filter(d => d.type === t.expense).reduce((sum, d) => sum + Math.abs(Number(d.netAmount)), 0);
  const netBalance = totalIncome - totalExpense;

  const exportToPDF = async () => {
    const element = document.getElementById('printable-report');
    if (!element) return;
    
    const originalClass = element.className;
    const originalStyle = element.style.cssText;
    
    element.classList.add('export-active');
    // Using 1400px as a standard for high-quality wide capture
    element.style.width = '1400px';
    element.style.minWidth = '1400px';
    element.style.maxWidth = '1400px';
    element.style.background = 'white';

    const hideElements = element.querySelectorAll('.export-hide, .print-hide, .print\\:hidden');
    hideElements.forEach(el => (el as HTMLElement).style.display = 'none');
    
    try {
      // Dynamic scaling: If report is very long, reduce quality/density to keep file size small
      const height = element.offsetHeight;
      const calcPixelRatio = height > 5000 ? 1 : 1.2;
      
      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: 0.7, // Lower quality for PDF for significantly smaller file size
        pixelRatio: calcPixelRatio,
        backgroundColor: '#ffffff',
        width: 1400,
      });
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable internal PDF compression
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);

      const ratio = pdfWidth / img.width;
      const imgHeight = img.height * ratio;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add with 'FAST' alias to reduce initial processing overhead
      pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${reportTitle}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Error generating PDF. Large reports may take a moment.");
    } finally {
      element.className = originalClass;
      element.style.cssText = originalStyle;
      hideElements.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const exportToJPG = async () => {
    const element = document.getElementById('printable-report');
    if (!element) return;
    
    const originalClass = element.className;
    const originalStyle = element.style.cssText;

    element.classList.add('export-active');
    element.style.width = '1400px'; 
    element.style.minWidth = '1400px';
    element.style.maxWidth = '1400px';

    const hideElements = element.querySelectorAll('.export-hide, .print-hide, .print\\:hidden');
    hideElements.forEach(el => (el as HTMLElement).style.display = 'none');
    
    try {
      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: 0.85,
        pixelRatio: 1.5, // Better quality for single JPG
        backgroundColor: '#ffffff',
        width: 1400,
      });
      
      const link = document.createElement('a');
      link.download = `${reportTitle}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating JPG", error);
    } finally {
      element.className = originalClass;
      element.style.cssText = originalStyle;
      hideElements.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const exportToExcel = () => {
    const exportData = finalData.map(d => {
      const row: any = {};
      if (columns.date) row[t.date] = formatDate(d.date);
      if (columns.category) row[t.category] = d.category;
      if (columns.type) row[t.type] = d.type;
      if (columns.donorName) row[t.donorName] = d.donorName;
      if (columns.amount) row[t.amount] = d.amount;
      if (columns.percentage) row[t.percentage] = d.percentage;
      if (columns.collectorShare) row[t.collectorShare] = d.collectorShare;
      if (columns.netAmount) row[t.netAmount] = d.netAmount;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${reportTitle}.xlsx`);
  };

  if (isPreviewing) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] overflow-auto p-0 m-0" dir="rtl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex flex-wrap justify-between items-center print:hidden z-10 shadow-sm gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsPreviewing(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold"
            >
              ← {t.back || 'Back'}
            </button>
            <button
               onClick={() => window.print()}
               className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold flex items-center gap-2 shadow-md"
            >
              <Printer className="w-5 h-5" />
              {t.print}
            </button>
            
            {/* New PDF and JPG buttons within the perfect preview model */}
            <button
              onClick={exportToPDF}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center gap-2 shadow-md"
            >
              <FileText className="w-5 h-5" />
              فائل محفوظ کریں (PDF)
            </button>
            <button
              onClick={exportToJPG}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center gap-2 shadow-md"
            >
              <ImageIcon className="w-5 h-5" />
              تصویر محفوظ کریں (JPG)
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-medium tracking-tight whitespace-nowrap">آپ فل سکرین پرنٹ اور ایکسپورٹ ویو میں ہیں۔</span>
            <button
              onClick={openInNewTab}
              className="text-blue-600 hover:underline text-sm font-bold border border-blue-200 px-3 py-1 rounded whitespace-nowrap"
            >
              نئے ٹیب میں کھولیں (Alternative)
            </button>
          </div>
        </div>

        {/* The report - isolated for perfect export capture */}
        <div id="printable-report" className="w-full max-w-none p-4 md:p-14 bg-white">
            <div className="flex flex-col md:flex-row items-center justify-between border-b-4 border-black pb-8 mb-8 gap-6">
              <div className="flex items-center gap-6">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-28 h-28 object-contain" />
                )}
                <div className="text-right">
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight">{settings.masjidName}</h1>
                  <h2 className="text-2xl text-gray-700 mt-2 font-medium">{settings.madrisaName}</h2>
                </div>
              </div>
              <div className="text-right border-right-4 border-black pr-6">
                <h3 className="text-4xl font-bold text-blue-700 underline underline-offset-8 decoration-4 mb-4">{reportTitle}</h3>
                <p className="text-xl text-gray-700 font-bold bg-gray-100 px-4 py-2 rounded-lg">
                  {startDate && endDate ? `${formatDate(startDate)} ${isRtl ? 'سے' : 'to'} ${formatDate(endDate)}` : t.allRecords}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="p-6 border-2 border-black rounded-xl text-center">
                <h3 className="text-gray-600 text-lg mb-1">{t.totalIncomeNet}</h3>
                <p className="text-3xl font-bold text-black">{currency} {totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-6 border-2 border-black rounded-xl text-center">
                <h3 className="text-gray-600 text-lg mb-1">{t.totalExpense}</h3>
                <p className="text-3xl font-bold text-black">{currency} {totalExpense.toLocaleString()}</p>
              </div>
              <div className="p-6 border-2 border-black rounded-xl text-center">
                <h3 className="text-gray-600 text-lg mb-1">{t.balance}</h3>
                <p className="text-3xl font-bold text-black">{currency} {netBalance.toLocaleString()}</p>
              </div>
            </div>

            <table className="w-full border-collapse border-2 border-black text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 uppercase tracking-tight">
                  {columns.date && <th className="border border-black p-1.5 col-date text-center font-bold text-[10px] sm:text-xs">{t.date}</th>}
                  {columns.category && <th className="border border-black p-1.5 col-category text-center font-bold text-[10px] sm:text-xs">{t.category}</th>}
                  {columns.type && <th className="border border-black p-1.5 col-type text-center font-bold text-[10px] sm:text-xs">{t.type}</th>}
                  {columns.donorName && <th className="border border-black p-1.5 col-name text-right font-bold pr-4 text-[10px] sm:text-xs">{t.donorName}</th>}
                  {columns.amount && <th className="border border-black p-1.5 col-amount text-center font-bold text-[10px] sm:text-xs">{t.amount}</th>}
                  {columns.percentage && <th className="border border-black p-1.5 col-percent text-center font-bold text-[10px] sm:text-xs">{t.percentage}</th>}
                  {columns.collectorShare && <th className="border border-black p-1.5 col-share text-center font-bold text-[10px] sm:text-xs">{t.collectorShare}</th>}
                  {columns.netAmount && <th className="border border-black p-1.5 col-net text-center font-bold text-[10px] sm:text-xs">{t.netAmount}</th>}
                </tr>
              </thead>
              <tbody>
                {finalData.map((row, idx) => (
                  <tr key={row.id || idx} className="h-auto">
                    {columns.date && <td className="border border-black px-1.5 py-2 text-center whitespace-nowrap col-date text-[10px] sm:text-sm tabular-nums" dir="ltr">{formatDate(row.date)}</td>}
                    {columns.category && <td className="border border-black px-1.5 py-2 text-center italic col-category text-[10px] sm:text-sm">{row.category}</td>}
                    {columns.type && <td className="border border-black px-1.5 py-2 text-center col-type text-[10px] sm:text-sm">{row.type}</td>}
                    {columns.donorName && <td className="border border-black px-2 py-2 text-right font-medium leading-tight col-name text-[10px] sm:text-sm">{row.donorName}</td>}
                    {columns.amount && <td className="border border-black px-1.5 py-2 text-center col-amount text-[10px] sm:text-sm tabular-nums">{currency} {Number(row.amount).toLocaleString()}</td>}
                    {columns.percentage && <td className="border border-black px-1.5 py-2 text-center italic col-percent text-[10px] sm:text-sm">{row.percentage}{row.percentage !== '-' ? '%' : ''}</td>}
                    {columns.collectorShare && <td className="border border-black px-1.5 py-2 text-center col-share text-[10px] sm:text-sm tabular-nums">{row.collectorShare !== '-' ? currency : ''} {row.collectorShare !== '-' ? Number(row.collectorShare).toLocaleString() : '-'}</td>}
                    {columns.netAmount && <td className={`border border-black px-1.5 py-2 text-center font-bold col-net text-[10px] sm:text-sm tabular-nums ${row.type === 'خرچہ' ? 'text-red-900' : 'text-green-900'}`}>{currency} {Math.abs(Number(row.netAmount)).toLocaleString()}</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center text-base text-gray-600">
              <p dir="ltr">{t.printDate}: {formatDate(new Date().toISOString())}</p>
              <p>{t.signature}: _________________</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-0 print:w-full print:max-w-none print:p-0">
      {/* Report Controls (Not printed) */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center group">
            {isEditingTitle && isAdmin ? (
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {reportTitle}
                {isAdmin && (
                  <button 
                    onClick={() => setIsEditingTitle(true)}
                    className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                )}
              </h2>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Settings2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t.reportSettings}
                </button>
            )}
            <button
              onClick={() => setIsPreviewing(true)}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <FileText className="w-4 h-4 ml-2" />
              PDF
            </button>
            <button
              onClick={() => setIsPreviewing(true)}
              className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <ImageIcon className="w-4 h-4 ml-2" />
              JPG
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4 ml-2" />
              Excel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              id="report-print-btn"
              className={`relative z-50 flex items-center px-6 py-2 rounded-lg transition-all font-bold shadow-lg cursor-pointer active:scale-95 pointer-events-auto ${
                isPrinting ? 'bg-gray-400 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              <Printer className={`w-5 h-5 ml-2 ${isPrinting ? 'animate-pulse' : ''}`} />
              {isPrinting ? "تیار ہو رہا ہے..." : t.print}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="pt-4 border-t border-gray-100 flex flex-col gap-6">
          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.quickSelect || 'Quick Select'}:</span>
            <button
              onClick={() => {
                const now = new Date();
                setStartDate(format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'));
                setEndDate(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd'));
              }}
              className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200"
            >
              {t.thisMonth || 'This Month'} (موجودہ مہینہ)
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setStartDate(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
                setEndDate(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'));
              }}
              className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold hover:bg-green-100 transition-colors border border-green-200"
            >
              {t.thisYear || 'This Year'} (موجودہ سال)
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-200"
            >
              {t.allRecords} (تمام ریکارڈ)
            </button>
            <span className="text-xs text-gray-400 italic ml-auto">(Custom Date Selection below)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.fromDate}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.toDate}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.minAmount}</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="مثلاً 5000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.maxAmount}</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="مثلاً 20000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.donorName}</label>
            <input
              type="text"
              value={donorFilter}
              onChange={(e) => setDonorFilter(e.target.value)}
              placeholder={t.search + "..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

        {/* Manual Entry Section (Above Report) */}
        {canManageDonations && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 export-hide print:hidden w-full">
            <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center">
              <Plus className="w-5 h-5 ml-2" />
              {t.manualEntry}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {columns.date && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.date}</label>
                  <input type="date" value={newManualEntry.date} onChange={e => setNewManualEntry({...newManualEntry, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              )}
              {columns.donorName && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.donorName}</label>
                  <input type="text" placeholder={t.donorName} value={newManualEntry.donorName} onChange={e => setNewManualEntry({...newManualEntry, donorName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              )}
              {columns.amount && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.amount}</label>
                  <input type="number" placeholder={t.amount} value={newManualEntry.amount} onChange={e => setNewManualEntry({...newManualEntry, amount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              )}
              {columns.percentage && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.percentage}</label>
                  <input type="number" placeholder="%" value={newManualEntry.percentage} onChange={e => setNewManualEntry({...newManualEntry, percentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              )}
              {columns.collectorShare && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.collectorShare}</label>
                  <input type="number" placeholder={t.collectorShare} value={newManualEntry.collectorShare} onChange={e => setNewManualEntry({...newManualEntry, collectorShare: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              )}
              {columns.netAmount && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t.netAmount}</label>
                    <input type="number" placeholder={t.netAmount} value={newManualEntry.netAmount} onChange={e => setNewManualEntry({...newManualEntry, netAmount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  </div>
                  <button onClick={handleAddManualEntry} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-colors h-[38px]">
                    {t.add}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Area */}
      <div 
        ref={componentRef}
        id="printable-report" 
        className="bg-white rounded-xl shadow-sm print:shadow-none print:bg-white print:rounded-none w-full max-w-[1400px] mx-auto border border-gray-100 transition-all relative print:mx-0 print:border-none print:max-w-none" 
        dir="rtl"
      >
        <div className="p-4 md:p-10 lg:p-16 print:p-4 print:pt-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-gray-200 print:border-black/20 pb-6 mb-6 gap-4 print:break-inside-avoid print:flex-row print:justify-between">
            <div className="flex items-center gap-3 md:gap-4 print:gap-6">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 md:w-24 md:h-24 print:w-32 print:h-32 object-contain rounded-lg" />
              )}
              <div className="text-right md:text-right">
                <h1 className="text-xl md:text-3xl print:text-5xl font-bold text-gray-900">{settings.masjidName || t.centerNamePlaceholder}</h1>
                <h2 className="text-sm md:text-xl print:text-2xl text-gray-600 mt-1">{settings.madrisaName || t.branchNamePlaceholder}</h2>
              </div>
            </div>
            <div className="text-center md:text-left w-full md:w-auto print:text-left">
              <h3 className="text-xl md:text-2xl print:text-4xl font-bold text-blue-600 underline underline-offset-8 decoration-2">{reportTitle}</h3>
              <p className="text-gray-500 mt-2 text-xs md:text-sm print:text-base">
                {startDate && endDate ? `${formatDate(startDate)} ${isRtl ? 'سے' : 'to'} ${formatDate(endDate)}` : t.allRecords}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-3 md:gap-6 mb-8 print:mb-12">
            <div className="bg-green-50 p-3 md:p-5 rounded-xl border border-green-100 text-center md:text-right print:bg-white print:border-black/30 print:rounded-lg">
              <h3 className="text-green-800 text-xs md:text-sm font-medium mb-1 print:text-black/70 print:text-base">{t.totalIncomeNet}</h3>
              <p className="text-lg md:text-2xl font-bold text-green-900 print:text-black print:text-3xl">{currency} {totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-3 md:p-5 rounded-xl border border-red-100 text-center md:text-right print:bg-white print:border-black/30 print:rounded-lg">
              <h3 className="text-red-800 text-xs md:text-sm font-medium mb-1 print:text-black/70 print:text-base">{t.totalExpense}</h3>
              <p className="text-lg md:text-2xl font-bold text-red-900 print:text-black print:text-3xl">{currency} {totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-3 md:p-5 rounded-xl border border-blue-100 text-center md:text-right print:bg-white print:border-black/30 print:rounded-lg">
              <h3 className="text-blue-800 text-xs md:text-sm font-medium mb-1 print:text-black/70 print:text-base">{t.balance}</h3>
              <p className="text-lg md:text-2xl font-bold text-blue-900 print:text-black print:text-3xl">{currency} {netBalance.toLocaleString()}</p>
            </div>
          </div>

          <div className="relative text-center">
            <div className="overflow-x-auto print:overflow-visible pb-4 no-scrollbar">
              <table className="w-full divide-y divide-gray-200 text-right border-separate border-spacing-0 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  {columns.date && <th className="col-date px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.date}</th>}
                  {columns.category && <th className="col-category px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.category}</th>}
                  {columns.type && <th className="col-type px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.type}</th>}
                  {columns.donorName && <th className="donor-col col-name px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-right pr-4">{t.donorName}</th>}
                  {columns.amount && <th className="col-amount px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.amount}</th>}
                  {columns.percentage && <th className="col-percent px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.percentage}</th>}
                  {columns.collectorShare && <th className="col-share px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.collectorShare}</th>}
                  {columns.netAmount && <th className="col-net px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-700 text-center">{t.netAmount}</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finalData.map((row, idx) => (
                  <tr key={row.id || idx} className={`${row.isManual ? 'bg-yellow-50' : row.type === 'خرچہ' ? 'bg-red-50' : ''} hover:bg-gray-50 transition-colors`}>
                    {columns.date && <td className="col-date px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm text-gray-600 text-center italic tabular-nums" dir="ltr">{formatDate(row.date)}</td>}
                    {columns.category && <td className="col-category px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm text-gray-500 text-center italic truncate max-w-[80px] md:max-w-none">{row.category}</td>}
                    {columns.type && <td className="col-type px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-medium text-gray-700 text-center">{row.type}</td>}
                    {columns.donorName && <td className="col-name donor-col px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-gray-800 text-right pr-4 overflow-visible print:whitespace-normal leading-tight">{row.donorName}</td>}
                    {columns.amount && <td className="col-amount px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm text-blue-700 font-bold text-center tabular-nums">{currency} {Number(row.amount).toLocaleString()}</td>}
                    {columns.percentage && <td className="col-percent px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm text-gray-500 text-center italic">{row.percentage}{row.percentage !== '-' ? '%' : ''}</td>}
                    {columns.collectorShare && <td className="col-share px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm text-gray-600 text-center tabular-nums">{row.collectorShare === '-' ? '-' : `${currency} ${Number(row.collectorShare).toLocaleString()}`}</td>}
                    {columns.netAmount && <td className={`col-net px-1 md:px-4 py-2 md:py-3 text-[9px] md:text-sm font-bold text-center ${row.type === 'خرچہ' ? 'text-red-600' : 'text-green-600'}`}>{currency} {Math.abs(Number(row.netAmount)).toLocaleString()}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
            <p dir="ltr">{t.printDate}: {formatDate(new Date().toISOString())}</p>
            <p>{t.signature}: _________________</p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl p-6 shadow-xl w-full max-w-md z-50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {t.reportSettings}
            </Dialog.Title>
            
            <div className="space-y-4">
              {Object.entries({
                date: t.date,
                category: t.category,
                type: t.type,
                donorName: t.donorName,
                amount: t.amount,
                percentage: t.percentage,
                collectorShare: t.collectorShare,
                netAmount: t.netAmount
              }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columns[key as keyof typeof columns]}
                    onChange={(e) => setColumns({...columns, [key]: e.target.checked})}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`mx-2 text-gray-700`}>{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {t.save}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
