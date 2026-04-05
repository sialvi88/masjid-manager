import React, { useState } from 'react';
import { useStore, Donation } from '../store';
import { format } from 'date-fns';
import { 
  Pencil, Trash2, Copy, Plus, Settings, 
  CheckSquare, Square, Search, AlertCircle, History
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import { translations } from '../translations';

export default function Donations() {
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const donations = useStore(state => state.donations);
  const isAdmin = role === 'admin' || !!currentUser?.permissions.includes('manage_donations');
  const globalPercentage = useStore(state => state.globalPercentage);
  const setGlobalPercentage = useStore(state => state.setGlobalPercentage);
  const addDonation = useStore(state => state.addDonation);
  const updateDonation = useStore(state => state.updateDonation);
  const deleteDonation = useStore(state => state.deleteDonation);
  const duplicateDonation = useStore(state => state.duplicateDonation);
  const bulkDeleteDonations = useStore(state => state.bulkDeleteDonations);
  const bulkUpdateDonations = useStore(state => state.bulkUpdateDonations);
  const language = useStore(state => state.language);
  const settings = useStore(state => state.settings);
  const t = translations[language];
  const isRtl = language === 'ur';
  const { currency, dateFormat } = settings;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, dateFormat.replace('DD', 'dd').replace('YYYY', 'yyyy'));
    } catch {
      return dateStr;
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPercentageModalOpen, setIsPercentageModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  const [currentDonation, setCurrentDonation] = useState<Partial<Donation>>({});
  const [newPercentage, setNewPercentage] = useState(globalPercentage);
  const [applyToOld, setApplyToOld] = useState(false);
  const [viewHistoryDonation, setViewHistoryDonation] = useState<Donation | null>(null);
  const [bulkEditData, setBulkEditData] = useState<{ date?: string, percentage?: string, donorName?: string }>({});

  const filteredDonations = donations.filter(d => 
    d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.amount.toString().includes(searchTerm)
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDonations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDonations.map(d => d.id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // یہاں await شامل کیا گیا ہے
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDonation.donorName && currentDonation.amount && currentDonation.date) {
      await addDonation({
        donorName: currentDonation.donorName,
        amount: Number(currentDonation.amount),
        date: currentDonation.date,
        percentage: currentDonation.percentage ?? globalPercentage
      });
      setIsAddModalOpen(false);
      setCurrentDonation({});
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDonation.id) {
      updateDonation(currentDonation.id, {
        donorName: currentDonation.donorName,
        amount: Number(currentDonation.amount),
        date: currentDonation.date,
        percentage: Number(currentDonation.percentage)
      });
      setIsEditModalOpen(false);
      setCurrentDonation({});
    }
  };

  const handlePercentageSubmit = () => {
    setGlobalPercentage(newPercentage, applyToOld);
    setIsPercentageModalOpen(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(t.areYouSureBulkDelete)) {
      bulkDeleteDonations(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Donation> = {};
    if (bulkEditData.date) updates.date = bulkEditData.date;
    if (bulkEditData.percentage !== undefined && bulkEditData.percentage !== '') {
      updates.percentage = Number(bulkEditData.percentage);
    }
    if (bulkEditData.donorName) updates.donorName = bulkEditData.donorName;
    
    if (Object.keys(updates).length > 0) {
      bulkUpdateDonations(selectedIds, updates);
      setIsBulkEditModalOpen(false);
      setSelectedIds([]);
      setBulkEditData({});
    }
  };

  const openEditModal = (donation: Donation) => {
    setCurrentDonation(donation);
    setIsEditModalOpen(true);
  };

  const openHistoryModal = (donation: Donation) => {
    setViewHistoryDonation(donation);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ... (باقی UI کوڈ ویسے ہی رہے گا) ... */}
      {/* میں نے صرف handleAddSubmit کو ٹھیک کیا ہے، باقی کوڈ وہی ہے جو آپ نے دیا تھا */}
    </div>
  );
}
