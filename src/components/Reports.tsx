import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { FileText, Download, Printer, Settings2, Edit3, Image as ImageIcon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { translations } from '../translations';

export default function Reports() {
  const componentRef = useRef<HTMLDivElement>(null);
  const language = useStore(state => state.language);
  const t = translations[language];
  const isRtl = language === 'ur';

  const [reportTitle, setReportTitle] = useState(t.donationReport);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: reportTitle || t.donationReport,
  });
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const isAdmin = currentUser?.role === 'Admin';
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
    try {
      const date = new Date(dateStr);
      return format(date, dateFormat.replace('DD', 'dd').replace('YYYY', 'yyyy'));
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
    
    // Hide elements we don't want in export
    const hideElements = element.querySelectorAll('.export-hide');
    hideElements.forEach(el => (el as HTMLElement).style.display = 'none');
    
    try {
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
        },
        fontEmbedCSS: '' // Sometimes helps with font rendering
      });
      
      const imgProps = new Image();
      imgProps.src = dataUrl;
      await new Promise((resolve) => {
        imgProps.onload = resolve;
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${reportTitle}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Error generating PDF. Please try the Print button instead.");
    } finally {
      hideElements.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const exportToJPG = async () => {
    const element = document.getElementById('printable-report');
    if (!element) return;
    
    const hideElements = element.querySelectorAll('.export-hide');
    hideElements.forEach(el => (el as HTMLElement).style.display = 'none');
    
    try {
      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
        }
      });
      
      const link = document.createElement('a');
      link.download = `${reportTitle}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating JPG", error);
      alert("Error generating JPG.");
    } finally {
      hideElements.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const exportToExcel = () => {
    const exportData = finalData.map(d => {
      const row: any = {};
      if (columns.date) row[t.date] = formatDate(d.date);
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

  return (
    <div className="space-y-6">
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
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <FileText className="w-4 h-4 ml-2" />
              PDF
            </button>
            <button
              onClick={exportToJPG}
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
              onClick={() => handlePrint()}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Printer className="w-4 h-4 ml-2" />
              Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.fromDate}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.toDate}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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

      {/* Printable Report Area */}
      <div 
        ref={componentRef}
        id="printable-report" 
        className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:m-0 mx-auto max-w-5xl" 
        dir="rtl"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-lg" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{settings.masjidName || t.centerNamePlaceholder}</h1>
                <h2 className="text-xl text-gray-600 mt-1">{settings.madrisaName || t.branchNamePlaceholder}</h2>
              </div>
            </div>
          <div className="text-left">
            <h3 className="text-2xl font-bold text-blue-600">{reportTitle}</h3>
            <p className="text-gray-500 mt-2 text-sm">
              {startDate && endDate ? `${formatDate(startDate)} ${isRtl ? 'سے' : 'to'} ${formatDate(endDate)}` : t.allRecords}
            </p>
          </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
              <h3 className="text-green-800 text-sm font-medium mb-1">{t.totalIncomeNet}</h3>
              <p className="text-2xl font-bold text-green-900">{currency} {totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
              <h3 className="text-red-800 text-sm font-medium mb-1">{t.totalExpense}</h3>
              <p className="text-2xl font-bold text-red-900">{currency} {totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <h3 className="text-blue-800 text-sm font-medium mb-1">{t.balance}</h3>
              <p className="text-2xl font-bold text-blue-900">{currency} {netBalance.toLocaleString()}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-right">
              <thead className="bg-gray-50">
                <tr>
                  {columns.date && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.date}</th>}
                  {columns.type && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.type}</th>}
                  {columns.donorName && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.donorName}</th>}
                  {columns.amount && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.amount}</th>}
                  {columns.percentage && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.percentage}</th>}
                  {columns.collectorShare && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.collectorShare}</th>}
                  {columns.netAmount && <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-sm font-bold text-gray-700`}>{t.netAmount}</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finalData.map((row, idx) => (
                  <tr key={row.id || idx} className={row.isManual ? 'bg-yellow-50' : row.type === 'خرچہ' ? 'bg-red-50' : ''}>
                    {columns.date && <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(row.date)}</td>}
                    {columns.type && <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.type}</td>}
                    {columns.donorName && <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.donorName}</td>}
                    {columns.amount && <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{currency} {Number(row.amount).toLocaleString()}</td>}
                    {columns.percentage && <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.percentage}{row.percentage !== '-' ? '%' : ''}</td>}
                    {columns.collectorShare && <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.collectorShare !== '-' ? currency : ''} {row.collectorShare !== '-' ? Number(row.collectorShare).toLocaleString() : '-'}</td>}
                    {columns.netAmount && <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${row.type === 'خرچہ' ? 'text-red-600' : 'text-green-600'}`}>{currency} {Math.abs(Number(row.netAmount)).toLocaleString()}</td>}
                  </tr>
                ))}
                
                {/* Manual Entry Row */}
                {isAdmin && (
                  <tr className="bg-gray-50 print:hidden export-hide">
                    {columns.date && (
                      <td className="px-2 py-2">
                        <input type="date" value={newManualEntry.date} onChange={e => setNewManualEntry({...newManualEntry, date: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                      </td>
                    )}
                    {columns.type && <td className="px-2 py-2 text-sm text-gray-500">{t.manualEntry}</td>}
                    {columns.donorName && (
                      <td className="px-2 py-2">
                        <input type="text" placeholder={t.manualEntry + "..."} value={newManualEntry.donorName} onChange={e => setNewManualEntry({...newManualEntry, donorName: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                      </td>
                    )}
                    {columns.amount && (
                      <td className="px-2 py-2">
                        <input type="number" placeholder={t.amount} value={newManualEntry.amount} onChange={e => setNewManualEntry({...newManualEntry, amount: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                      </td>
                    )}
                    {columns.percentage && (
                      <td className="px-2 py-2">
                        <input type="number" placeholder="%" value={newManualEntry.percentage} onChange={e => setNewManualEntry({...newManualEntry, percentage: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                      </td>
                    )}
                    {columns.collectorShare && (
                      <td className="px-2 py-2">
                        <input type="number" placeholder={t.collectorShare} value={newManualEntry.collectorShare} onChange={e => setNewManualEntry({...newManualEntry, collectorShare: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                      </td>
                    )}
                    {columns.netAmount && (
                      <td className="px-2 py-2 flex gap-2">
                        <input type="number" placeholder={t.netAmount} value={newManualEntry.netAmount} onChange={e => setNewManualEntry({...newManualEntry, netAmount: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                        <button onClick={handleAddManualEntry} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">{t.add}</button>
                      </td>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
            <p>{t.printDate}: {format(new Date(), 'dd-MM-yyyy')}</p>
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
