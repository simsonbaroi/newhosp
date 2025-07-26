import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useTakaFormat } from '../hooks/useCurrencyFormat';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { CupertinoDateTimePicker } from '@/components/CupertinoDateTimePicker';
import type { MedicalItem } from '../../../shared/schema';
import { calculateMedicineDosage, formatDosageForBill, MEDICINE_RULES } from '../../../shared/medicineCalculations';

interface BillItem extends MedicalItem {
  quantity: number;
  billId?: string; // Optional for compatibility with Laboratory functions
}

const Inpatient = () => {
  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${displayHours}:${minutes} ${ampm}`
    };
  };

  const currentDateTime = getCurrentDateTime();

  // Patient information state
  const [patientName, setPatientName] = useState<string>('');
  const [opdNumber, setOpdNumber] = useState<string>('');
  const [hospitalNumber, setHospitalNumber] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [admissionDate, setAdmissionDate] = useState<string>(currentDateTime.date);
  const [dischargeDate, setDischargeDate] = useState<string>(currentDateTime.date);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [daysAdmitted, setDaysAdmitted] = useState<number>(1);
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const [duplicateDialog, setDuplicateDialog] = useState<{open: boolean, item: MedicalItem | null}>({open: false, item: null});
  
  // Laboratory search and dropdown state - identical to Outpatient
  const [selectedLabItems, setSelectedLabItems] = useState<MedicalItem[]>([]);
  const [dropdownSelectedItems, setDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [dropdownValue, setDropdownValue] = useState<string>('');
  const [highlightedDropdownIndex, setHighlightedDropdownIndex] = useState<number>(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownFilterQuery, setDropdownFilterQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Inpatient Medicine dosage selection state
  const [selectedMedicineForDosage, setSelectedMedicineForDosage] = useState<any>(null);
  const [showMedicineDosageSelection, setShowMedicineDosageSelection] = useState(false);
  
  // Cupertino Date picker modal state
  const [showCupertinoDatePicker, setShowCupertinoDatePicker] = useState(false);
  const [cupertinoDatePickerType, setCupertinoDatePickerType] = useState<'admission' | 'discharge'>('admission');
  
  // Time state
  const [admissionTime, setAdmissionTime] = useState<string>(currentDateTime.time);
  const [dischargeTime, setDischargeTime] = useState<string>(currentDateTime.time);
  const [dosePrescribed, setDosePrescribed] = useState('');
  const [medType, setMedType] = useState('');
  const [doseFrequency, setDoseFrequency] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [isDischargeMedicine, setIsDischargeMedicine] = useState(false);
  
  const { format } = useTakaFormat();

  // Convert DD/MM/YY format to ISO date string (YYYY-MM-DD) for date input
  const convertToISODate = (dateStr: string): string => {
    const parsedDate = parseCustomDate(dateStr);
    if (!parsedDate) return '';
    
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Convert ISO date string to DD/MM/YY format
  const convertFromISODate = (isoDate: string): string => {
    if (!isoDate) return '';
    
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  };

  // Parse DD/MM/YY format into components
  const parseDateComponents = (dateStr: string): { day: number; month: number; year: number } => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return {
        day: parseInt(parts[0], 10) || 1,
        month: parseInt(parts[1], 10) || 1,
        year: parseInt(parts[2], 10) || 25
      };
    }
    return { day: 1, month: 1, year: 25 };
  };

  // Format date components back to DD/MM/YY
  const formatDateComponents = (day: number, month: number, year: number): string => {
    const paddedDay = String(day).padStart(2, '0');
    const paddedMonth = String(month).padStart(2, '0');
    const paddedYear = String(year).padStart(2, '0');
    return `${paddedDay}/${paddedMonth}/${paddedYear}`;
  };

  // Adjust date component with validation
  const adjustDateComponent = (dateStr: string, component: 'day' | 'month' | 'year', delta: number): string => {
    const { day, month, year } = parseDateComponents(dateStr);
    
    let newDay = day;
    let newMonth = month;
    let newYear = year;
    
    if (component === 'day') {
      newDay = Math.max(1, Math.min(31, day + delta));
    } else if (component === 'month') {
      newMonth = Math.max(1, Math.min(12, month + delta));
    } else if (component === 'year') {
      newYear = Math.max(0, Math.min(99, year + delta));
    }
    
    // Validate day for the month
    const daysInMonth = new Date(2000 + newYear, newMonth, 0).getDate();
    if (newDay > daysInMonth) {
      newDay = daysInMonth;
    }
    
    return formatDateComponents(newDay, newMonth, newYear);
  };

  // Month names for the picker
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Generate day and year options
  const getDayOptions = () => Array.from({ length: 31 }, (_, i) => i + 1);
  const getYearOptions = () => Array.from({ length: 100 }, (_, i) => i);
  
  // Generate time options
  const getHourOptions = () => Array.from({ length: 12 }, (_, i) => i + 1);
  const getMinuteOptions = () => Array.from({ length: 60 }, (_, i) => i);
  const getAmPmOptions = () => ['AM', 'PM'];
  
  // Parse time string (12:00 PM)
  const parseTime = (timeStr: string): { hour: number; minute: number; ampm: string } => {
    const [time, ampm] = timeStr.split(' ');
    const [hour, minute] = time.split(':').map(num => parseInt(num, 10));
    return { hour, minute, ampm };
  };
  
  // Format time components back to string
  const formatTime = (hour: number, minute: number, ampm: string): string => {
    const paddedMinute = String(minute).padStart(2, '0');
    return `${hour}:${paddedMinute} ${ampm}`;
  };

  // Set specific date component
  const setDateComponent = (dateStr: string, component: 'day' | 'month' | 'year', value: number): string => {
    const { day, month, year } = parseDateComponents(dateStr);
    
    let newDay = day;
    let newMonth = month;
    let newYear = year;
    
    if (component === 'day') {
      newDay = value;
    } else if (component === 'month') {
      newMonth = value;
    } else if (component === 'year') {
      newYear = value;
    }
    
    // Validate day for the month
    const daysInMonth = new Date(2000 + newYear, newMonth, 0).getDate();
    if (newDay > daysInMonth) {
      newDay = daysInMonth;
    }
    
    return formatDateComponents(newDay, newMonth, newYear);
  };

  // Parse DD/MM/YY format to Date object
  const parseCustomDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Handle DD/MM/YY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
      let year = parseInt(parts[2], 10);
      
      // Convert YY to full year (assuming 20XX for years 00-99)
      if (year < 100) {
        year += 2000;
      }
      
      const date = new Date(year, month, day);
      
      // Check if the date is valid
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    
    return null;
  };

  // Calculate total admitted days based on admission and discharge dates
  const calculateAdmittedDays = (admission: string, discharge: string): number => {
    if (!admission || !discharge) return 1;
    
    const admissionDate = parseCustomDate(admission);
    const dischargeDate = parseCustomDate(discharge);
    
    if (!admissionDate || !dischargeDate || dischargeDate < admissionDate) return 1;
    
    const timeDiff = dischargeDate.getTime() - admissionDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both admission and discharge days
    
    return daysDiff > 0 ? daysDiff : 1;
  };

  // Convert DD/MM/YY string and time string to Date object
  const convertToDate = (dateStr: string, timeStr: string): Date => {
    const parsedDate = parseCustomDate(dateStr);
    const parsedTime = parseTime(timeStr);
    
    if (!parsedDate) return new Date();
    
    const hour24 = parsedTime.ampm === 'PM' && parsedTime.hour !== 12 ? parsedTime.hour + 12 :
                   parsedTime.ampm === 'AM' && parsedTime.hour === 12 ? 0 : parsedTime.hour;
    
    parsedDate.setHours(hour24, parsedTime.minute, 0, 0);
    return parsedDate;
  };

  // Convert Date object back to DD/MM/YY and time string
  const convertFromDate = (date: Date): { dateStr: string; timeStr: string } => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    const hours12 = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    return {
      dateStr: `${day}/${month}/${year}`,
      timeStr: `${hours12}:${minutes} ${ampm}`
    };
  };

  // Handle Cupertino date picker confirmation
  const handleCupertinoDateConfirm = (selectedDate: Date) => {
    const { dateStr, timeStr } = convertFromDate(selectedDate);
    
    if (cupertinoDatePickerType === 'admission') {
      setAdmissionDate(dateStr);
      setAdmissionTime(timeStr);
    } else {
      setDischargeDate(dateStr);
      setDischargeTime(timeStr);
    }
  };



  // Update days admitted when dates change
  useEffect(() => {
    if (admissionDate && dischargeDate) {
      const calculatedDays = calculateAdmittedDays(admissionDate, dischargeDate);
      setDaysAdmitted(calculatedDays);
    }
  }, [admissionDate, dischargeDate]);

  // Get inpatient medical items
  const { data: medicalItems = [] } = useQuery<MedicalItem[]>({
    queryKey: ['/api/medical-items', { isOutpatient: false }],
  });

  // Get unique categories
  const categories = Array.from(new Set(medicalItems.map((item: MedicalItem) => item.category))).sort();

  // Filter items by category
  const categoryItems = selectedCategory 
    ? medicalItems.filter((item: MedicalItem) => item.category === selectedCategory)
    : [];

  // Filter category items by search
  const filteredCategoryItems = categorySearchQuery
    ? categoryItems.filter((item: MedicalItem) => 
        item.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
      )
    : categoryItems;

  // Global search results
  const globalSearchResults = globalSearchQuery
    ? medicalItems.filter((item: MedicalItem) =>
        item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(globalSearchQuery.toLowerCase())
      )
    : [];

  // Save bill mutation
  const saveBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inpatient',
          sessionId: 'browser-session',
          billData: JSON.stringify(billData),
          total: calculateTotal().toString(),
          daysAdmitted,
          currency: 'BDT',
          patientInfo: {
            patientName,
            opdNumber,
            hospitalNumber,
            billNumber,
            admissionDate,
            dischargeDate,
            admissionTime,
            dischargeTime,
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to save bill');
      return response.json();
    },
  });

  // Load saved bill on mount
  useEffect(() => {
    const loadSavedBill = async () => {
      try {
        const response = await fetch('/api/bills?sessionId=browser-session&type=inpatient');
        if (response.ok) {
          const bill = await response.json();
          if (bill && bill.billData) {
            setBillItems(JSON.parse(bill.billData));
            setDaysAdmitted(bill.daysAdmitted || 1);
            
            // Load patient information if available
            if (bill.patientInfo) {
              setPatientName(bill.patientInfo.patientName || '');
              setOpdNumber(bill.patientInfo.opdNumber || '');
              setHospitalNumber(bill.patientInfo.hospitalNumber || '');
              setBillNumber(bill.patientInfo.billNumber || '');
              setAdmissionDate(bill.patientInfo.admissionDate || '');
              setDischargeDate(bill.patientInfo.dischargeDate || '');
              setAdmissionTime(bill.patientInfo.admissionTime || '12:00 PM');
              setDischargeTime(bill.patientInfo.dischargeTime || '12:00 PM');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load saved bill:', error);
      }
    };
    loadSavedBill();
  }, []);

  // Auto-save bill when items or patient info change
  useEffect(() => {
    if (billItems.length > 0 || daysAdmitted > 1 || patientName || opdNumber || hospitalNumber || billNumber || admissionDate || dischargeDate || admissionTime !== '12:00 PM' || dischargeTime !== '12:00 PM') {
      saveBillMutation.mutate(billItems);
    }
  }, [billItems, daysAdmitted, patientName, opdNumber, hospitalNumber, billNumber, admissionDate, dischargeDate, admissionTime, dischargeTime]);

  const addToBill = (item: MedicalItem, quantity: number = 1) => {
    const existingItem = billItems.find(billItem => billItem.id === item.id);
    
    if (existingItem) {
      // Show duplicate confirmation dialog
      setDuplicateDialog({ open: true, item });
    } else {
      setBillItems([...billItems, { ...item, quantity }]);
    }
  };

  // Handle duplicate dialog actions
  const handleDuplicateAction = (action: 'add' | 'skip' | 'remove') => {
    const item = duplicateDialog.item;
    if (!item) return;

    switch (action) {
      case 'add':
        // Add the item again (allow duplicate)
        setBillItems([...billItems, { ...item, quantity: 1 }]);
        break;
      case 'skip':
        // Do nothing, just close dialog
        break;
      case 'remove':
        // Remove existing item from bill
        setBillItems(billItems.filter(billItem => billItem.id !== item.id));
        break;
    }
    
    setDuplicateDialog({ open: false, item: null });
  };

  // Removed updateQuantity function - no longer needed without quantity controls

  const removeFromBill = (id: number) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const itemsTotal = billItems.reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const itemTotal = price * item.quantity;
      // Apply daily rate for items that need it (like room charges, food, etc.)
      const isDailyItem = item.category.includes('Food') || 
                         item.category.includes('Seat') || 
                         item.category.includes('O2') ||
                         item.name.toLowerCase().includes('per day');
      return total + (isDailyItem ? itemTotal * daysAdmitted : itemTotal);
    }, 0);
    
    return itemsTotal;
  };

  // Group bill items by category for categorized display
  const getBillItemsByCategory = () => {
    const grouped = billItems.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, BillItem[]>);

    return grouped;
  };

  // Calculate category total
  const calculateCategoryTotal = (items: BillItem[]) => {
    return items.reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const itemTotal = price * item.quantity;
      // Apply daily rate for items that need it (like room charges, food, etc.)
      const isDailyItem = item.category.includes('Food') || 
                         item.category.includes('Seat') || 
                         item.category.includes('O2') ||
                         item.name.toLowerCase().includes('per day');
      return total + (isDailyItem ? itemTotal * daysAdmitted : itemTotal);
    }, 0);
  };

  const clearBill = () => {
    setBillItems([]);
    setDaysAdmitted(1);
  };

  // Inpatient Medicine dosage calculation functions
  const medTypeOptions = Object.keys(MEDICINE_RULES);

  const doseFrequencyOptions = [
    { value: 'QD', label: 'QD (Once daily)' },
    { value: 'BID', label: 'BID (Twice daily)' },
    { value: 'TID', label: 'TID (Three times daily)' },
    { value: 'QID', label: 'QID (Four times daily)' },
    { value: 'QOD', label: 'QOD (Every other day)' },
    { value: 'QWEEK', label: 'QWEEK (Weekly)' }
  ];

  const isDosageSelectionComplete = () => {
    return dosePrescribed.trim() && medType && doseFrequency && totalDays.trim() && parseInt(totalDays) > 0;
  };

  const calculateInpatientMedicineDosage = () => {
    if (!selectedMedicineForDosage || !isDosageSelectionComplete()) return { totalQuantity: 0, totalPrice: 0, calculationDetails: '' };

    try {
      const result = calculateMedicineDosage({
        dosePrescribed,
        medType,
        doseFrequency,
        totalDays: parseInt(totalDays),
        basePrice: parseFloat(selectedMedicineForDosage.price),
        isInpatient: true, // Inpatient logic
        isDischargeMedicine: isDischargeMedicine
      });

      return {
        totalQuantity: result.totalQuantity,
        totalPrice: result.totalPrice,
        calculationDetails: result.calculationDetails,
        quantityUnit: result.quantityUnit
      };
    } catch (error) {
      console.error('Medicine calculation error:', error);
      return { totalQuantity: 0, totalPrice: 0, calculationDetails: 'Calculation error', quantityUnit: '' };
    }
  };

  const handleMedicineItemSelect = (item: MedicalItem) => {
    setSelectedMedicineForDosage(item);
    setShowMedicineDosageSelection(true);
    // Reset dosage fields when selecting new medicine
    setDosePrescribed('');
    setMedType('');
    setDoseFrequency('');
    setTotalDays('');
    setIsDischargeMedicine(false);
  };

  const addMedicineToBill = () => {
    if (!selectedMedicineForDosage || !isDosageSelectionComplete()) return;

    const calculationResult = calculateInpatientMedicineDosage();
    
    if (calculationResult.totalQuantity === 0) {
      console.error('Failed to calculate medicine dosage');
      return;
    }

    // Use the shared formatting function
    const medicineTypeLabel = isDischargeMedicine ? 'Discharge Medicine' : 'Ward Medicine';
    const formattedName = `${formatDosageForBill(
      selectedMedicineForDosage.name,
      dosePrescribed,
      medType,
      doseFrequency,
      parseInt(totalDays),
      {
        totalQuantity: calculationResult.totalQuantity,
        totalPrice: calculationResult.totalPrice,
        quantityUnit: calculationResult.quantityUnit || medType,
        pricePerUnit: parseFloat(selectedMedicineForDosage.price),
        isPartialAllowed: false,
        calculationDetails: calculationResult.calculationDetails
      }
    )} - ${medicineTypeLabel}`;
    
    // Create medicine item with dosage information
    const medicineItem = {
      ...selectedMedicineForDosage,
      name: formattedName,
      price: calculationResult.totalPrice.toString(),
      quantity: 1 // For inpatient, we use quantity 1 and include total in price
    };

    // Add to bill
    setBillItems(prev => [...prev, medicineItem]);

    // Reset medicine dosage selection
    setSelectedMedicineForDosage(null);
    setShowMedicineDosageSelection(false);
    setDosePrescribed('');
    setMedType('');
    setDoseFrequency('');
    setTotalDays('');
    setIsDischargeMedicine(false);
  };

  const cancelMedicineDosageSelection = () => {
    setSelectedMedicineForDosage(null);
    setShowMedicineDosageSelection(false);
    setDosePrescribed('');
    setMedType('');
    setDoseFrequency('');
    setTotalDays('');
    setIsDischargeMedicine(false);
  };

  // Laboratory functions - identical to Outpatient
  const getSearchItems = () => {
    return categoryItems; // Use all items for search
  };

  const getDropdownItems = () => {
    return categoryItems; // Use all items for dropdown
  };

  const searchItems = getSearchItems();
  const dropdownItems = getDropdownItems();

  // Get sorted Laboratory suggestions with closest match first
  const getLabSuggestions = () => {
    if (!categorySearchQuery) return [];
    
    const query = categorySearchQuery.toLowerCase();
    const suggestions = filteredCategoryItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
    
    // Sort by relevance: exact matches first, then starts with, then contains
    return suggestions.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match gets highest priority
      if (aName === query) return -1;
      if (bName === query) return 1;
      
      // Starts with query gets second priority
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
      
      // Both start with or both contain - sort alphabetically
      return aName.localeCompare(bName);
    });
  };

  // Handle comma-separated Laboratory item selection
  const handleLabSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const query = categorySearchQuery.trim();
      if (query) {
        // Get the top suggestion (closest match)
        const suggestions = getLabSuggestions();
        if (suggestions.length > 0) {
          const topMatch = suggestions[0];
          // Check if item is already selected in search OR already in the bill
          const alreadyInSearch = selectedLabItems.find(selected => selected.id === topMatch.id);
          const alreadyInBill = billItems.find(billItem => billItem.id === topMatch.id);
          
          if (!alreadyInSearch && !alreadyInBill) {
            setSelectedLabItems(prev => [...prev, topMatch]);
            // Clear dropdown selections when switching to search
            setDropdownSelectedItems([]);
          }
          // If item is already selected or in bill, we ignore the selection
        }
        setCategorySearchQuery('');
        // Refocus search input for continuous typing
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 0);
      }
    }
  };

  // Remove Laboratory item from selection
  const removeLabItem = (itemId: number) => {
    setSelectedLabItems(prev => prev.filter(item => item.id !== itemId));
    // Refocus search input after removing item
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  // Add all selected Laboratory items to bill
  const addSelectedLabItemsToBill = () => {
    const newItems: MedicalItem[] = [];
    const duplicateItems: MedicalItem[] = [];
    
    selectedLabItems.forEach(item => {
      const existingItem = billItems.find(billItem => billItem.id === item.id);
      if (existingItem) {
        duplicateItems.push(item);
      } else {
        newItems.push(item);
      }
    });
    
    // Add new items immediately
    if (newItems.length > 0) {
      const billItemsToAdd = newItems.map(item => ({ 
        ...item, 
        quantity: 1,
        billId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      }));
      setBillItems(prevBillItems => [...prevBillItems, ...billItemsToAdd]);
    }
    
    // Handle duplicates - for now, skip them and show a message
    if (duplicateItems.length > 0) {
      // Show duplicate dialog for the first duplicate item
      setDuplicateDialog({ open: true, item: duplicateItems[0] });
    }
    
    setSelectedLabItems([]);
    setCategorySearchQuery('');
    
    // Refocus search input after adding items
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  // Laboratory dropdown functionality
  const handleDropdownSelect = (value: string) => {
    const selectedItem = categoryItems.find(item => item.id.toString() === value);
    
    // Check if item is already selected in dropdown OR already in the bill
    const alreadyInDropdown = dropdownSelectedItems.find(item => item.id === selectedItem?.id);
    const alreadyInBill = billItems.find(billItem => billItem.id === selectedItem?.id);
    
    if (selectedItem && !alreadyInDropdown && !alreadyInBill) {
      setDropdownSelectedItems(prev => [...prev, selectedItem]);
      // Clear search selections when using dropdown
      setSelectedLabItems([]);
      setCategorySearchQuery('');
    }
    // If item is already selected, we just ignore the selection (no error message needed)
    
    setDropdownValue(''); // Reset dropdown after selection
    setHighlightedDropdownIndex(-1); // Reset highlighted index
    setDropdownFilterQuery(''); // Reset filter text for fresh start
    
    // Refocus the dropdown button to continue keyboard input
    setTimeout(() => {
      if (dropdownButtonRef.current) {
        dropdownButtonRef.current.focus();
      }
    }, 0);
    // Keep dropdown open for multiple selections
  };

  // Handle keyboard navigation for Laboratory dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    const orderedItems = getFilteredDropdownItems();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedDropdownIndex(prev => 
        prev < orderedItems.length - 1 ? prev + 1 : 0
      );
      if (!isDropdownOpen) setIsDropdownOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedDropdownIndex(prev => 
        prev > 0 ? prev - 1 : orderedItems.length - 1
      );
      if (!isDropdownOpen) setIsDropdownOpen(true);
    } else if (e.key === 'Enter' && highlightedDropdownIndex >= 0) {
      e.preventDefault();
      const selectedItem = orderedItems[highlightedDropdownIndex];
      if (selectedItem) {
        handleDropdownSelect(selectedItem.id.toString());
        // Dropdown stays open and focused for more selections
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
      setHighlightedDropdownIndex(-1);
      setDropdownFilterQuery('');
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\s]/)) {
      // Handle typing to filter dropdown items
      e.preventDefault();
      const newQuery = dropdownFilterQuery + e.key.toLowerCase();
      setDropdownFilterQuery(newQuery);
      setHighlightedDropdownIndex(0); // Highlight first filtered result
      if (!isDropdownOpen) setIsDropdownOpen(true);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setDropdownFilterQuery(prev => prev.slice(0, -1));
      setHighlightedDropdownIndex(0);
    }
  };

  // Remove item from Laboratory dropdown selection
  const removeDropdownItem = (itemId: number) => {
    setDropdownSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Add all Laboratory dropdown selected items to bill
  const addDropdownSelectedItemsToBill = () => {
    const newItems: MedicalItem[] = [];
    const duplicateItems: MedicalItem[] = [];
    
    dropdownSelectedItems.forEach(item => {
      const existingItem = billItems.find(billItem => billItem.id === item.id);
      if (existingItem) {
        duplicateItems.push(item);
      } else {
        newItems.push(item);
      }
    });
    
    // Add new items immediately
    if (newItems.length > 0) {
      const billItemsToAdd = newItems.map(item => ({ 
        ...item, 
        quantity: 1,
        billId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      }));
      setBillItems(prevBillItems => [...prevBillItems, ...billItemsToAdd]);
    }
    
    // Handle duplicates - for now, skip them and show a message
    if (duplicateItems.length > 0) {
      // Show duplicate dialog for the first duplicate item
      setDuplicateDialog({ open: true, item: duplicateItems[0] });
    }
    
    setDropdownSelectedItems([]);
    // Close dropdown when adding to bill
    setIsDropdownOpen(false);
    setHighlightedDropdownIndex(-1);
    setDropdownFilterQuery('');
  };

  // Get dropdown items sorted by relevance when user is typing in search
  const getOrderedDropdownItems = () => {
    if (!categorySearchQuery.trim()) return categoryItems;
    
    const query = categorySearchQuery.toLowerCase();
    
    // Sort items by relevance to the search query
    return [...categoryItems].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aIncludes = aName.includes(query);
      const bIncludes = bName.includes(query);
      
      // Items matching the search query come first
      if (aIncludes && !bIncludes) return -1;
      if (bIncludes && !aIncludes) return 1;
      
      // Among matching items, sort by relevance
      if (aIncludes && bIncludes) {
        // Exact match gets highest priority
        if (aName === query) return -1;
        if (bName === query) return 1;
        
        // Starts with query gets second priority
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
      }
      
      // Default alphabetical sort
      return aName.localeCompare(bName);
    });
  };

  // Get dropdown items filtered by direct typing in dropdown
  const getFilteredDropdownItems = () => {
    if (!dropdownFilterQuery.trim()) return getOrderedDropdownItems();
    
    const query = dropdownFilterQuery.toLowerCase();
    
    // Filter and sort by relevance
    return categoryItems
      .filter(item => item.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match gets highest priority
        if (aName === query) return -1;
        if (bName === query) return 1;
        
        // Starts with gets second priority
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
        
        // Contains gets third priority - already filtered above
        return aName.localeCompare(bName);
      });
  };

  // Auto-focus search input when Laboratory category is selected
  useEffect(() => {
    if (selectedCategory === 'Laboratory' && isCarouselMode && searchInputRef.current) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [selectedCategory, isCarouselMode]);

  // Click outside to close Laboratory dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHighlightedDropdownIndex(-1);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Inpatient category order - outpatient categories first, then inpatient-specific
  const categoryOrder = [
    'Laboratory', 'X-Ray', 'Registration Fees', 'Dr. Fees', 
    'Medic Fee', 'Medicine', 'Physical Therapy', 'Limb and Brace',
    'Seat & Ad. Fee', 'Blood', 'Food', 'Halo, O2, NO2, etc.', 
    'Surgery, O.R. & Delivery', 'Discharge Medicine', 'Medicine, ORS & Anesthesia, Ket, Spinal',
    'IV.\'s', 'Plaster/Milk', 'Procedures', 'Lost Laundry', 'Travel', 'Other'
  ];

  const orderedCategories = categoryOrder.filter(cat => categories.includes(cat))
    .concat(categories.filter(cat => !categoryOrder.includes(cat)));

  // Carousel navigation functions
  const handleCategoryClick = (category: string) => {
    if (isCarouselMode && category === selectedCategory) {
      // If already in carousel mode and same category clicked, exit carousel
      setIsCarouselMode(false);
      setSelectedCategory('');
    } else {
      setSelectedCategory(category);
      setIsCarouselMode(true);
      setCurrentCategoryIndex(orderedCategories.indexOf(category));
      setCategorySearchQuery(''); // Reset search when switching categories
    }
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentCategoryIndex - 1 + orderedCategories.length) % orderedCategories.length
      : (currentCategoryIndex + 1) % orderedCategories.length;
    
    setCurrentCategoryIndex(newIndex);
    setSelectedCategory(orderedCategories[newIndex]);
    setCategorySearchQuery(''); // Reset search when switching categories
  };

  // Swipe gesture support for carousel navigation
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (isCarouselMode) {
        navigateCarousel('next');
      }
    },
    onSwipeRight: () => {
      if (isCarouselMode) {
        navigateCarousel('prev');
      }
    },
    threshold: 75, // Minimum swipe distance
    preventDefaultEvents: false
  });

  const exitCarousel = () => {
    setIsCarouselMode(false);
    setSelectedCategory('');
    setCategorySearchQuery('');
    setGlobalSearchQuery(''); // Clear global search when exiting carousel
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Inpatient Calculator</h1>
          <p className="text-muted-foreground">Calculate bills for inpatient services with daily rates and extended stay management</p>
        </div>

        {/* Patient Information Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center text-medical-primary">
              <Calendar className="mr-2 h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName" className="text-foreground font-medium">Patient Name</Label>
                <Input
                  id="patientName"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="opdNumber" className="text-foreground font-medium">OPD Number</Label>
                <Input
                  id="opdNumber"
                  type="text"
                  value={opdNumber}
                  onChange={(e) => setOpdNumber(e.target.value)}
                  placeholder="Enter OPD number"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hospitalNumber" className="text-foreground font-medium">Hospital Number</Label>
                <Input
                  id="hospitalNumber"
                  type="text"
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  placeholder="Enter hospital number"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billNumber" className="text-foreground font-medium">Bill Number</Label>
                <Input
                  id="billNumber"
                  type="text"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="Enter bill number"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admissionDate" className="text-foreground font-medium">Admission Date</Label>
                <Button
                  variant="outline"
                  className="w-full p-4 h-auto text-left justify-start"
                  onClick={() => {
                    setCupertinoDatePickerType('admission');
                    setShowCupertinoDatePicker(true);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{admissionDate} at {admissionTime}</span>

                  </div>
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dischargeDate" className="text-foreground font-medium">Discharge Date</Label>
                <Button
                  variant="outline"
                  className="w-full p-4 h-auto text-left justify-start"
                  onClick={() => {
                    setCupertinoDatePickerType('discharge');
                    setShowCupertinoDatePicker(true);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{dischargeDate} at {dischargeTime}</span>

                  </div>
                </Button>
              </div>
            </div>
            
            {/* Total Admitted Days Counter */}
            {admissionDate && dischargeDate && parseCustomDate(admissionDate) && parseCustomDate(dischargeDate) && (
              <div className="mt-4 p-3 bg-medical-muted/20 rounded-lg border border-medical-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total Admitted Days:</span>
                  <span className="text-lg font-bold text-medical-primary">{daysAdmitted} {daysAdmitted === 1 ? 'day' : 'days'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated from {admissionDate} to {dischargeDate}
                </p>
              </div>
            )}
            
            {/* Date Format Help */}
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Click the date & time buttons to select admission and discharge dates with specific times.</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Categories and Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Days Admitted Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center text-medical-primary">
                  <Calendar className="mr-2 h-5 w-5" />
                  Patient Admission Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="days" className="text-foreground font-medium">Days Admitted:</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="medical-outline"
                      onClick={() => setDaysAdmitted(Math.max(1, daysAdmitted - 1))}
                      disabled={daysAdmitted <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      value={daysAdmitted}
                      onChange={(e) => setDaysAdmitted(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-semibold"
                    />
                    <Button
                      size="sm"
                      variant="medical-outline"
                      onClick={() => setDaysAdmitted(daysAdmitted + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground">
                    {daysAdmitted === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Daily items (room charges, food, oxygen) will be multiplied by the number of days.
                </p>
              </CardContent>
            </Card>

            {/* Global Search - Hidden in carousel mode */}
            {!isCarouselMode && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-medical-primary">
                    <Search className="mr-2 h-5 w-5" />
                    Search All Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search for medical items..."
                    value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full"
                />
                {globalSearchResults.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {globalSearchResults.map((item: MedicalItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.category}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-medical-primary">
                            {format(item.price)}
                          </span>
                          <Button size="sm" onClick={() => item.category === 'Medicine' ? handleMedicineItemSelect(item) : addToBill(item)} variant="medical">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              </Card>
            )}

            {/* Category Buttons */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-medical-primary">
                  <span className="flex items-center">
                    <Grid3X3 className="mr-2 h-5 w-5" />
                    Inpatient Categories
                  </span>
                  {isCarouselMode && (
                    <Button 
                      size="sm" 
                      variant="medical-ghost" 
                      onClick={exitCarousel}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isCarouselMode ? (
                  // Normal grid mode
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {orderedCategories.map((category) => {
                      const itemCount = medicalItems.filter((item: MedicalItem) => item.category === category).length;
                      return (
                        <Button
                          key={category}
                          variant="medical-outline"
                          className="h-auto p-2 sm:p-3 text-left justify-start min-h-[60px]"
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div className="w-full">
                            <div className="font-semibold text-xs sm:text-sm truncate leading-tight">{category}</div>
                            <div className="text-xs opacity-75 mt-1">{itemCount} items</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  // Carousel mode with preview buttons - mobile-optimized layout
                  <div 
                    ref={swipeRef}
                    className="w-full px-2 sm:px-0 relative touch-pan-y user-select-none"
                    style={{ touchAction: 'pan-y' }}
                  >
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2 max-w-full overflow-hidden">
                      {/* Previous preview button - hidden on very small screens */}
                      <Button
                        variant="medical-ghost"
                        className="h-auto p-1 sm:p-1.5 text-left flex-shrink-0 opacity-60 hover:opacity-80 w-12 sm:w-16 justify-start hidden xs:flex"
                        onClick={() => navigateCarousel('prev')}
                      >
                        <div className="w-full overflow-hidden">
                          <div className="text-xs truncate text-left leading-tight">
                            {orderedCategories[(currentCategoryIndex - 1 + orderedCategories.length) % orderedCategories.length]}
                          </div>
                        </div>
                      </Button>

                      {/* Previous arrow */}
                      <Button
                        variant="medical-outline"
                        size="sm"
                        onClick={() => navigateCarousel('prev')}
                        className="h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
                      >
                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      {/* Current selected category - centered and responsive */}
                      <Button
                        variant="medical"
                        className="h-auto p-2 sm:p-3 text-center flex-1 min-w-0 max-w-[160px] sm:max-w-[200px]"
                        onClick={() => handleCategoryClick(selectedCategory)}
                      >
                        <div className="w-full min-w-0">
                          <div className="font-semibold text-xs sm:text-sm truncate leading-tight">{selectedCategory}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {medicalItems.filter((item: MedicalItem) => item.category === selectedCategory).length} items
                          </div>
                        </div>
                      </Button>
                      
                      {/* Next arrow */}
                      <Button
                        variant="medical-outline"
                        size="sm"
                        onClick={() => navigateCarousel('next')}
                        className="h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
                      >
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>

                      {/* Next preview button - hidden on very small screens */}
                      <Button
                        variant="medical-ghost"
                        className="h-auto p-1 sm:p-1.5 text-right flex-shrink-0 opacity-60 hover:opacity-80 w-12 sm:w-16 justify-end hidden xs:flex"
                        onClick={() => navigateCarousel('next')}
                      >
                        <div className="w-full overflow-hidden">
                          <div className="text-xs truncate text-right leading-tight">
                            {orderedCategories[(currentCategoryIndex + 1) % orderedCategories.length]}
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Items */}
            {selectedCategory && isCarouselMode && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-medical-primary">{selectedCategory}</CardTitle>
                  {/* Search input with Laboratory-specific functionality */}
                  {selectedCategory === 'Laboratory' ? (
                    <Input
                      ref={searchInputRef}
                      placeholder="Type lab test name and press comma or enter to add..."
                      value={categorySearchQuery}
                      onChange={(e) => {
                        setCategorySearchQuery(e.target.value);
                        // Clear dropdown selections when switching to search
                        if (e.target.value.trim()) {
                          setDropdownSelectedItems([]);
                        }
                      }}
                      onKeyDown={handleLabSearchKeyDown}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      placeholder={`Search in ${selectedCategory}...`}
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="w-full"
                    />
                  )}
                </CardHeader>
                <CardContent>
                  {/* Show Laboratory interface */}
                  {selectedCategory === 'Laboratory' ? (
                    <div className="space-y-4">
                      {/* Selected items, price counter and Add to Bill button above search */}
                      {selectedLabItems.length > 0 && (
                        <div className="space-y-2">
                          {/* Selected items tags */}
                          <div className="flex flex-wrap gap-1 p-2 bg-muted/20 rounded-md">
                            {selectedLabItems.map((item) => (
                              <div key={item.id} className="inline-flex items-center bg-medical-primary/10 text-medical-primary px-2 py-1 rounded text-xs">
                                <span className="mr-1">{item.name}</span>
                                <button
                                  onClick={() => removeLabItem(item.id)}
                                  className="hover:bg-medical-primary/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Price counter on left, Add to Bill button on right */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 p-2 bg-medical-primary/5 rounded-md border border-medical-primary/20">
                              <span className="text-sm font-medium text-medical-primary">
                                Total Price: {format(selectedLabItems.reduce((sum, item) => sum + parseFloat(item.price), 0))}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {selectedLabItems.length} item{selectedLabItems.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <Button 
                              onClick={addSelectedLabItemsToBill} 
                              variant="outline"
                              className="border-medical-primary/20 text-medical-primary hover:bg-medical-primary/10"
                            >
                              Add {selectedLabItems.length} Test{selectedLabItems.length !== 1 ? 's' : ''} to Bill
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">                        
                        {/* Search suggestions appear right below search input */}
                        {categorySearchQuery && getLabSuggestions().length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2 bg-muted/10">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Matching tests (press comma to add):
                            </div>
                            {getLabSuggestions().slice(0, 5).map((item: MedicalItem, index) => {
                              const alreadyInSearch = selectedLabItems.find(selected => selected.id === item.id);
                              const alreadyInBill = billItems.find(billItem => billItem.id === item.id);
                              
                              return (
                              <div key={item.id} className={`text-xs p-2 rounded ${
                                alreadyInBill 
                                  ? 'bg-red-100 text-red-600 cursor-not-allowed border border-red-200'
                                  : alreadyInSearch
                                    ? 'bg-green-100 text-green-600 cursor-not-allowed border border-green-200'
                                    : index === 0 
                                      ? 'bg-medical-primary/10 border border-medical-primary/20 cursor-pointer hover:bg-muted/40' 
                                      : 'bg-muted/20 cursor-pointer hover:bg-muted/40'
                              }`}
                                   onClick={() => {
                                     // Check if item is already selected in search OR already in the bill
                                     const alreadyInSearch = selectedLabItems.find(selected => selected.id === item.id);
                                     const alreadyInBill = billItems.find(billItem => billItem.id === item.id);
                                     
                                     if (!alreadyInSearch && !alreadyInBill) {
                                       setSelectedLabItems(prev => [...prev, item]);
                                     }
                                     setCategorySearchQuery('');
                                     // Refocus search input after clicking suggestion
                                     setTimeout(() => {
                                       if (searchInputRef.current) {
                                         searchInputRef.current.focus();
                                       }
                                     }, 0);
                                   }}>
                                <span className="font-medium">{item.name}</span> - {format(item.price)}
                                {alreadyInBill && (
                                  <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                )}
                                {alreadyInSearch && !alreadyInBill && (
                                  <span className="ml-2 text-green-600 text-xs">✓ Selected</span>
                                )}
                                {index === 0 && !alreadyInBill && !alreadyInSearch && (
                                  <span className="ml-2 text-medical-primary text-xs">← Will be added</span>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Dropdown selected items as tags */}
                      {dropdownSelectedItems.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1 p-2 bg-muted/20 rounded-md">
                            {dropdownSelectedItems.map((item) => (
                              <div key={item.id} className="inline-flex items-center bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs">
                                <span className="mr-1">{item.name}</span>
                                <button
                                  onClick={() => removeDropdownItem(item.id)}
                                  className="hover:bg-blue-500/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {/* Price counter on left, Add to Bill button on right */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 p-2 bg-blue-500/5 rounded-md border border-blue-500/20">
                              <span className="text-sm font-medium text-blue-600">
                                Total Price: {format(dropdownSelectedItems.reduce((sum, item) => sum + parseFloat(item.price), 0))}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {dropdownSelectedItems.length} item{dropdownSelectedItems.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <Button 
                              onClick={addDropdownSelectedItemsToBill} 
                              variant="outline"
                              className="border-blue-500/20 text-blue-600 hover:bg-blue-500/10"
                            >
                              Add {dropdownSelectedItems.length} Test{dropdownSelectedItems.length !== 1 ? 's' : ''} to Bill
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Separate Dropdown Selection */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          Alternative: Select from dropdown
                        </div>
                        <div className="relative" ref={dropdownRef}>
                          <button
                            ref={dropdownButtonRef}
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(!isDropdownOpen);
                              setHighlightedDropdownIndex(-1);
                            }}
                            onKeyDown={handleDropdownKeyDown}
                            className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-md bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-medical-primary focus:ring-offset-2"
                          >
                            <span className="text-sm text-muted-foreground">
                              {dropdownFilterQuery ? `Filtering: "${dropdownFilterQuery}" (${getFilteredDropdownItems().length} matches)` : 'Select lab test from dropdown... (Type to filter)'}
                            </span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
                          </button>
                          
                          {isDropdownOpen && (
                            <div 
                              className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                            >
                              {getFilteredDropdownItems().map((item: MedicalItem, index) => (
                                <div
                                  key={item.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDropdownSelect(item.id.toString());
                                  }}
                                  className={`px-3 py-2 text-sm flex items-center justify-between ${
                                    index === highlightedDropdownIndex 
                                      ? 'bg-medical-primary/10 border-l-4 border-medical-primary' 
                                      : ''
                                  } ${
                                    dropdownSelectedItems.find(selected => selected.id === item.id)
                                      ? 'bg-blue-500/10 text-blue-600'
                                      : billItems.find(billItem => billItem.id === item.id)
                                        ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                        : 'cursor-pointer hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span>{item.name}</span>
                                    {dropdownSelectedItems.find(selected => selected.id === item.id) && (
                                      <span className="ml-2 text-blue-600 text-xs">✓ Selected</span>
                                    )}
                                    {billItems.find(billItem => billItem.id === item.id) && !dropdownSelectedItems.find(selected => selected.id === item.id) && (
                                      <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                    )}
                                    {index === highlightedDropdownIndex && (
                                      <span className="ml-2 text-medical-primary text-xs">← Highlighted</span>
                                    )}
                                  </div>
                                  <span className="text-medical-primary font-semibold">
                                    {format(item.price)}
                                  </span>
                                </div>
                              ))}
                              {getFilteredDropdownItems().length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No lab tests available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        • Type to search and press comma/enter to add as tags<br/>
                        • Dropdown: Type letters to filter instantly, stays open for multiple selections<br/>
                        • Arrow keys to navigate, Enter to select (filter resets after each selection)<br/>
                        • Click "Add to Bill" or outside dropdown to close • Escape to close without adding<br/>
                        • Both methods access same database but work independently<br/>
                        • <strong>Global Navigation:</strong> Use ← → arrow keys to switch categories, Escape to exit carousel
                      </div>
                    </div>
                  ) : (
                    /* Regular item list for other categories */
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredCategoryItems.length > 0 ? (
                        filteredCategoryItems.map((item: MedicalItem) => {
                          const isDailyItem = item.category.includes('Food') || 
                                             item.category.includes('Seat') || 
                                             item.category.includes('O2') ||
                                             item.name.toLowerCase().includes('per day');
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground">{item.description}</div>
                                )}
                                {isDailyItem && (
                                  <div className="text-xs text-medical-accent font-medium">Daily rate × {daysAdmitted} days</div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className="font-semibold text-medical-primary">
                                    {format(item.price)}
                                  </div>
                                  {isDailyItem && (
                                    <div className="text-xs text-muted-foreground">
                                      Total: {format(parseFloat(item.price.toString()) * daysAdmitted)}
                                    </div>
                                  )}
                                </div>
                                <Button size="sm" onClick={() => item.category === 'Medicine' ? handleMedicineItemSelect(item) : addToBill(item)} variant="medical">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          {categorySearchQuery ? 'No items found matching your search.' : 'No items in this category.'}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Medicine Dosage Selection Interface */}
            {showMedicineDosageSelection && selectedMedicineForDosage && (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-medical-primary">
                      Set Dosage for: {selectedMedicineForDosage.name}
                    </CardTitle>
                    <Button
                      onClick={cancelMedicineDosageSelection}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Dose Prescribed (Manual Entry) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Dose Prescribed</label>
                      <Input
                        placeholder="Enter dose amount (e.g., 500, 1, 2.5)"
                        value={dosePrescribed}
                        onChange={(e) => setDosePrescribed(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Med Type Dropdown */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Med Type</label>
                      <Select value={medType} onValueChange={setMedType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select medication type" />
                        </SelectTrigger>
                        <SelectContent>
                          {medTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dose Frequency Dropdown */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Dose Frequency</label>
                      <Select value={doseFrequency} onValueChange={setDoseFrequency}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select dosing frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {doseFrequencyOptions.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Total Days */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Total Days</label>
                      <Input
                        type="number"
                        placeholder="Enter number of days"
                        value={totalDays}
                        onChange={(e) => setTotalDays(e.target.value)}
                        className="w-full"
                        min="1"
                      />
                    </div>

                    {/* Inpatient Medicine Type Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Medicine Type</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="medicineType"
                            checked={!isDischargeMedicine}
                            onChange={() => setIsDischargeMedicine(false)}
                            className="text-medical-primary"
                          />
                          <span className="text-sm">Ward Medicine (can be partial)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="medicineType"
                            checked={isDischargeMedicine}
                            onChange={() => setIsDischargeMedicine(true)}
                            className="text-medical-primary"
                          />
                          <span className="text-sm">Discharge Medicine (full bottles)</span>
                        </label>
                      </div>
                    </div>

                    {/* Calculation Preview */}
                    {isDosageSelectionComplete() && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium text-foreground mb-2">Inpatient Calculation:</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>• Base price per unit: {format(selectedMedicineForDosage.price)}</div>
                          <div>• Frequency: {doseFrequencyOptions.find(f => f.value === doseFrequency)?.label}</div>
                          <div>• Duration: {totalDays} days</div>
                          <div>• Type: {isDischargeMedicine ? 'Discharge Medicine (full bottles)' : 'Ward Medicine (partial allowed)'}</div>
                          <div>• Calculation: {calculateInpatientMedicineDosage().calculationDetails}</div>
                          <div className="font-semibold text-medical-primary">
                            • Total cost: {format(calculateInpatientMedicineDosage().totalPrice)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add to Bill Button */}
                    <div className="flex justify-end pt-2 border-t border-medical-primary/10">
                      <Button
                        onClick={addMedicineToBill}
                        disabled={!isDosageSelectionComplete()}
                        variant="medical"
                        className="flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add to Bill</span>
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      • Fill all fields to calculate dosage<br/>
                      • Ward medicines can be given in partial quantities<br/>
                      • Discharge medicines follow outpatient rules (full bottles)<br/>
                      • Syrup/Solution bottles: 100ml standard size
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Bill Summary */}
          <div>
            <Card className="glass-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-medical-primary">
                  <span className="flex items-center">
                    <Calculator className="mr-2 h-5 w-5" />
                    Inpatient Bill Summary
                  </span>
                  {(billItems.length > 0 || daysAdmitted > 1) && (
                    <Button size="sm" variant="medical-ghost" onClick={clearBill}>
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-medical-secondary/10 rounded-lg border border-medical-secondary/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Patient Stay:</span>
                    <span className="font-semibold text-medical-primary">
                      {daysAdmitted} {daysAdmitted === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>

                {billItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {Object.entries(getBillItemsByCategory()).map(([category, items]) => (
                        <div key={category} className="border-l-4 border-medical-primary/30 pl-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-medical-primary text-sm">{category}</h4>
                            <span className="text-sm font-medium text-medical-primary">
                              {format(calculateCategoryTotal(items))}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {items.map((item) => {
                              const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                              const isDailyItem = item.category.includes('Food') || 
                                                 item.category.includes('Seat') || 
                                                 item.category.includes('O2') ||
                                                 item.name.toLowerCase().includes('per day');
                              const subtotal = isDailyItem ? price * item.quantity * daysAdmitted : price * item.quantity;
                              return (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-foreground">{item.name}</div>
                                    {isDailyItem && (
                                      <div className="text-xs text-medical-accent">Daily rate × {daysAdmitted} days</div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-medical-primary font-medium">
                                      {format(subtotal)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="medical-ghost"
                                      onClick={() => removeFromBill(item.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-medical-secondary/20 pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span className="text-foreground">Grand Total:</span>
                        <span className="text-medical-primary">{format(calculateTotal())}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {daysAdmitted > 1 && 'Daily rates included for multi-day stay'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items added to bill yet.</p>
                    <p className="text-sm">Search for items or select a category to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Duplicate Item Confirmation Dialog */}
      <Dialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog({ open, item: duplicateDialog.item })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Item Already in Bill
            </DialogTitle>
            <DialogDescription>
              The item "{duplicateDialog.item?.name}" is already in your bill. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-sm">{duplicateDialog.item?.name}</div>
              <div className="text-xs text-muted-foreground">{duplicateDialog.item?.category}</div>
              <div className="text-sm font-semibold text-medical-primary">
                {duplicateDialog.item && format(duplicateDialog.item.price)}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button 
              variant="default" 
              onClick={() => handleDuplicateAction('add')}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              Add Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleDuplicateAction('skip')}
              className="w-full sm:w-auto"
            >
              Skip
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDuplicateAction('remove')}
              className="w-full sm:w-auto"
            >
              Remove Existing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cupertino Date Picker Modal */}
      <CupertinoDateTimePicker
        isOpen={showCupertinoDatePicker}
        onClose={() => setShowCupertinoDatePicker(false)}
        onConfirm={handleCupertinoDateConfirm}
        initialDate={convertToDate(
          cupertinoDatePickerType === 'admission' ? admissionDate : dischargeDate,
          cupertinoDatePickerType === 'admission' ? admissionTime : dischargeTime
        )}
        title={`Select ${cupertinoDatePickerType === 'admission' ? 'Admission' : 'Discharge'} Date`}
      />
    </Layout>
  );
};

export default Inpatient;