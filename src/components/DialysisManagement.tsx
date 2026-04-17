import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, Users, Stethoscope, Settings, 
  FileText, Plus, Search, Edit2, Trash2, 
  ChevronRight, Calendar, Phone, MapPin, 
  Activity, AlertCircle, CheckCircle2,
  Clock, Package, CreditCard, BarChart3,
  ClipboardList, Thermometer, Droplets,
  ArrowUpRight, ArrowDownRight, Filter,
  UserPlus, History, Info, Save, X,
  AlertTriangle, ShieldCheck, Download,
  LayoutDashboard, UserCheck, Syringe,
  Wrench, Bell
} from 'lucide-react';
import { 
  useStore, Patient, Doctor, Machine, Staff, 
  LedgerEntry, DialysisSession, InventoryItem,
  Invoice, Prescription, Shift, ScheduleEntry
} from '../store';
import { translations } from '../translations';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

type TabType = 'dashboard' | 'patients' | 'sessions' | 'scheduling' | 'machines' | 'inventory' | 'billing' | 'staff' | 'reports';

export default function DialysisManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    status: 'Active',
    vascularAccessType: 'Fistula',
    bloodGroup: 'B+'
  });

  const [newSession, setNewSession] = useState<Partial<DialysisSession>>({
    status: 'In-Progress',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm')
  });

  const [newMachine, setNewMachine] = useState<Partial<Machine>>({
    status: 'Available',
    runtimeHours: 0
  });

  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    status: 'Active'
  });

  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    status: 'Active'
  });

  const [newInventory, setNewInventory] = useState<Partial<InventoryItem>>({
    quantity: 0,
    minThreshold: 10
  });

  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleEntry>>({
    dayOfWeek: 0,
    chairNumber: '1'
  });

  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    status: 'Pending',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeSession, setActiveSession] = useState<DialysisSession | null>(null);

  const { 
    patients, doctors, machines, dialysisStaff, ledger,
    sessions, inventory, invoices, prescriptions, shifts, schedule,
    language,
    addPatient, updatePatient, deletePatient,
    addSession, updateSession, deleteSession,
    addInventoryItem, updateInventoryItem,
    addInvoice, updateInvoice,
    addMachine, updateMachine,
    addStaff, updateStaff,
    addDoctor, updateDoctor,
    addScheduleEntry
  } = useStore();

  const t = translations[language];

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.mrd) return;
    await addPatient(newPatient as Patient);
    setShowAddModal(false);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.patientId || !newSession.machineId) return;
    await addSession(newSession as DialysisSession);
    setShowSessionModal(false);
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachine.name || !newMachine.serialNumber) return;
    await addMachine(newMachine as Machine);
    setShowMachineModal(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.role) return;
    await addStaff(newStaff as Staff);
    setShowStaffModal(false);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.specialization) return;
    await addDoctor(newDoctor as Doctor);
    setShowDoctorModal(false);
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInventory.name || !newInventory.category) return;
    await addInventoryItem(newInventory as InventoryItem);
    setShowInventoryModal(false);
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.patientId || !newInvoice.netAmount) return;
    await addInvoice(newInvoice as Invoice);
    setShowInvoiceModal(false);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.patientId || !newSchedule.shiftId) return;
    await addScheduleEntry(newSchedule as ScheduleEntry);
    setShowScheduleModal(false);
  };

  const tabs: { id: TabType; label: string; icon: any; color: string }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, color: 'blue' },
    { id: 'patients', label: t.patientsRecord, icon: Users, color: 'indigo' },
    { id: 'sessions', label: t.dialysisSessions, icon: Activity, color: 'emerald' },
    { id: 'scheduling', label: t.scheduling, icon: Calendar, color: 'purple' },
    { id: 'machines', label: t.machines, icon: Wrench, color: 'orange' },
    { id: 'inventory', label: t.inventory, icon: Package, color: 'rose' },
    { id: 'billing', label: t.billing, icon: CreditCard, color: 'cyan' },
    { id: 'staff', label: t.staffDoctors, icon: UserCheck, color: 'teal' },
    { id: 'reports', label: t.reports, icon: BarChart3, color: 'slate' },
  ];

  // Helper for stats
  const stats = useMemo(() => ({
    totalPatients: patients.length,
    activeSessions: sessions.filter(s => s.status === 'In-Progress').length,
    availableMachines: machines.filter(m => m.status === 'Available').length,
    lowStockItems: inventory.filter(i => i.quantity <= i.minThreshold).length,
    todayRevenue: ledger
      .filter(l => l.type === 'Income' && l.date === format(new Date(), 'yyyy-MM-dd'))
      .reduce((sum, l) => sum + l.amount, 0)
  }), [patients, sessions, machines, inventory, ledger]);

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.totalPatients, value: stats.totalPatients, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: t.activeSessions, value: stats.activeSessions, icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
          { label: t.availableMachines, value: stats.availableMachines, icon: Wrench, color: 'bg-orange-50 text-orange-600' },
          { label: t.todayRevenue, value: `Rs. ${stats.todayRevenue.toLocaleString()}`, icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Sessions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              {t.activeSessions}
            </h2>
            <button onClick={() => setActiveTab('sessions')} className="text-sm text-blue-600 font-bold hover:underline">{t.viewAll}</button>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {sessions.filter(s => s.status === 'In-Progress').length > 0 ? (
              <div className="divide-y divide-gray-50">
                {sessions.filter(s => s.status === 'In-Progress').map(session => {
                  const patient = patients.find(p => p.id === session.patientId);
                  const machine = machines.find(m => m.id === session.machineId);
                  return (
                    <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                          {patient?.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{patient?.name}</p>
                          <p className="text-xs text-gray-500">{t.machine}: {machine?.name} • {t.startTime}: {session.startTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-600">BP: 120/80</p>
                          <p className="text-[10px] text-gray-400">{t.lastUpdate}: 10 min ago</p>
                        </div>
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <Activity className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="text-gray-400 text-sm">{t.noActiveSessions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            {t.alertsNotifications}
          </h2>
          <div className="space-y-3">
            {stats.lowStockItems > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-900">{t.inventoryAlert}</p>
                  <p className="text-xs text-rose-700">{stats.lowStockItems} {t.itemsLowStock}</p>
                </div>
              </div>
            )}
            {machines.some(m => m.status === 'Maintenance') && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3">
                <Wrench className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-900">{t.machineMaintenance}</p>
                  <p className="text-xs text-orange-700">{t.machinesInMaintenance}</p>
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-900">{t.todayAppointments}</p>
                <p className="text-xs text-blue-700">{t.scheduledPatientsToday}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setNewPatient({ status: 'Active', vascularAccessType: 'Fistula', bloodGroup: 'B+' });
            setShowAddModal(true);
          }}
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus className="w-5 h-5" />
          {t.registerNewPatient}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.mrd.includes(searchTerm) || 
          p.phone.includes(searchTerm)
        ).map(patient => (
          <motion.div 
            key={patient.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {patient.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{patient.name}</h3>
                  <p className="text-xs font-bold text-indigo-600">MRD: {patient.mrd}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                patient.status === 'Active' ? 'bg-green-50 text-green-600' : 
                patient.status === 'Deceased' ? 'bg-gray-100 text-gray-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {patient.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.ageGender}</p>
                <p className="text-sm font-medium text-gray-700">{patient.age} {t.years} • {patient.gender}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.bloodGroup}</p>
                <p className="text-sm font-bold text-rose-600">{patient.bloodGroup}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.dryWeight}</p>
                <p className="text-sm font-bold text-gray-700">{patient.dryWeight} kg</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.accessType}</p>
                <p className="text-sm font-medium text-gray-700">{patient.vascularAccessType}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex gap-2">
              <button className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">{t.fullProfile}</button>
              <button className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => deletePatient(patient.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.dialysisSessions}</h2>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 p-2 rounded-xl text-gray-600 hover:bg-gray-50">
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowSessionModal(true)}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Plus className="w-5 h-5" />
            {t.startNewSession}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">{t.patient}</th>
              <th className="px-6 py-4">{t.date} & {t.startTime}</th>
              <th className="px-6 py-4">{t.machine}</th>
              <th className="px-6 py-4">{t.status}</th>
              <th className="px-6 py-4">{t.vitals}</th>
              <th className="px-6 py-4">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sessions.map(session => {
              const patient = patients.find(p => p.id === session.patientId);
              const machine = machines.find(m => m.id === session.machineId);
              return (
                <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold">
                        {patient?.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{patient?.name}</p>
                        <p className="text-[10px] text-gray-400">MRD: {patient?.mrd}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-700">{session.date}</p>
                    <p className="text-xs text-gray-400">{session.startTime}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-600">{machine?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      session.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                      session.status === 'In-Progress' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-bold text-gray-700">120/80</span>
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold text-gray-700">72</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 font-bold text-sm hover:underline">{t.details}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.inventory}</h2>
        <button 
          onClick={() => setShowInventoryModal(true)}
          className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t.addInventory}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventory.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <Package className="w-6 h-6" />
              </div>
              {item.quantity <= item.minThreshold && (
                <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {t.lowStock}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{item.name}</h3>
              <p className="text-xs text-gray-400">{item.category}</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-gray-900">{item.quantity}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.available} {item.unit}</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">{t.updateStock}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.billing}</h2>
        <button 
          onClick={() => setShowInvoiceModal(true)}
          className="bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t.createInvoice}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase">
              <tr>
                <th className="px-6 py-4">{t.invoiceNumber}</th>
                <th className="px-6 py-4">{t.patient}</th>
                <th className="px-6 py-4">{t.amount}</th>
                <th className="px-6 py-4">{t.status}</th>
                <th className="px-6 py-4">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(invoice => {
                const patient = patients.find(p => p.id === invoice.patientId);
                return (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 font-bold text-sm">{invoice.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{patient?.name}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">Rs. {invoice.netAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        invoice.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-gray-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-gray-900">{t.insuranceClaims}</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-sm">{t.stateLifeInsurance}</p>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{t.submitted}</span>
              </div>
              <p className="text-xs text-gray-500">{t.policy}: SL-99283-A</p>
              <p className="text-sm font-black mt-2">Rs. 45,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduling = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.scheduling}</h2>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">{t.shiftManagement}</button>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-100"
          >
            <Plus className="w-5 h-5" />
            {t.addSchedule}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {[t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday].map((day, i) => (
          <div key={i} className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-2xl text-center">
              <p className="text-xs font-black text-purple-600 uppercase">{day}</p>
            </div>
            <div className="space-y-2">
              {schedule.filter(s => s.dayOfWeek === i).map(entry => {
                const patient = patients.find(p => p.id === entry.patientId);
                const shift = shifts.find(s => s.id === entry.shiftId);
                return (
                  <div key={entry.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-right">
                    <p className="text-xs font-bold text-gray-900">{patient?.name}</p>
                    <p className="text-[10px] text-gray-400">{shift?.name} • {entry.chairNumber}</p>
                  </div>
                );
              })}
              <button className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 hover:border-purple-200 hover:text-purple-300 transition-colors">
                <Plus className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMachines = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.machines}</h2>
        <button 
          onClick={() => setShowMachineModal(true)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t.addMachine}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map(machine => (
          <div key={machine.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                <Wrench className="w-7 h-7" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                machine.status === 'Available' ? 'bg-green-50 text-green-600' : 
                machine.status === 'In Use' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {machine.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{machine.name}</h3>
              <p className="text-xs text-gray-400">{t.model}: {machine.model} • S/N: {machine.serialNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.lastService}</p>
                <p className="text-xs font-bold text-gray-700">{machine.lastServiceDate}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.runtime}</p>
                <p className="text-xs font-bold text-gray-700">{machine.runtimeHours} {t.hours}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100">{t.maintenanceLog}</button>
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t.doctors}</h2>
          <button 
            onClick={() => setShowDoctorModal(true)}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t.addDoctor}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div key={doctor.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-black text-2xl">
                {doctor.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                <p className="text-xs text-teal-600 font-bold uppercase">{doctor.specialization}</p>
                <p className="text-xs text-gray-400 mt-1">{doctor.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t.staff}</h2>
          <button 
            onClick={() => setShowStaffModal(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t.addStaff}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dialysisStaff.map(staff => (
            <div key={staff.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                {staff.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{staff.name}</h3>
                <p className="text-xs text-gray-500">{staff.role}</p>
              </div>
              <p className="text-xs font-bold text-gray-700">{staff.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.reportsAnalytics}</h2>
        <button className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
          <Download className="w-5 h-5" />
          {t.exportData}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-gray-900">{t.sessionsSummary}</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 38, 65, 48, 72, 55].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 cursor-pointer" 
                  style={{ height: `${val}%` }}
                />
                <span className="text-[10px] font-bold text-gray-400">{t.day} {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-gray-900">{t.financialReport}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
              <span className="font-bold text-emerald-900">{t.totalIncome}</span>
              <span className="font-black text-emerald-600">Rs. 1,250,000</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl">
              <span className="font-bold text-rose-900">{t.totalExpenses}</span>
              <span className="font-black text-rose-600">Rs. 450,000</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
              <span className="font-bold text-blue-900">{t.netProfit}</span>
              <span className="font-black text-blue-600">Rs. 800,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-white border-l border-gray-100 flex flex-col shadow-xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">DCMS</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Dialysis Center</p>
            </div>
          </div>

          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? `bg-${tab.color}-50 text-${tab.color}-600 border border-${tab.color}-100 shadow-sm` 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? `text-${tab.color}-600` : ''}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-gray-50">
          <div className="bg-blue-50 p-4 rounded-2xl space-y-2">
            <p className="text-[10px] font-black text-blue-600 uppercase">{t.systemVersion}</p>
            <p className="text-sm font-bold text-blue-900">v1.0.4 - Stable</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-10 w-[1px] bg-gray-100 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{t.adminUser}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase">{t.online}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'patients' && renderPatients()}
              {activeTab === 'sessions' && renderSessions()}
              {activeTab === 'scheduling' && renderScheduling()}
              {activeTab === 'machines' && renderMachines()}
              {activeTab === 'inventory' && renderInventory()}
              {activeTab === 'billing' && renderBilling()}
              {activeTab === 'staff' && renderStaff()}
              {activeTab === 'reports' && renderReports()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-blue-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.registerNewPatient}</h2>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">{t.patientRegistrationMrd}</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddPatient} className="flex flex-col overflow-hidden">
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.patientName}</label>
                      <input 
                        type="text" 
                        required
                        placeholder={t.enterName} 
                        value={newPatient.name || ''}
                        onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.mrdNumber}</label>
                      <input 
                        type="text" 
                        required
                        placeholder="MRD-XXXX" 
                        value={newPatient.mrd || ''}
                        onChange={(e) => setNewPatient({...newPatient, mrd: e.target.value})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.age}</label>
                      <input 
                        type="number" 
                        placeholder={t.age} 
                        value={newPatient.age || ''}
                        onChange={(e) => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.gender}</label>
                      <select 
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({...newPatient, gender: e.target.value as any})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="Male">{t.male}</option>
                        <option value="Female">{t.female}</option>
                        <option value="Other">{t.other}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.bloodGroup}</label>
                      <select 
                        value={newPatient.bloodGroup}
                        onChange={(e) => setNewPatient({...newPatient, bloodGroup: e.target.value})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option>A+</option><option>A-</option>
                        <option>B+</option><option>B-</option>
                        <option>AB+</option><option>AB-</option>
                        <option>O+</option><option>O-</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.phone}</label>
                      <input 
                        type="text" 
                        placeholder="03xx-xxxxxxx" 
                        value={newPatient.phone || ''}
                        onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      {t.clinicalInfo || 'Clinical Info'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.dryWeight || 'Dry Weight'} (kg)</label>
                        <input 
                          type="number" 
                          placeholder="0.0" 
                          value={newPatient.dryWeight || ''}
                          onChange={(e) => setNewPatient({...newPatient, dryWeight: parseFloat(e.target.value)})}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.accessType || 'Access Type'}</label>
                        <select 
                          value={newPatient.vascularAccessType}
                          onChange={(e) => setNewPatient({...newPatient, vascularAccessType: e.target.value as any})}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        >
                          <option value="Fistula">{t.fistula}</option>
                          <option value="Graft">{t.graft}</option>
                          <option value="Catheter">{t.catheter}</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.diagnosis}</label>
                      <textarea 
                        placeholder={t.diagnosisPlaceholder} 
                        value={newPatient.diagnosis || ''}
                        onChange={(e) => setNewPatient({...newPatient, diagnosis: e.target.value})}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold h-24 resize-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/50">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-bold border border-gray-100 hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">{t.register}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Session Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-emerald-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.startNewSession}</h2>
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">{t.startNewDialysisSession}</p>
                </div>
                <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddSession} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.selectPatient}</label>
                  <select 
                    required
                    value={newSession.patientId || ''}
                    onChange={(e) => setNewSession({...newSession, patientId: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  >
                    <option value="">{t.selectPatient}</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.mrd})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.selectMachine}</label>
                    <select 
                      required
                      value={newSession.machineId || ''}
                      onChange={(e) => setNewSession({...newSession, machineId: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    >
                      <option value="">{t.selectMachine}</option>
                      {machines.filter(m => m.status === 'Available').map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.selectDoctor}</label>
                    <select 
                      required
                      value={newSession.doctorId || ''}
                      onChange={(e) => setNewSession({...newSession, doctorId: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    >
                      <option value="">{t.selectDoctor}</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.date}</label>
                    <input 
                      type="date" 
                      required
                      value={newSession.date || ''}
                      onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.startTime}</label>
                    <input 
                      type="time" 
                      required
                      value={newSession.startTime || ''}
                      onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowSessionModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">{t.startSession}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Machine Modal */}
      <AnimatePresence>
        {showMachineModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-orange-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.addMachine}</h2>
                  <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">{t.addNewDialysisMachine}</p>
                </div>
                <button onClick={() => setShowMachineModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddMachine} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.machineName}</label>
                  <input 
                    type="text" required placeholder="Machine Name" 
                    value={newMachine.name || ''}
                    onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.model}</label>
                    <input 
                      type="text" required placeholder="Model" 
                      value={newMachine.model || ''}
                      onChange={(e) => setNewMachine({...newMachine, model: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.serialNumber}</label>
                    <input 
                      type="text" required placeholder="Serial Number" 
                      value={newMachine.serialNumber || ''}
                      onChange={(e) => setNewMachine({...newMachine, serialNumber: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowMachineModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all">{t.addMachine}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doctor Modal */}
      <AnimatePresence>
        {showDoctorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-teal-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.addDoctor}</h2>
                  <p className="text-teal-100 text-xs font-bold uppercase tracking-wider">{t.addNewDoctor}</p>
                </div>
                <button onClick={() => setShowDoctorModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddDoctor} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.doctorName}</label>
                  <input 
                    type="text" required placeholder="Doctor Name" 
                    value={newDoctor.name || ''}
                    onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.specialization}</label>
                  <input 
                    type="text" required placeholder="e.g. Nephrologist" 
                    value={newDoctor.specialization || ''}
                    onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.phone}</label>
                  <input 
                    type="text" required placeholder="03xx-xxxxxxx" 
                    value={newDoctor.phone || ''}
                    onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold" 
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowDoctorModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all">{t.addDoctor}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-blue-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.addStaff}</h2>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">{t.addNewStaffMember}</p>
                </div>
                <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.name}</label>
                  <input 
                    type="text" required placeholder="Staff Name" 
                    value={newStaff.name || ''}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.role}</label>
                  <select 
                    required
                    value={newStaff.role || ''}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="">{t.selectRole}</option>
                    <option value="Nurse">{t.nurse}</option>
                    <option value="Technician">{t.technician}</option>
                    <option value="Receptionist">{t.receptionist}</option>
                    <option value="Manager">{t.manager}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.phone}</label>
                  <input 
                    type="text" required placeholder="03xx-xxxxxxx" 
                    value={newStaff.phone || ''}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">{t.addStaff}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-rose-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.addItem}</h2>
                  <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">{t.addNewInventoryItem}</p>
                </div>
                <button onClick={() => setShowInventoryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddInventory} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.itemName}</label>
                  <input 
                    type="text" required placeholder="Item Name" 
                    value={newInventory.name || ''}
                    onChange={(e) => setNewInventory({...newInventory, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.category}</label>
                    <input 
                      type="text" required placeholder="Category" 
                      value={newInventory.category || ''}
                      onChange={(e) => setNewInventory({...newInventory, category: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.unit}</label>
                    <input 
                      type="text" required placeholder="e.g. Pcs, Liters" 
                      value={newInventory.unit || ''}
                      onChange={(e) => setNewInventory({...newInventory, unit: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.quantity}</label>
                    <input 
                      type="number" required placeholder="0" 
                      value={newInventory.quantity || ''}
                      onChange={(e) => setNewInventory({...newInventory, quantity: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.minThreshold}</label>
                    <input 
                      type="number" required placeholder="10" 
                      value={newInventory.minThreshold || ''}
                      onChange={(e) => setNewInventory({...newInventory, minThreshold: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold" 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowInventoryModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">{t.addItem}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-purple-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.addSchedule}</h2>
                  <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">{t.addNewScheduleEntry}</p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddSchedule} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.selectPatient}</label>
                  <select 
                    required
                    value={newSchedule.patientId || ''}
                    onChange={(e) => setNewSchedule({...newSchedule, patientId: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                  >
                    <option value="">{t.selectPatient}</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.mrd})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.day || 'Day'}</label>
                    <select 
                      required
                      value={newSchedule.dayOfWeek}
                      onChange={(e) => setNewSchedule({...newSchedule, dayOfWeek: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    >
                      {[t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday].map((day, i) => (
                        <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.shift}</label>
                    <select 
                      required
                      value={newSchedule.shiftId || ''}
                      onChange={(e) => setNewSchedule({...newSchedule, shiftId: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    >
                      <option value="">{t.selectShift}</option>
                      {shifts.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.chairNumber || 'Chair Number'}</label>
                  <input 
                    type="text" required placeholder="Chair #" 
                    value={newSchedule.chairNumber || ''}
                    onChange={(e) => setNewSchedule({...newSchedule, chairNumber: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold" 
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all">{t.saveSchedule}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-cyan-600 text-white">
                <div>
                  <h2 className="text-2xl font-black">{t.createInvoice}</h2>
                  <p className="text-cyan-100 text-xs font-bold uppercase tracking-wider">{t.createNewInvoice}</p>
                </div>
                <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddInvoice} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.selectPatient}</label>
                  <select 
                    required
                    value={newInvoice.patientId || ''}
                    onChange={(e) => setNewInvoice({...newInvoice, patientId: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                  >
                    <option value="">{t.selectPatient}</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.mrd})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.amount || 'Amount'}</label>
                    <input 
                      type="number" required placeholder="0" 
                      value={newInvoice.netAmount || ''}
                      onChange={(e) => setNewInvoice({...newInvoice, netAmount: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t.paymentMethod}</label>
                    <select 
                      required
                      value={newInvoice.paymentMethodId || ''}
                      onChange={(e) => setNewInvoice({...newInvoice, paymentMethodId: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                    >
                      <option value="">{t.selectMethod}</option>
                      <option value="cash">{t.cash}</option>
                      <option value="bank">{t.bankTransfer}</option>
                      <option value="insurance">{t.insurance}</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-700 transition-all">{t.saveInvoice}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

