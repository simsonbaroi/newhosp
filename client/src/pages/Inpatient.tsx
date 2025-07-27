import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle, ChevronDown, ChevronUp, FileText, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useTakaFormat } from '../hooks/useCurrencyFormat';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useToast } from '@/hooks/use-toast';
import { CupertinoDateTimePicker } from '@/components/CupertinoDateTimePicker';
import type { MedicalItem } from '../../../shared/schema';
import { calculateMedicineDosage, formatDosageForBill, MEDICINE_RULES } from '../../../shared/medicineCalculations';
import { getCategoryNames, getCategoryInterface } from '../lib/categories';

interface BillItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit?: string;
  quantity?: number;
  dailyRate?: boolean;
  billId?: string;
  dosageInfo?: string;
}

export default function Inpatient() {
  const { format } = useTakaFormat();
  const { toast } = useToast();
  
  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    const hours12 = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours12}:${minutes} ${ampm}`
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
  const [totalVisitation, setTotalVisitation] = useState<string>('');
  
  // Time state
  const [admissionTime, setAdmissionTime] = useState<string>(currentDateTime.time);
  const [dischargeTime, setDischargeTime] = useState<string>(currentDateTime.time);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [daysAdmitted, setDaysAdmitted] = useState<number>(1);
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const [duplicateDialog, setDuplicateDialog] = useState<{open: boolean, item: MedicalItem | null}>({open: false, item: null});
  const [isPatientInfoExpanded, setIsPatientInfoExpanded] = useState<boolean>(false);
  const [isBillFormHeaderExpanded, setIsBillFormHeaderExpanded] = useState<boolean>(false);
  
  // Advanced category functionality states (matching outpatient)
  const [selectedLabItems, setSelectedLabItems] = useState<MedicalItem[]>([]);
  const [dropdownSelectedItems, setDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedXRayItems, setSelectedXRayItems] = useState<MedicalItem[]>([]);
  const [xRayDropdownSelectedItems, setXRayDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedRegistrationItems, setSelectedRegistrationItems] = useState<MedicalItem[]>([]);
  const [registrationDropdownSelectedItems, setRegistrationDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedOrthopedicItems, setSelectedOrthopedicItems] = useState<MedicalItem[]>([]);
  const [orthopedicDropdownSelectedItems, setOrthopedicDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedSurgeryItems, setSelectedSurgeryItems] = useState<MedicalItem[]>([]);
  const [surgeryDropdownSelectedItems, setSurgeryDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedProceduresItems, setSelectedProceduresItems] = useState<MedicalItem[]>([]);
  const [proceduresDropdownSelectedItems, setProceduresDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [dropdownValue, setDropdownValue] = useState<string>('');
  const [highlightedDropdownIndex, setHighlightedDropdownIndex] = useState<number>(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownFilterQuery, setDropdownFilterQuery] = useState<string>('');
  const [xRayDropdownValue, setXRayDropdownValue] = useState<string>('');
  const [xRayHighlightedDropdownIndex, setXRayHighlightedDropdownIndex] = useState<number>(-1);
  const [isXRayDropdownOpen, setIsXRayDropdownOpen] = useState<boolean>(false);
  const [xRayDropdownFilterQuery, setXRayDropdownFilterQuery] = useState<string>('');
  const [registrationHighlightedDropdownIndex, setRegistrationHighlightedDropdownIndex] = useState<number>(-1);
  const [isRegistrationDropdownOpen, setIsRegistrationDropdownOpen] = useState<boolean>(false);
  const [registrationDropdownFilterQuery, setRegistrationDropdownFilterQuery] = useState<string>('');
  const [orthopedicDropdownValue, setOrthopedicDropdownValue] = useState<string>('');
  const [orthopedicHighlightedDropdownIndex, setOrthopedicHighlightedDropdownIndex] = useState<number>(-1);
  const [isOrthopedicDropdownOpen, setIsOrthopedicDropdownOpen] = useState<boolean>(false);
  const [orthopedicDropdownFilterQuery, setOrthopedicDropdownFilterQuery] = useState<string>('');
  const [surgeryDropdownValue, setSurgeryDropdownValue] = useState<string>('');
  const [surgeryHighlightedDropdownIndex, setSurgeryHighlightedDropdownIndex] = useState<number>(-1);
  const [isSurgeryDropdownOpen, setIsSurgeryDropdownOpen] = useState<boolean>(false);
  const [surgeryDropdownFilterQuery, setSurgeryDropdownFilterQuery] = useState<string>('');
  const [proceduresDropdownValue, setProceduresDropdownValue] = useState<string>('');
  const [proceduresHighlightedDropdownIndex, setProceduresHighlightedDropdownIndex] = useState<number>(-1);
  const [isProceduresDropdownOpen, setIsProceduresDropdownOpen] = useState<boolean>(false);
  const [proceduresDropdownFilterQuery, setProceduresDropdownFilterQuery] = useState<string>('');
  
  // X-Ray film view selection state
  const [selectedXRayForViews, setSelectedXRayForViews] = useState<MedicalItem | null>(null);
  const [xRayViews, setXRayViews] = useState({
    AP: false,
    LAT: false,
    OBLIQUE: false,
    BOTH: false
  });
  const [isOffChargePortable, setIsOffChargePortable] = useState(false);
  const [showXRayViewSelection, setShowXRayViewSelection] = useState(false);
  
  // Medicine-specific state for Discharge Medicine
  const [selectedMedicineForDosage, setSelectedMedicineForDosage] = useState<MedicalItem | null>(null);
  const [showMedicineDosageSelection, setShowMedicineDosageSelection] = useState(false);
  const [dosePrescribed, setDosePrescribed] = useState('');
  const [medType, setMedType] = useState('');
  const [doseFrequency, setDoseFrequency] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [medicineType, setMedicineType] = useState<'ward' | 'discharge'>('discharge');
  const [tempSelectedMedicines, setTempSelectedMedicines] = useState<Array<MedicalItem & { tempId: string }>>([]);
  
  // Medicine search and dropdown state
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [medicineSearchSuggestions, setMedicineSearchSuggestions] = useState<MedicalItem[]>([]);
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(-1);
  
  // IV state - dropdown with quantity controls
  const [selectedIVs, setSelectedIVs] = useState<Array<{ item: MedicalItem; quantity: number }>>([]);
  const [ivDropdownValue, setIvDropdownValue] = useState<string>('');
  const [ivHighlightedDropdownIndex, setIvHighlightedDropdownIndex] = useState<number>(-1);
  const [isIvDropdownOpen, setIsIvDropdownOpen] = useState<boolean>(false);
  const [ivDropdownFilterQuery, setIvDropdownFilterQuery] = useState<string>('');

  // Plaster/Milk state
  const [plasterMilkMode, setPlasterMilkMode] = useState<'plaster' | 'milk' | null>(null);
  const [selectedPlasters, setSelectedPlasters] = useState<Array<{ item: MedicalItem; quantity: number }>>([]);
  const [plasterDropdownValue, setPlasterDropdownValue] = useState<string>('');
  const [plasterHighlightedDropdownIndex, setPlasterHighlightedDropdownIndex] = useState<number>(-1);
  const [isPlasterDropdownOpen, setIsPlasterDropdownOpen] = useState<boolean>(false);
  const [plasterDropdownFilterQuery, setPlasterDropdownFilterQuery] = useState<string>('');
  const [plasterChargeChecked, setPlasterChargeChecked] = useState<boolean>(false);
  const [milkQuantity, setMilkQuantity] = useState<number>(1);

  // Patient classification - removed overlay requirement
  const [selectedPatientType, setSelectedPatientType] = useState<'MW/FW' | 'OB' | null>('MW/FW'); // Default to MW/FW
  const [typeChangeIndicator, setTypeChangeIndicator] = useState<boolean>(false);
  
  // Orthopedic search and dropdown state
  const [orthopedicSearchSuggestions, setOrthopedicSearchSuggestions] = useState<MedicalItem[]>([]);
  const [orthopedicHighlightedSearchIndex, setOrthopedicHighlightedSearchIndex] = useState(-1);
  
  // Surgery search and dropdown state
  const [surgerySearchSuggestions, setSurgerySearchSuggestions] = useState<MedicalItem[]>([]);
  const [surgeryHighlightedSearchIndex, setSurgeryHighlightedSearchIndex] = useState(-1);
  
  // Procedures search and dropdown state
  const [proceduresSearchSuggestions, setProceduresSearchSuggestions] = useState<MedicalItem[]>([]);
  const [proceduresHighlightedSearchIndex, setProceduresHighlightedSearchIndex] = useState(-1);
  const [medicineDropdownValue, setMedicineDropdownValue] = useState<string>('');
  const [medicineHighlightedDropdownIndex, setMedicineHighlightedDropdownIndex] = useState<number>(-1);
  const [isMedicineDropdownOpen, setIsMedicineDropdownOpen] = useState<boolean>(false);
  const [medicineDropdownFilterQuery, setMedicineDropdownFilterQuery] = useState<string>('');

  // Manual entry state for Physical Therapy, Limb and Brace, and Blood
  const [manualEntryPrice, setManualEntryPrice] = useState<string>('');

  // Refs for advanced functionality
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const xRayDropdownRef = useRef<HTMLDivElement>(null);
  const xRayDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const xRaySearchInputRef = useRef<HTMLInputElement>(null);
  const registrationDropdownRef = useRef<HTMLDivElement>(null);
  const registrationDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const registrationSearchInputRef = useRef<HTMLInputElement>(null);
  const medicineDropdownRef = useRef<HTMLDivElement>(null);
  const medicineDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const medicineSearchInputRef = useRef<HTMLInputElement>(null);
  const doseInputRef = useRef<HTMLInputElement>(null);
  const orthopedicDropdownRef = useRef<HTMLDivElement>(null);
  const orthopedicDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const orthopedicSearchInputRef = useRef<HTMLInputElement>(null);
  const surgeryDropdownRef = useRef<HTMLDivElement>(null);
  const surgeryDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const surgerySearchInputRef = useRef<HTMLInputElement>(null);
  const proceduresDropdownRef = useRef<HTMLDivElement>(null);
  const proceduresDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const proceduresSearchInputRef = useRef<HTMLInputElement>(null);
  const ivDropdownRef = useRef<HTMLDivElement>(null);
  const ivDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const plasterDropdownRef = useRef<HTMLDivElement>(null);
  const plasterDropdownButtonRef = useRef<HTMLButtonElement>(null);
  
  // Cupertino Date picker modal state
  const [showCupertinoDatePicker, setShowCupertinoDatePicker] = useState(false);
  const [cupertinoDatePickerType, setCupertinoDatePickerType] = useState<'admission' | 'discharge'>('admission');

  // Parse DD/MM/YY date format
  const parseCustomDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    const fullYear = year < 50 ? 2000 + year : 1900 + year; // Assume 00-49 is 2000-2049, 50-99 is 1950-1999
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return new Date(fullYear, month, day);
  };

  // Parse time format HH:MM AM/PM
  const parseTime = (timeStr: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } => {
    const parts = timeStr.trim().split(' ');
    const timePart = parts[0];
    const ampm = (parts[1] || 'AM') as 'AM' | 'PM';
    
    const [hourStr, minuteStr] = timePart.split(':');
    const hour = parseInt(hourStr, 10) || 12;
    const minute = parseInt(minuteStr, 10) || 0;
    
    return { hour, minute, ampm };
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
    
    setShowCupertinoDatePicker(false);
  };

  // Calculate total admitted days based on admission and discharge dates
  const calculateAdmittedDays = (admission: string, discharge: string): number => {
    if (!admission || !discharge) return 1;
    
    const admissionDate = parseCustomDate(admission);
    const dischargeDate = parseCustomDate(discharge);
    
    if (!admissionDate || !dischargeDate || dischargeDate < admissionDate) return 1;
    
    const timeDiff = dischargeDate.getTime() - admissionDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // If admission and discharge are the same day, count as 1 day
    // Otherwise, don't count the discharge day
    if (daysDiff === 0) {
      return 1; // Same day admission and discharge
    } else {
      return daysDiff; // Don't count discharge day
    }
  };

  // Update days admitted when dates change
  useEffect(() => {
    const days = calculateAdmittedDays(admissionDate, dischargeDate);
    setDaysAdmitted(days);
  }, [admissionDate, dischargeDate]);



  // Add item to bill function
  // Medicine dosage configuration for inpatient
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
    if (!selectedMedicineForDosage || !isDosageSelectionComplete()) return { totalQuantity: 0, totalPrice: 0, calculationDetails: '', quantityUnit: '', pricePerUnit: 0, isPartialAllowed: false };

    try {
      const result = calculateMedicineDosage({
        dosePrescribed,
        medType,
        doseFrequency,
        totalDays: parseInt(totalDays),
        basePrice: parseFloat(selectedMedicineForDosage.price),
        isInpatient: true, // Inpatient logic
        isDischargeMedicine: medicineType === 'discharge'
      });

      return result; // Return the complete result object
    } catch (error) {
      console.error('Medicine calculation error:', error);
      return { totalQuantity: 0, totalPrice: 0, calculationDetails: 'Calculation error', quantityUnit: '', pricePerUnit: 0, isPartialAllowed: false };
    }
  };

  const addMedicineToTempList = () => {
    if (!selectedMedicineForDosage || !isDosageSelectionComplete()) return;

    const calculationResult = calculateInpatientMedicineDosage();
    
    if (calculationResult.totalQuantity === 0) {
      console.error('Failed to calculate medicine dosage');
      return;
    }

    // Use the shared formatting function
    const formattedName = formatDosageForBill(
      selectedMedicineForDosage.name,
      dosePrescribed,
      medType,
      doseFrequency,
      parseInt(totalDays),
      calculationResult
    );

    const medicineItem = {
      ...selectedMedicineForDosage,
      name: formattedName,
      price: calculationResult.totalPrice.toString(),
      tempId: `temp-medicine-${selectedMedicineForDosage.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dosageInfo: {
        dosePrescribed,
        medType,
        doseFrequency,
        totalDays,
        calculationResult,
        medicineType
      }
    };

    setTempSelectedMedicines(prev => [...prev, medicineItem]);
    
    // Reset dosage selection to allow adding another medicine
    cancelMedicineDosageSelection();
  };

  const addAllTempMedicinesToBill = () => {
    if (tempSelectedMedicines.length === 0) return;
    
    // Validate patient type is selected before adding items
    if (!validatePatientTypeSelected()) {
      return;
    }

    const billItemsToAdd = tempSelectedMedicines.map(medicine => ({
      ...medicine,
      id: medicine.id.toString(),
      price: parseFloat(medicine.price),
      billId: `medicine-${medicine.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setBillItems(prevBillItems => [...prevBillItems, ...billItemsToAdd]);
    setTempSelectedMedicines([]);
  };

  const removeTempMedicine = (tempId: string) => {
    setTempSelectedMedicines(prev => prev.filter(medicine => medicine.tempId !== tempId));
  };

  const editTempMedicine = (medicine: any) => {
    // Pre-fill the dosage calculator with existing values
    if (medicine.dosageInfo) {
      setSelectedMedicineForDosage(medicine);
      setDosePrescribed(medicine.dosageInfo.dosePrescribed);
      setMedType(medicine.dosageInfo.medType);
      setDoseFrequency(medicine.dosageInfo.doseFrequency);
      setTotalDays(medicine.dosageInfo.totalDays);
      setMedicineType(medicine.dosageInfo.medicineType || 'discharge');
      setShowMedicineDosageSelection(true);
      
      // Remove the medicine from temp list since it will be re-added after editing
      removeTempMedicine(medicine.tempId);
      
      // Focus on dose input for immediate editing
      setTimeout(() => {
        if (doseInputRef.current) {
          doseInputRef.current.focus();
        }
      }, 100);
    }
  };

  const selectMedicineForDosage = (item: MedicalItem) => {
    setSelectedMedicineForDosage(item);
    setShowMedicineDosageSelection(true);
    setMedicineSearchQuery('');
    setMedicineSearchSuggestions([]);
    setIsMedicineDropdownOpen(false);
    
    // Focus on dose input
    setTimeout(() => {
      if (doseInputRef.current) {
        doseInputRef.current.focus();
      }
    }, 100);
  };

  const cancelMedicineDosageSelection = () => {
    setSelectedMedicineForDosage(null);
    setShowMedicineDosageSelection(false);
    setDosePrescribed('');
    setMedType('');
    setDoseFrequency('');
    setTotalDays('');
    setMedicineType('discharge');
  };

  // Medicine search functionality
  const getMedicineSearchSuggestions = () => {
    if (!medicineSearchQuery || selectedCategory !== 'Discharge Medicine') return [];
    return categoryItems
      .filter((item: MedicalItem) => 
        item.name.toLowerCase().includes(medicineSearchQuery.toLowerCase()) &&
        !billItems.find(billItem => billItem.id === item.id.toString())
      )
      .slice(0, 5);
  };

  const handleMedicineSearchKeyDown = (e: React.KeyboardEvent) => {
    const suggestions = getMedicineSearchSuggestions();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSearchIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSearchIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedSearchIndex >= 0 && suggestions[highlightedSearchIndex]) {
        selectMedicineForDosage(suggestions[highlightedSearchIndex]);
        setHighlightedSearchIndex(-1);
      } else if (suggestions.length > 0) {
        selectMedicineForDosage(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setMedicineSearchSuggestions([]);
      setHighlightedSearchIndex(-1);
    }
  };

  // Medicine dropdown functionality
  const getMedicineFilteredDropdownItems = () => {
    if (!medicineDropdownFilterQuery.trim()) return categoryItems;
    
    const query = medicineDropdownFilterQuery.toLowerCase();
    
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
        
        // Default alphabetical sort
        return aName.localeCompare(bName);
      });
  };

  const handleMedicineDropdownKeyDown = (e: React.KeyboardEvent) => {
    const filteredItems = getMedicineFilteredDropdownItems();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMedicineHighlightedDropdownIndex(prev => 
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMedicineHighlightedDropdownIndex(prev => 
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (medicineHighlightedDropdownIndex >= 0 && filteredItems[medicineHighlightedDropdownIndex]) {
        const item = filteredItems[medicineHighlightedDropdownIndex];
        const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
        if (!alreadyInBill) {
          selectMedicineForDosage(item);
        }
      }
    } else if (e.key === 'Escape') {
      setIsMedicineDropdownOpen(false);
      setMedicineHighlightedDropdownIndex(-1);
      setMedicineDropdownFilterQuery('');
    } else if (e.key === 'Backspace' && medicineDropdownFilterQuery.length > 0) {
      setMedicineDropdownFilterQuery(prev => prev.slice(0, -1));
      setMedicineHighlightedDropdownIndex(-1);
    } else if (e.key.length === 1) {
      // Add character to filter
      setMedicineDropdownFilterQuery(prev => prev + e.key.toLowerCase());
      setMedicineHighlightedDropdownIndex(-1);
    }
  };

  // Fetch medical items
  const { data: medicalItems = [] } = useQuery<MedicalItem[]>({
    queryKey: ['/api/medical-items'],
  });

  // Filter items by category
  const categoryItems = selectedCategory 
    ? medicalItems.filter((item: MedicalItem) => item.category === selectedCategory)
    : [];

  // Auto-update medicine search suggestions when query changes
  useEffect(() => {
    if (selectedCategory === 'Discharge Medicine' && medicineSearchQuery) {
      const suggestions = categoryItems
        .filter((item: MedicalItem) => 
          item.name.toLowerCase().includes(medicineSearchQuery.toLowerCase()) &&
          !billItems.find(billItem => billItem.id === item.id.toString())
        )
        .slice(0, 5);
      setMedicineSearchSuggestions(suggestions);
      setHighlightedSearchIndex(-1);
    } else if (!medicineSearchQuery) {
      setMedicineSearchSuggestions([]);
      setHighlightedSearchIndex(-1);
    }
  }, [medicineSearchQuery, selectedCategory]);

  // Handle click outside medicine dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target as Node)) {
        setIsMedicineDropdownOpen(false);
        setMedicineHighlightedDropdownIndex(-1);
        setMedicineDropdownFilterQuery('');
      }
    };

    if (isMedicineDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMedicineDropdownOpen]);

  // Auto-focus medicine search input when Discharge Medicine category is selected
  useEffect(() => {
    if (selectedCategory === 'Discharge Medicine' && isCarouselMode && medicineSearchInputRef.current) {
      medicineSearchInputRef.current.focus();
    }
  }, [selectedCategory, isCarouselMode]);

  // IV dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ivDropdownRef.current && !ivDropdownRef.current.contains(event.target as Node)) {
        setIsIvDropdownOpen(false);
        setIvDropdownFilterQuery('');
      }
    };

    if (isIvDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isIvDropdownOpen]);

  // IV dropdown keyboard navigation
  const handleIvDropdownKeyDown = (e: KeyboardEvent) => {
    if (!isIvDropdownOpen) return;

    const filteredItems = categoryItems.filter((item: MedicalItem) => 
      item.name.toLowerCase().includes(ivDropdownFilterQuery.toLowerCase())
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIvHighlightedDropdownIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIvHighlightedDropdownIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (ivHighlightedDropdownIndex >= 0 && ivHighlightedDropdownIndex < filteredItems.length) {
          const item = filteredItems[ivHighlightedDropdownIndex];
          const alreadySelected = selectedIVs.find(iv => iv.item.id === item.id);
          const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
          
          if (!alreadySelected && !alreadyInBill) {
            setSelectedIVs(prev => [...prev, { item, quantity: 1 }]);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsIvDropdownOpen(false);
        setIvDropdownFilterQuery('');
        break;
      default:
        // Filter by typing
        if (e.key.length === 1) {
          setIvDropdownFilterQuery(prev => prev + e.key);
          setIvHighlightedDropdownIndex(0);
        } else if (e.key === 'Backspace') {
          setIvDropdownFilterQuery(prev => prev.slice(0, -1));
          setIvHighlightedDropdownIndex(0);
        }
        break;
    }
  };

  // IV dropdown focus management
  useEffect(() => {
    if (isIvDropdownOpen && ivDropdownButtonRef.current) {
      ivDropdownButtonRef.current.focus();
    }
  }, [ivDropdownFilterQuery, selectedIVs.length]);

  // Plaster dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plasterDropdownRef.current && !plasterDropdownRef.current.contains(event.target as Node)) {
        setIsPlasterDropdownOpen(false);
        setPlasterDropdownFilterQuery('');
      }
    };

    if (isPlasterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPlasterDropdownOpen]);

  // Plaster dropdown keyboard navigation
  const handlePlasterDropdownKeyDown = (e: KeyboardEvent) => {
    if (!isPlasterDropdownOpen) return;

    const plasterItems = categoryItems.filter((item: MedicalItem) => 
      item.name.toLowerCase().includes('plaster') &&
      item.name.toLowerCase().includes(plasterDropdownFilterQuery.toLowerCase())
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setPlasterHighlightedDropdownIndex(prev => 
          prev < plasterItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setPlasterHighlightedDropdownIndex(prev => 
          prev > 0 ? prev - 1 : plasterItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (plasterHighlightedDropdownIndex >= 0 && plasterHighlightedDropdownIndex < plasterItems.length) {
          const item = plasterItems[plasterHighlightedDropdownIndex];
          const alreadySelected = selectedPlasters.find(plaster => plaster.item.id === item.id);
          const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
          
          if (!alreadySelected && !alreadyInBill) {
            setSelectedPlasters(prev => [...prev, { item, quantity: 1 }]);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsPlasterDropdownOpen(false);
        setPlasterDropdownFilterQuery('');
        break;
      default:
        // Filter by typing
        if (e.key.length === 1) {
          setPlasterDropdownFilterQuery(prev => prev + e.key);
          setPlasterHighlightedDropdownIndex(0);
        } else if (e.key === 'Backspace') {
          setPlasterDropdownFilterQuery(prev => prev.slice(0, -1));
          setPlasterHighlightedDropdownIndex(0);
        }
        break;
    }
  };

  // Plaster dropdown focus management
  useEffect(() => {
    if (isPlasterDropdownOpen && plasterDropdownButtonRef.current) {
      plasterDropdownButtonRef.current.focus();
    }
  }, [plasterDropdownFilterQuery, selectedPlasters.length]);

  const addItemToBill = (item: MedicalItem) => {
    const existingItem = billItems.find(billItem => billItem.id === item.id.toString());
    if (existingItem) {
      setDuplicateDialog({ open: true, item });
    } else {
      const billItem = {
        ...item,
        id: item.id.toString(),
        price: parseFloat(item.price),
        billId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      setBillItems(prev => [...prev, billItem]);
    }
  };

  // Handle manual entry for Physical Therapy, Limb and Brace, and Blood
  const addManualEntryToBill = () => {
    if (!categorySearchQuery.trim() || !manualEntryPrice.trim()) {
      return; // Don't add if name or price is empty
    }

    const price = parseFloat(manualEntryPrice);
    if (isNaN(price) || price <= 0) {
      return; // Don't add if price is invalid
    }

    const manualItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: categorySearchQuery.trim(),
      category: selectedCategory,
      price: price,
      billId: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setBillItems(prev => [...prev, manualItem]);
    
    // Clear the inputs after adding
    setCategorySearchQuery('');
    setManualEntryPrice('');
  };

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHighlightedDropdownIndex(-1);
        setDropdownFilterQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Ensure dropdown button stays focused for continuous keyboard input
  useEffect(() => {
    if (isDropdownOpen && dropdownButtonRef.current) {
      dropdownButtonRef.current.focus();
    }
  }, [dropdownFilterQuery, dropdownSelectedItems.length]);

  // Auto-focus search input when Laboratory category is selected
  useEffect(() => {
    if (selectedCategory === 'Laboratory' && isCarouselMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedCategory, isCarouselMode]);

  // Handle click outside X-Ray dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (xRayDropdownRef.current && !xRayDropdownRef.current.contains(event.target as Node)) {
        setIsXRayDropdownOpen(false);
        setXRayHighlightedDropdownIndex(-1);
        setXRayDropdownFilterQuery('');
      }
    };

    if (isXRayDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isXRayDropdownOpen]);

  // Get permanent inpatient categories (already filtered for inpatient use)
  const categories = getCategoryNames(false); // Use permanent inpatient categories

  // Use categories directly since they're already in correct order from permanent config
  const orderedCategories = categories;

  // Category navigation functions
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentCategoryIndex(orderedCategories.indexOf(category));
    setIsCarouselMode(true);
    setCategorySearchQuery('');
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    console.log('Navigate carousel:', direction, 'from index:', currentCategoryIndex);
    const newIndex = direction === 'prev' 
      ? (currentCategoryIndex - 1 + orderedCategories.length) % orderedCategories.length
      : (currentCategoryIndex + 1) % orderedCategories.length;
    
    console.log('New index:', newIndex, 'category:', orderedCategories[newIndex]);
    setCurrentCategoryIndex(newIndex);
    setSelectedCategory(orderedCategories[newIndex]);
    setCategorySearchQuery(''); // Reset search when switching categories
  };

  // Swipe gesture support for carousel navigation
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      console.log('Swipe left detected, carousel mode:', isCarouselMode);
      if (isCarouselMode) {
        navigateCarousel('next');
      }
    },
    onSwipeRight: () => {
      console.log('Swipe right detected, carousel mode:', isCarouselMode);
      if (isCarouselMode) {
        navigateCarousel('prev');
      }
    },
    threshold: 50, // Reduced threshold for better sensitivity
    preventDefaultEvents: true
  });

  const exitCarousel = () => {
    setIsCarouselMode(false);
    setSelectedCategory('');
    setCategorySearchQuery('');
  };

  const goToPreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      const newIndex = currentCategoryIndex - 1;
      setCurrentCategoryIndex(newIndex);
      setSelectedCategory(orderedCategories[newIndex]);
      setCategorySearchQuery('');
    }
  };

  const goToNextCategory = () => {
    if (currentCategoryIndex < orderedCategories.length - 1) {
      const newIndex = currentCategoryIndex + 1;
      setCurrentCategoryIndex(newIndex);
      setSelectedCategory(orderedCategories[newIndex]);
      setCategorySearchQuery('');
    }
  };

  // Laboratory search functionality
  const getLabSuggestions = () => {
    if (!categorySearchQuery || selectedCategory !== 'Laboratory') return [];
    return categoryItems
      .filter((item: MedicalItem) => 
        item.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) &&
        !selectedLabItems.find(selected => selected.id === item.id) &&
        !billItems.find(billItem => billItem.id === item.id.toString())
      )
      .slice(0, 5);
  };

  const handleLabSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const suggestions = getLabSuggestions();
      if (suggestions.length > 0) {
        const item = suggestions[0];
        setSelectedLabItems(prev => [...prev, item]);
        setCategorySearchQuery('');
        setDropdownSelectedItems([]);
      }
    }
  };

  const removeLabItem = (itemId: number) => {
    setSelectedLabItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addSelectedLabItemsToBill = () => {
    // Validate patient type is selected before adding items
    if (!validatePatientTypeSelected()) {
      return;
    }
    
    const newItems: MedicalItem[] = [];
    const duplicateItems: MedicalItem[] = [];
    
    selectedLabItems.forEach(item => {
      const existingItem = billItems.find(billItem => billItem.id === item.id.toString());
      if (existingItem) {
        duplicateItems.push(item);
      } else {
        newItems.push(item);
      }
    });
    
    if (newItems.length > 0) {
      const billItemsToAdd = newItems.map(item => ({ 
        ...item, 
        id: item.id.toString(),
        price: parseFloat(item.price),
        billId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      }));
      setBillItems(prevBillItems => [...prevBillItems, ...billItemsToAdd]);
    }
    
    if (duplicateItems.length > 0) {
      setDuplicateDialog({ open: true, item: duplicateItems[0] });
    }
    
    setSelectedLabItems([]);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  // Dropdown functionality for Laboratory
  const handleDropdownSelect = (value: string) => {
    const selectedItem = categoryItems.find(item => item.id.toString() === value);
    
    const alreadyInDropdown = dropdownSelectedItems.find(item => item.id === selectedItem?.id);
    const alreadyInBill = billItems.find(billItem => billItem.id === selectedItem?.id.toString());
    
    if (selectedItem && !alreadyInDropdown && !alreadyInBill) {
      setDropdownSelectedItems(prev => [...prev, selectedItem]);
      setSelectedLabItems([]);
      setCategorySearchQuery('');
    }
    
    setDropdownValue('');
    setHighlightedDropdownIndex(-1);
    setDropdownFilterQuery('');
    
    setTimeout(() => {
      if (dropdownButtonRef.current) {
        dropdownButtonRef.current.focus();
      }
    }, 0);
  };

  const removeDropdownItem = (itemId: number) => {
    setDropdownSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addDropdownSelectedItemsToBill = () => {
    // Validate patient type is selected before adding items
    if (!validatePatientTypeSelected()) {
      return;
    }
    
    const newItems: MedicalItem[] = [];
    const duplicateItems: MedicalItem[] = [];
    
    dropdownSelectedItems.forEach(item => {
      const existingItem = billItems.find(billItem => billItem.id === item.id.toString());
      if (existingItem) {
        duplicateItems.push(item);
      } else {
        newItems.push(item);
      }
    });
    
    if (newItems.length > 0) {
      const billItemsToAdd = newItems.map(item => ({ 
        ...item, 
        id: item.id.toString(),
        price: parseFloat(item.price),
        billId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      }));
      setBillItems(prevBillItems => [...prevBillItems, ...billItemsToAdd]);
    }
    
    if (duplicateItems.length > 0) {
      setDuplicateDialog({ open: true, item: duplicateItems[0] });
    }
    
    setDropdownSelectedItems([]);
    setIsDropdownOpen(false);
    setHighlightedDropdownIndex(-1);
    setDropdownFilterQuery('');
  };

  // Handle keyboard navigation for dropdown
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
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
      setHighlightedDropdownIndex(-1);
      setDropdownFilterQuery('');
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\s]/)) {
      e.preventDefault();
      const newQuery = dropdownFilterQuery + e.key.toLowerCase();
      setDropdownFilterQuery(newQuery);
      setHighlightedDropdownIndex(0);
      if (!isDropdownOpen) setIsDropdownOpen(true);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setDropdownFilterQuery(prev => prev.slice(0, -1));
      setHighlightedDropdownIndex(0);
    }
  };

  // Get filtered dropdown items
  const getFilteredDropdownItems = () => {
    if (!categoryItems) return [];
    
    const filtered = categoryItems.filter(item => 
      !dropdownFilterQuery || 
      item.name.toLowerCase().includes(dropdownFilterQuery.toLowerCase())
    );
    
    if (!dropdownFilterQuery) return filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    // Sort by relevance: exact matches first, then starts with, then contains
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const query = dropdownFilterQuery.toLowerCase();
      
      if (aName === query && bName !== query) return -1;
      if (bName === query && aName !== query) return 1;
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
      
      return aName.localeCompare(bName);
    });
  };

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHighlightedDropdownIndex(-1);
        setDropdownFilterQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Ensure dropdown button stays focused for continuous keyboard input
  useEffect(() => {
    if (isDropdownOpen && dropdownButtonRef.current) {
      dropdownButtonRef.current.focus();
    }
  }, [dropdownFilterQuery, dropdownSelectedItems.length]);

  // Auto-focus search input when Laboratory category is selected
  useEffect(() => {
    if (selectedCategory === 'Laboratory' && isCarouselMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedCategory, isCarouselMode]);

  // Auto-focus search input when Orthopedic category is selected
  useEffect(() => {
    if (selectedCategory === 'Orthopedic, S.Roll, etc.' && isCarouselMode && orthopedicSearchInputRef.current) {
      orthopedicSearchInputRef.current.focus();
    }
  }, [selectedCategory, isCarouselMode]);

  // Orthopedic search suggestions - update whenever categorySearchQuery changes for Orthopedic
  useEffect(() => {
    if (selectedCategory === 'Orthopedic, S.Roll, etc.' && categorySearchQuery) {
      const query = categorySearchQuery.toLowerCase();
      const suggestions = categoryItems.filter((item: MedicalItem) => 
        item.name.toLowerCase().includes(query)
      );
      
      // Sort by relevance: exact matches first, then starts with, then contains
      const sortedSuggestions = suggestions.sort((a: MedicalItem, b: MedicalItem) => {
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
      
      setOrthopedicSearchSuggestions(sortedSuggestions.slice(0, 10)); // Limit to top 10
      setOrthopedicHighlightedSearchIndex(-1);
    } else {
      setOrthopedicSearchSuggestions([]);
      setOrthopedicHighlightedSearchIndex(-1);
    }
  }, [categorySearchQuery, selectedCategory]);

  // Auto-focus search input when Surgery category is selected
  useEffect(() => {
    if (selectedCategory === 'Surgery' && isCarouselMode && surgerySearchInputRef.current) {
      surgerySearchInputRef.current.focus();
    }
  }, [selectedCategory, isCarouselMode]);

  // Surgery search suggestions - update whenever categorySearchQuery changes for Surgery
  useEffect(() => {
    if (selectedCategory === 'Surgery' && categorySearchQuery) {
      const query = categorySearchQuery.toLowerCase();
      const suggestions = categoryItems.filter((item: MedicalItem) => 
        item.name.toLowerCase().includes(query)
      );
      
      const sortedSuggestions = suggestions.sort((a: MedicalItem, b: MedicalItem) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName === query) return -1;
        if (bName === query) return 1;
        
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
        
        return aName.localeCompare(bName);
      });
      
      setSurgerySearchSuggestions(sortedSuggestions.slice(0, 10));
      setSurgeryHighlightedSearchIndex(-1);
    } else {
      setSurgerySearchSuggestions([]);
      setSurgeryHighlightedSearchIndex(-1);
    }
  }, [categorySearchQuery, selectedCategory]);

  // Auto-focus search input when Procedures category is selected
  useEffect(() => {
    if (selectedCategory === 'Procedures' && isCarouselMode && proceduresSearchInputRef.current) {
      proceduresSearchInputRef.current.focus();
    }
  }, [selectedCategory, isCarouselMode]);

  // Procedures search suggestions - update whenever categorySearchQuery changes for Procedures
  useEffect(() => {
    if (selectedCategory === 'Procedures' && categorySearchQuery) {
      const query = categorySearchQuery.toLowerCase();
      const suggestions = categoryItems.filter((item: MedicalItem) => 
        item.name.toLowerCase().includes(query)
      );
      
      const sortedSuggestions = suggestions.sort((a: MedicalItem, b: MedicalItem) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName === query) return -1;
        if (bName === query) return 1;
        
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
        
        return aName.localeCompare(bName);
      });
      
      setProceduresSearchSuggestions(sortedSuggestions.slice(0, 10));
      setProceduresHighlightedSearchIndex(-1);
    } else {
      setProceduresSearchSuggestions([]);
      setProceduresHighlightedSearchIndex(-1);
    }
  }, [categorySearchQuery, selectedCategory]);

  // Generic search key down handler for Orthopedic, Surgery, and Procedures
  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    selectedItems: MedicalItem[],
    setSelectedItems: React.Dispatch<React.SetStateAction<MedicalItem[]>>,
    suggestions: MedicalItem[],
    highlightedIndex: number,
    setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        const item = suggestions[highlightedIndex];
        const alreadySelected = selectedItems.find(selected => selected.id === item.id);
        const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
        
        if (!alreadySelected && !alreadyInBill) {
          setSelectedItems(prev => [...prev, item]);
        }
        setCategorySearchQuery('');
        setHighlightedIndex(-1);
      } else if (categorySearchQuery.trim() && suggestions.length > 0) {
        const firstItem = suggestions[0];
        const alreadySelected = selectedItems.find(selected => selected.id === firstItem.id);
        const alreadyInBill = billItems.find(billItem => billItem.id === firstItem.id.toString());
        
        if (!alreadySelected && !alreadyInBill) {
          setSelectedItems(prev => [...prev, firstItem]);
        }
        setCategorySearchQuery('');
        setHighlightedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setCategorySearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  // X-Ray specific functions (same as Laboratory)
  
  // Get sorted X-Ray suggestions with closest match first
  const getXRaySuggestions = () => {
    if (!categorySearchQuery) return [];
    
    const query = categorySearchQuery.toLowerCase();
    const suggestions = categoryItems.filter((item: MedicalItem) => 
      item.name.toLowerCase().includes(query)
    );
    
    // Sort by relevance: exact matches first, then starts with, then contains
    return suggestions.sort((a: MedicalItem, b: MedicalItem) => {
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

  // Handle comma-separated X-Ray item selection
  const handleXRaySearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const query = categorySearchQuery.trim();
      if (query) {
        // Get the top suggestion (closest match)
        const suggestions = getXRaySuggestions();
        if (suggestions.length > 0) {
          const topMatch = suggestions[0];
          // Check if item is already in the bill
          const alreadyInBill = billItems.find(billItem => billItem.id === topMatch.id.toString());
          
          if (!alreadyInBill) {
            handleXRayItemSelect(topMatch);
          }
        }
        setCategorySearchQuery('');
      }
      // Refocus search input
      setTimeout(() => {
        if (xRaySearchInputRef.current) {
          xRaySearchInputRef.current.focus();
        }
      }, 0);
    }
  };

  const removeXRayItem = (itemId: number) => {
    setSelectedXRayItems(prev => prev.filter(item => item.id !== itemId));
    // Refocus search input
    setTimeout(() => {
      if (xRaySearchInputRef.current) {
        xRaySearchInputRef.current.focus();
      }
    }, 0);
  };

  const addSelectedXRayItemsToBill = () => {
    selectedXRayItems.forEach(item => {
      const existingItem = billItems.find(billItem => billItem.id === item.id.toString());
      if (!existingItem) {
        handleXRayItemSelect(item);
      }
    });
    setSelectedXRayItems([]);
  };

  const handleXRayItemSelect = (item: MedicalItem) => {
    setSelectedXRayForViews(item);
    setXRayViews({ AP: false, LAT: false, OBLIQUE: false, BOTH: false });
    setIsOffChargePortable(false);
    setShowXRayViewSelection(true);
  };



  const addXRayToBill = () => {
    if (!selectedXRayForViews) return;
    
    const selectedViews = Object.entries(xRayViews)
      .filter(([_, checked]) => checked)
      .map(([view, _]) => view);
    
    if (selectedViews.length === 0) return;
    
    const viewText = selectedViews.includes('BOTH') ? 'AP and LAT' : selectedViews.join(', ');
    const displayName = `${selectedXRayForViews.name} (${viewText}${isOffChargePortable ? ', Off-Charge/Portable' : ''})`;
    
    // Check for exact duplicate (same X-ray with same views)
    const existingItem = billItems.find(billItem => 
      billItem.id === selectedXRayForViews.id.toString() && 
      billItem.name === displayName
    );
    
    if (existingItem) {
      setDuplicateDialog({ open: true, item: selectedXRayForViews });
    } else {
      const newBillItem = {
        ...selectedXRayForViews,
        id: selectedXRayForViews.id.toString(),
        name: displayName,
        price: parseFloat(selectedXRayForViews.price),
        billId: `${selectedXRayForViews.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      setBillItems(prev => [...prev, newBillItem]);
    }
    
    setShowXRayViewSelection(false);
    setSelectedXRayForViews(null);
    setXRayViews({ AP: false, LAT: false, OBLIQUE: false, BOTH: false });
    setIsOffChargePortable(false);
  };

  const removeXRayDropdownItem = (itemId: number) => {
    setXRayDropdownSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // X-Ray dropdown functionality
  const handleXRayDropdownKeyDown = (e: React.KeyboardEvent) => {
    const orderedItems = getXRayFilteredDropdownItems();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setXRayHighlightedDropdownIndex(prev => 
        prev < orderedItems.length - 1 ? prev + 1 : 0
      );
      if (!isXRayDropdownOpen) setIsXRayDropdownOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setXRayHighlightedDropdownIndex(prev => 
        prev > 0 ? prev - 1 : orderedItems.length - 1
      );
      if (!isXRayDropdownOpen) setIsXRayDropdownOpen(true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isXRayDropdownOpen && xRayHighlightedDropdownIndex >= 0 && orderedItems[xRayHighlightedDropdownIndex]) {
        const selectedItem = orderedItems[xRayHighlightedDropdownIndex];
        const alreadyInDropdown = xRayDropdownSelectedItems.find(item => item.id === selectedItem.id);
        const alreadyInBill = billItems.find(billItem => billItem.id === selectedItem.id.toString());
        
        if (!alreadyInDropdown && !alreadyInBill) {
          handleXRayDropdownSelect(selectedItem.id.toString());
        }
      } else {
        setIsXRayDropdownOpen(!isXRayDropdownOpen);
      }
    } else if (e.key === 'Escape') {
      setIsXRayDropdownOpen(false);
      setXRayHighlightedDropdownIndex(-1);
      setXRayDropdownFilterQuery('');
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\s]/)) {
      // Filter as user types
      const newFilter = xRayDropdownFilterQuery + e.key.toLowerCase();
      setXRayDropdownFilterQuery(newFilter);
      setXRayHighlightedDropdownIndex(0);
      setIsXRayDropdownOpen(true);
    } else if (e.key === 'Backspace') {
      if (xRayDropdownFilterQuery.length > 0) {
        setXRayDropdownFilterQuery(prev => prev.slice(0, -1));
        setXRayHighlightedDropdownIndex(0);
      }
    }
  };

  const getXRayFilteredDropdownItems = () => {
    if (!xRayDropdownFilterQuery) return categoryItems;
    
    const query = xRayDropdownFilterQuery.toLowerCase();
    const filtered = categoryItems.filter((item: MedicalItem) => 
      item.name.toLowerCase().includes(query)
    );
    
    // Sort by relevance: exact matches first, then starts with, then contains
    return filtered.sort((a: MedicalItem, b: MedicalItem) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match comes first
      if (aName === query) return -1;
      if (bName === query) return 1;
      
      // Starts with query comes second
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
      
      // Both start with or both contain - sort alphabetically
      return aName.localeCompare(bName);
    });
  };

  const handleXRayDropdownSelect = (itemId: string) => {
    const selectedItem = categoryItems.find(item => item.id.toString() === itemId);
    if (!selectedItem) return;
    
    const alreadyInDropdown = xRayDropdownSelectedItems.find(item => item.id === selectedItem.id);
    const alreadyInBill = billItems.find(billItem => billItem.id === selectedItem.id.toString());
    
    if (!alreadyInDropdown && !alreadyInBill) {
      setXRayDropdownSelectedItems(prev => [...prev, selectedItem]);
      // Reset filter after selection for fresh search
      setXRayDropdownFilterQuery('');
      setXRayHighlightedDropdownIndex(-1);
      
      // Keep dropdown open and maintain focus for multiple selections
      setTimeout(() => {
        if (xRayDropdownButtonRef.current) {
          xRayDropdownButtonRef.current.focus();
        }
      }, 0);
    }
  };

  const addXRayDropdownSelectedItemsToBill = () => {
    if (xRayDropdownSelectedItems.length === 0) return;

    // For each selected X-Ray item, trigger view selection
    if (xRayDropdownSelectedItems.length === 1) {
      const item = xRayDropdownSelectedItems[0];
      setSelectedXRayForViews(item);
      setShowXRayViewSelection(true);
      setXRayDropdownSelectedItems([]);
      setIsXRayDropdownOpen(false);
    } else {
      // Handle multiple X-Ray selections - add first one for view selection
      const firstItem = xRayDropdownSelectedItems[0];
      setSelectedXRayForViews(firstItem);
      setShowXRayViewSelection(true);
      // Keep the rest for later processing
      setXRayDropdownSelectedItems(prev => prev.slice(1));
    }
  };

  // X-Ray functionality
  const handleXRayItemSelection = (item: MedicalItem) => {
    setSelectedXRayForViews(item);
    setXRayViews({ AP: false, LAT: false, OBLIQUE: false, BOTH: false });
    setIsOffChargePortable(false);
    setShowXRayViewSelection(true);
  };

  const handleXRayViewChange = (view: string, checked: boolean) => {
    if (view === 'BOTH') {
      setXRayViews({
        AP: false,
        LAT: false,
        OBLIQUE: false,
        BOTH: checked
      });
    } else {
      setXRayViews(prev => ({
        ...prev,
        [view]: checked,
        BOTH: false
      }));
    }
  };



  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Inpatient Bill Calculator</h1>
          <p className="text-muted-foreground">Calculate comprehensive inpatient medical bills with daily rates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information Panel */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle 
                  className="flex items-center justify-between text-medical-primary cursor-pointer"
                  onClick={() => setIsPatientInfoExpanded(!isPatientInfoExpanded)}
                >
                  <div className="flex items-center">
                    <Calculator className="mr-2 h-5 w-5" />
                    Patient Information
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientType('MW/FW');
                          setTypeChangeIndicator(true);
                          setTimeout(() => setTypeChangeIndicator(false), 1000);
                        }}
                        className={`text-sm cursor-pointer transition-colors ${
                          selectedPatientType === 'MW/FW' 
                            ? 'text-medical-primary font-semibold' 
                            : 'text-muted-foreground hover:text-medical-primary'
                        }`}
                      >
                        MW/FW
                      </span>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientType('OB');
                          setTypeChangeIndicator(true);
                          setTimeout(() => setTypeChangeIndicator(false), 1000);
                        }}
                        className={`text-sm cursor-pointer transition-colors ${
                          selectedPatientType === 'OB' 
                            ? 'text-medical-primary font-semibold' 
                            : 'text-muted-foreground hover:text-medical-primary'
                        }`}
                      >
                        OB
                      </span>
                    </div>
                    <div className="flex items-center">
                      {isPatientInfoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              {isPatientInfoExpanded && (
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="patientName" className="text-xs text-foreground font-medium">Patient Name</Label>
                      <Input
                        id="patientName"
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter patient name"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="opdNumber" className="text-xs text-foreground font-medium">OPD Number</Label>
                      <Input
                        id="opdNumber"
                        type="text"
                        value={opdNumber}
                        onChange={(e) => setOpdNumber(e.target.value)}
                        placeholder="Enter OPD number"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="hospitalNumber" className="text-xs text-foreground font-medium">Hospital Number</Label>
                      <Input
                        id="hospitalNumber"
                        type="text"
                        value={hospitalNumber}
                        onChange={(e) => setHospitalNumber(e.target.value)}
                        placeholder="Enter hospital number"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="billNumber" className="text-xs text-foreground font-medium">Bill Number</Label>
                      <Input
                        id="billNumber"
                        type="text"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        placeholder="Enter bill number"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="admissionDate" className="text-xs text-foreground font-medium">Admission Date</Label>
                      <Button
                        variant="outline"
                        className="w-full h-8 text-left justify-start p-2"
                        onClick={() => {
                          setCupertinoDatePickerType('admission');
                          setShowCupertinoDatePicker(true);
                        }}
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        <span className="text-xs">{admissionDate} at {admissionTime}</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="dischargeDate" className="text-xs text-foreground font-medium">Discharge Date</Label>
                      <Button
                        variant="outline"
                        className="w-full h-8 text-left justify-start p-2"
                        onClick={() => {
                          setCupertinoDatePickerType('discharge');
                          setShowCupertinoDatePicker(true);
                        }}
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        <span className="text-xs">{dischargeDate} at {dischargeTime}</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Total Visitation Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="totalVisitation" className="text-xs text-foreground font-medium">Total Visitation:</Label>
                      <Input
                        id="totalVisitation"
                        type="text"
                        value={totalVisitation}
                        onChange={(e) => setTotalVisitation(e.target.value)}
                        placeholder="Enter total visitation"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground font-medium">Total Days Admitted</Label>
                      <div className="h-8 px-3 py-2 bg-muted/50 border border-border rounded-md flex items-center">
                        <span className="text-sm font-semibold text-medical-primary">
                          {daysAdmitted} {daysAdmitted === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Category Buttons */}
            <Card className="glass-card relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-medical-primary">
                  <span className="flex items-center">
                    <Grid3X3 className="mr-2 h-5 w-5" />
                    Inpatient Categories
                  </span>
                  {selectedPatientType && (
                    <button
                      onClick={() => {
                        setSelectedPatientType(selectedPatientType === 'MW/FW' ? 'OB' : 'MW/FW');
                        setTypeChangeIndicator(true);
                        setTimeout(() => setTypeChangeIndicator(false), 1000);
                      }}
                      className={`text-sm px-2 py-1 rounded transition-all duration-300 ${
                        typeChangeIndicator 
                          ? 'text-medical-primary bg-medical-primary/20 scale-105' 
                          : 'text-medical-primary/60 hover:text-medical-primary hover:bg-medical-primary/10'
                      }`}
                      title="Click to toggle between MW/FW and OB"
                    >
                      Admission Type {typeChangeIndicator && '✓'}
                    </button>
                  )}
                  {isCarouselMode && (
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        Use ← → keys to navigate
                      </div>
                      <Button 
                        size="sm" 
                        variant="medical-ghost" 
                        onClick={exitCarousel}
                        className="h-8 w-8 p-0"
                        title="Exit carousel (Esc key)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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
                          className="h-auto p-2 sm:p-3 text-left justify-start min-h-[60px] max-w-full"
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div className="flex flex-col items-start w-full overflow-hidden">
                            <span className="font-medium text-xs leading-tight w-full break-words hyphens-auto line-clamp-2">{category}</span>
                            <span className="text-xs text-muted-foreground mt-1 flex-shrink-0">{itemCount} items</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  // Carousel mode with preview buttons - mobile-optimized layout
                  <div 
                    ref={swipeRef}
                    className="w-full px-2 sm:px-0 relative select-none cursor-grab active:cursor-grabbing"
                    style={{ 
                      touchAction: 'pan-y',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      minHeight: '80px'
                    }}
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
                        title="Previous category (← key)"
                      >
                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      {/* Current selected category - centered and responsive */}
                      <Button
                        variant="outline"
                        className="h-auto p-2 sm:p-3 text-center flex-1 min-w-0 max-w-[160px] sm:max-w-[200px] border-medical-primary/20 text-medical-primary hover:bg-medical-primary/10"
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
                        title="Next category (→ key)"
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

            {/* Category Content - Only show in carousel mode */}
            {isCarouselMode && selectedCategory && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-medical-primary">
                    <Search className="mr-2 h-5 w-5" />
                    {selectedCategory} Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Laboratory', 'Orthopedic, S.Roll, etc.', 'Surgery', 'Procedures'].includes(selectedCategory) ? (
                    <div className="space-y-4">
                      {/* Dynamic selected items based on category */}
                      {(() => {
                        const getSelectedItems = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return selectedLabItems;
                            case 'Orthopedic, S.Roll, etc.': return selectedOrthopedicItems;
                            case 'Surgery': return selectedSurgeryItems;
                            case 'Procedures': return selectedProceduresItems;
                            default: return [];
                          }
                        };
                        
                        const getRemoveItemFunction = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return removeLabItem;
                            case 'Orthopedic, S.Roll, etc.': return (id: number) => setSelectedOrthopedicItems(prev => prev.filter(item => item.id !== id));
                            case 'Surgery': return (id: number) => setSelectedSurgeryItems(prev => prev.filter(item => item.id !== id));
                            case 'Procedures': return (id: number) => setSelectedProceduresItems(prev => prev.filter(item => item.id !== id));
                            default: return () => {};
                          }
                        };
                        
                        const getAddToBillFunction = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return addSelectedLabItemsToBill;
                            case 'Orthopedic, S.Roll, etc.': return () => {
                              const items = [...selectedOrthopedicItems];
                              setSelectedOrthopedicItems([]);
                              setCategorySearchQuery('');
                              items.forEach(item => {
                                const billId = `${sessionId}-${Date.now()}-${Math.random()}`;
                                addItemToBill({ id: billId, ...item, billId });
                              });
                              toast({ title: "Items Added", description: `${items.length} item${items.length !== 1 ? 's' : ''} added to bill` });
                            };
                            case 'Surgery': return () => {
                              const items = [...selectedSurgeryItems];
                              setSelectedSurgeryItems([]);
                              setCategorySearchQuery('');
                              items.forEach(item => {
                                const billId = `${sessionId}-${Date.now()}-${Math.random()}`;
                                addItemToBill({ id: billId, ...item, billId });
                              });
                              toast({ title: "Items Added", description: `${items.length} item${items.length !== 1 ? 's' : ''} added to bill` });
                            };
                            case 'Procedures': return () => {
                              const items = [...selectedProceduresItems];
                              setSelectedProceduresItems([]);
                              setCategorySearchQuery('');
                              items.forEach(item => {
                                const billId = `${sessionId}-${Date.now()}-${Math.random()}`;
                                addItemToBill({ id: billId, ...item, billId });
                              });
                              toast({ title: "Items Added", description: `${items.length} item${items.length !== 1 ? 's' : ''} added to bill` });
                            };
                            default: return () => {};
                          }
                        };
                        
                        const selectedItems = getSelectedItems();
                        const removeItemFn = getRemoveItemFunction();
                        const addToBillFn = getAddToBillFunction();
                        
                        const getItemTypeName = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return 'Test';
                            case 'Orthopedic, S.Roll, etc.': return 'Item';
                            case 'Surgery': return 'Procedure';
                            case 'Procedures': return 'Procedure';
                            default: return 'Item';
                          }
                        };
                        
                        return selectedItems.length > 0 ? (
                          <div className="space-y-2">
                            {/* Selected items tags */}
                            <div className="flex flex-wrap gap-1 p-2 bg-muted/20 rounded-md">
                              {selectedItems.map((item) => (
                                <div key={item.id} className="inline-flex items-center bg-medical-primary/10 text-medical-primary px-2 py-1 rounded text-xs">
                                  <span className="mr-1">{item.name}</span>
                                  <button
                                    onClick={() => removeItemFn(item.id)}
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
                                  Total Price: {format(selectedItems.reduce((sum, item) => sum + parseFloat(item.price), 0))}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <Button 
                                onClick={addToBillFn} 
                                variant="outline"
                                className="border-medical-primary/20 text-medical-primary hover:bg-medical-primary/10"
                              >
                                Add {selectedItems.length} {getItemTypeName()}{selectedItems.length !== 1 ? 's' : ''} to Bill
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      <div className="space-y-2">
                        {(() => {
                          const getSearchInputRef = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return searchInputRef;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicSearchInputRef;
                              case 'Surgery': return surgerySearchInputRef;
                              case 'Procedures': return proceduresSearchInputRef;
                              default: return searchInputRef;
                            }
                          };
                          
                          const getPlaceholder = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return "Type lab test name and press comma or enter to add...";
                              case 'Orthopedic, S.Roll, etc.': return "Type orthopedic item name and press comma or enter to add...";
                              case 'Surgery': return "Type surgery name and press comma or enter to add...";
                              case 'Procedures': return "Type procedure name and press comma or enter to add...";
                              default: return "Type item name and press comma or enter to add...";
                            }
                          };
                          
                          const getDropdownSelectedItems = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return dropdownSelectedItems;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicDropdownSelectedItems;
                              case 'Surgery': return surgeryDropdownSelectedItems;
                              case 'Procedures': return proceduresDropdownSelectedItems;
                              default: return [];
                            }
                          };
                          
                          const setDropdownSelectedItemsFn = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return setDropdownSelectedItems;
                              case 'Orthopedic, S.Roll, etc.': return setOrthopedicDropdownSelectedItems;
                              case 'Surgery': return setSurgeryDropdownSelectedItems;
                              case 'Procedures': return setProceduresDropdownSelectedItems;
                              default: return () => {};
                            }
                          };
                          
                          const getKeyDownHandler = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return handleLabSearchKeyDown;
                              case 'Orthopedic, S.Roll, etc.': return (e: any) => handleSearchKeyDown(e, selectedOrthopedicItems, setSelectedOrthopedicItems, orthopedicSearchSuggestions, orthopedicHighlightedSearchIndex, setOrthopedicHighlightedSearchIndex);
                              case 'Surgery': return (e: any) => handleSearchKeyDown(e, selectedSurgeryItems, setSelectedSurgeryItems, surgerySearchSuggestions, surgeryHighlightedSearchIndex, setSurgeryHighlightedSearchIndex);
                              case 'Procedures': return (e: any) => handleSearchKeyDown(e, selectedProceduresItems, setSelectedProceduresItems, proceduresSearchSuggestions, proceduresHighlightedSearchIndex, setProceduresHighlightedSearchIndex);
                              default: return () => {};
                            }
                          };
                          
                          const getSuggestions = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return getLabSuggestions();
                              case 'Orthopedic, S.Roll, etc.': return orthopedicSearchSuggestions;
                              case 'Surgery': return surgerySearchSuggestions;
                              case 'Procedures': return proceduresSearchSuggestions;
                              default: return [];
                            }
                          };
                          
                          const getSelectedItems = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return selectedLabItems;
                              case 'Orthopedic, S.Roll, etc.': return selectedOrthopedicItems;
                              case 'Surgery': return selectedSurgeryItems;
                              case 'Procedures': return selectedProceduresItems;
                              default: return [];
                            }
                          };
                          
                          const setSelectedItemsFn = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return setSelectedLabItems;
                              case 'Orthopedic, S.Roll, etc.': return setSelectedOrthopedicItems;
                              case 'Surgery': return setSelectedSurgeryItems;
                              case 'Procedures': return setSelectedProceduresItems;
                              default: return () => {};
                            }
                          };
                          
                          const getItemTypeName = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return 'tests';
                              case 'Orthopedic, S.Roll, etc.': return 'items';
                              case 'Surgery': return 'procedures';
                              case 'Procedures': return 'procedures';
                              default: return 'items';
                            }
                          };
                          
                          return (
                            <>
                              <Input
                                ref={getSearchInputRef()}
                                placeholder={getPlaceholder()}
                                value={categorySearchQuery}
                                onChange={(e) => {
                                  setCategorySearchQuery(e.target.value);
                                  // Clear dropdown selections when switching to search
                                  if (e.target.value.trim()) {
                                    setDropdownSelectedItemsFn()([]);
                                  }
                                }}
                                onKeyDown={getKeyDownHandler()}
                                className="w-full"
                              />
                              
                              {/* Search suggestions appear right below search input */}
                              {categorySearchQuery && getSuggestions().length > 0 && (
                                <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2 bg-muted/10">
                                  <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Matching {getItemTypeName()} (press comma to add):
                                  </div>
                                  {getSuggestions().slice(0, 5).map((item: MedicalItem, index) => {
                                    const selectedItems = getSelectedItems();
                                    const alreadyInSearch = selectedItems.find(selected => selected.id === item.id);
                                    const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                    
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
                                           const selectedItems = getSelectedItems();
                                           const alreadyInSearch = selectedItems.find(selected => selected.id === item.id);
                                           const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                           
                                           if (!alreadyInSearch && !alreadyInBill) {
                                             setSelectedItemsFn()(prev => [...prev, item]);
                                           }
                                           setCategorySearchQuery('');
                                           // Refocus search input after clicking suggestion
                                           setTimeout(() => {
                                             const inputRef = getSearchInputRef();
                                             if (inputRef.current) {
                                               inputRef.current.focus();
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
                            </>
                          );
                        })()}
                      </div>

                      {/* Dynamic Dropdown selected items as tags */}
                      {(() => {
                        const getDropdownSelectedItems = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return dropdownSelectedItems;
                            case 'Orthopedic, S.Roll, etc.': return orthopedicDropdownSelectedItems;
                            case 'Surgery': return surgeryDropdownSelectedItems;
                            case 'Procedures': return proceduresDropdownSelectedItems;
                            default: return [];
                          }
                        };
                        
                        const getRemoveDropdownItemFn = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return removeDropdownItem;
                            case 'Orthopedic, S.Roll, etc.': return (id: number) => setOrthopedicDropdownSelectedItems(prev => prev.filter(item => item.id !== id));
                            case 'Surgery': return (id: number) => setSurgeryDropdownSelectedItems(prev => prev.filter(item => item.id !== id));
                            case 'Procedures': return (id: number) => setProceduresDropdownSelectedItems(prev => prev.filter(item => item.id !== id));
                            default: return () => {};
                          }
                        };
                        
                        const getAddDropdownToBillFn = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return addDropdownSelectedItemsToBill;
                            case 'Orthopedic, S.Roll, etc.': return () => {
                              const items = [...orthopedicDropdownSelectedItems];
                              setOrthopedicDropdownSelectedItems([]);
                              items.forEach(item => {
                                const billId = `${sessionId}-${Date.now()}-${Math.random()}`;
                                addItemToBill({ id: billId, ...item, billId });
                              });
                              toast({ title: "Items Added", description: `${items.length} item${items.length !== 1 ? 's' : ''} added to bill` });
                            };
                            case 'Surgery': return () => {
                              const items = [...surgeryDropdownSelectedItems];
                              setSurgeryDropdownSelectedItems([]);
                              items.forEach(item => {
                                const billId = `${sessionId}-${Date.now()}-${Math.random()}`;
                                addItemToBill({ id: billId, ...item, billId });
                              });
                              toast({ title: "Items Added", description: `${items.length} item${items.length !== 1 ? 's' : ''} added to bill` });
                            };
                            case 'Procedures': return () => {
                              const items = [...proceduresDropdownSelectedItems];
                              setProceduresDropdownSelectedItems([]);
                              items.forEach(item => {
                                const billId = `${sessionId}-${Date.now()}-${Math.random()}`;
                                addItemToBill({ id: billId, ...item, billId });
                              });
                              toast({ title: "Items Added", description: `${items.length} item${items.length !== 1 ? 's' : ''} added to bill` });
                            };
                            default: return () => {};
                          }
                        };
                        
                        const getItemTypeName = () => {
                          switch (selectedCategory) {
                            case 'Laboratory': return 'Test';
                            case 'Orthopedic, S.Roll, etc.': return 'Item';
                            case 'Surgery': return 'Procedure';
                            case 'Procedures': return 'Procedure';
                            default: return 'Item';
                          }
                        };
                        
                        const dropdownItems = getDropdownSelectedItems();
                        const removeDropdownItemFn = getRemoveDropdownItemFn();
                        const addDropdownToBillFn = getAddDropdownToBillFn();
                        
                        return dropdownItems.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1 p-2 bg-muted/20 rounded-md">
                              {dropdownItems.map((item) => (
                                <div key={item.id} className="inline-flex items-center bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs">
                                  <span className="mr-1">{item.name}</span>
                                  <button
                                    onClick={() => removeDropdownItemFn(item.id)}
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
                                  Total Price: {format(dropdownItems.reduce((sum, item) => sum + parseFloat(item.price), 0))}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {dropdownItems.length} item{dropdownItems.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <Button 
                                onClick={addDropdownToBillFn} 
                                variant="outline"
                                className="border-blue-500/20 text-blue-600 hover:bg-blue-500/10"
                              >
                                Add {dropdownItems.length} {getItemTypeName()}{dropdownItems.length !== 1 ? 's' : ''} to Bill
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      
                      {/* Dynamic Separate Dropdown Selection */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          Alternative: Select from dropdown
                        </div>
                        {(() => {
                          const getDropdownRef = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return dropdownRef;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicDropdownRef;
                              case 'Surgery': return surgeryDropdownRef;
                              case 'Procedures': return proceduresDropdownRef;
                              default: return dropdownRef;
                            }
                          };
                          
                          const getDropdownButtonRef = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return dropdownButtonRef;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicDropdownButtonRef;
                              case 'Surgery': return surgeryDropdownButtonRef;
                              case 'Procedures': return proceduresDropdownButtonRef;
                              default: return dropdownButtonRef;
                            }
                          };
                          
                          const getIsDropdownOpen = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return isDropdownOpen;
                              case 'Orthopedic, S.Roll, etc.': return isOrthopedicDropdownOpen;
                              case 'Surgery': return isSurgeryDropdownOpen;
                              case 'Procedures': return isProceduresDropdownOpen;
                              default: return false;
                            }
                          };
                          
                          const setIsDropdownOpenFn = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return setIsDropdownOpen;
                              case 'Orthopedic, S.Roll, etc.': return setIsOrthopedicDropdownOpen;
                              case 'Surgery': return setIsSurgeryDropdownOpen;
                              case 'Procedures': return setIsProceduresDropdownOpen;
                              default: return () => {};
                            }
                          };
                          
                          const getHighlightedDropdownIndex = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return highlightedDropdownIndex;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicHighlightedDropdownIndex;
                              case 'Surgery': return surgeryHighlightedDropdownIndex;
                              case 'Procedures': return proceduresHighlightedDropdownIndex;
                              default: return -1;
                            }
                          };
                          
                          const setHighlightedDropdownIndexFn = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return setHighlightedDropdownIndex;
                              case 'Orthopedic, S.Roll, etc.': return setOrthopedicHighlightedDropdownIndex;
                              case 'Surgery': return setSurgeryHighlightedDropdownIndex;
                              case 'Procedures': return setProceduresHighlightedDropdownIndex;
                              default: return () => {};
                            }
                          };
                          
                          const getDropdownFilterQuery = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return dropdownFilterQuery;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicDropdownFilterQuery;
                              case 'Surgery': return surgeryDropdownFilterQuery;
                              case 'Procedures': return proceduresDropdownFilterQuery;
                              default: return '';
                            }
                          };
                          
                          const getFilteredDropdownItemsFn = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return getFilteredDropdownItems();
                              case 'Orthopedic, S.Roll, etc.': return categoryItems; // Simple filtering for new categories
                              case 'Surgery': return categoryItems;
                              case 'Procedures': return categoryItems;
                              default: return [];
                            }
                          };
                          
                          const getDropdownSelectedItems = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return dropdownSelectedItems;
                              case 'Orthopedic, S.Roll, etc.': return orthopedicDropdownSelectedItems;
                              case 'Surgery': return surgeryDropdownSelectedItems;
                              case 'Procedures': return proceduresDropdownSelectedItems;
                              default: return [];
                            }
                          };
                          
                          const getHandleDropdownSelect = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return handleDropdownSelect;
                              case 'Orthopedic, S.Roll, etc.': return (itemId: string) => {
                                const item = categoryItems.find(item => item.id.toString() === itemId);
                                if (item) {
                                  const alreadySelected = orthopedicDropdownSelectedItems.find(selected => selected.id === item.id);
                                  const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                  if (!alreadySelected && !alreadyInBill) {
                                    setOrthopedicDropdownSelectedItems(prev => [...prev, item]);
                                  }
                                }
                              };
                              case 'Surgery': return (itemId: string) => {
                                const item = categoryItems.find(item => item.id.toString() === itemId);
                                if (item) {
                                  const alreadySelected = surgeryDropdownSelectedItems.find(selected => selected.id === item.id);
                                  const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                  if (!alreadySelected && !alreadyInBill) {
                                    setSurgeryDropdownSelectedItems(prev => [...prev, item]);
                                  }
                                }
                              };
                              case 'Procedures': return (itemId: string) => {
                                const item = categoryItems.find(item => item.id.toString() === itemId);
                                if (item) {
                                  const alreadySelected = proceduresDropdownSelectedItems.find(selected => selected.id === item.id);
                                  const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                  if (!alreadySelected && !alreadyInBill) {
                                    setProceduresDropdownSelectedItems(prev => [...prev, item]);
                                  }
                                }
                              };
                              default: return () => {};
                            }
                          };
                          
                          const getPlaceholderText = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return 'Select lab test from dropdown... (Type to filter)';
                              case 'Orthopedic, S.Roll, etc.': return 'Select orthopedic item from dropdown... (Type to filter)';
                              case 'Surgery': return 'Select surgery from dropdown... (Type to filter)';
                              case 'Procedures': return 'Select procedure from dropdown... (Type to filter)';
                              default: return 'Select item from dropdown... (Type to filter)';
                            }
                          };
                          
                          const getItemTypeName = () => {
                            switch (selectedCategory) {
                              case 'Laboratory': return 'lab tests';
                              case 'Orthopedic, S.Roll, etc.': return 'orthopedic items';
                              case 'Surgery': return 'surgeries';
                              case 'Procedures': return 'procedures';
                              default: return 'items';
                            }
                          };
                          
                          const isDropdownOpenValue = getIsDropdownOpen();
                          const setIsDropdownOpenValue = setIsDropdownOpenFn();
                          const highlightedDropdownIndexValue = getHighlightedDropdownIndex();
                          const setHighlightedDropdownIndexValue = setHighlightedDropdownIndexFn();
                          const dropdownFilterQueryValue = getDropdownFilterQuery();
                          const filteredDropdownItems = getFilteredDropdownItemsFn();
                          const dropdownSelectedItemsValue = getDropdownSelectedItems();
                          const handleDropdownSelectValue = getHandleDropdownSelect();
                          
                          return (
                            <div className="relative" ref={getDropdownRef()}>
                              <button
                                ref={getDropdownButtonRef()}
                                type="button"
                                onClick={() => {
                                  setIsDropdownOpenValue(!isDropdownOpenValue);
                                  setHighlightedDropdownIndexValue(-1);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-md bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-medical-primary focus:ring-offset-2"
                              >
                                <span className="text-sm text-muted-foreground">
                                  {dropdownFilterQueryValue ? `Filtering: "${dropdownFilterQueryValue}" (${filteredDropdownItems.length} matches)` : getPlaceholderText()}
                                </span>
                                <ChevronRight className={`h-4 w-4 transition-transform ${isDropdownOpenValue ? 'rotate-90' : ''}`} />
                              </button>
                              
                              {isDropdownOpenValue && (
                                <div 
                                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                                >
                                  {filteredDropdownItems.map((item: MedicalItem, index) => (
                                    <div
                                      key={item.id}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleDropdownSelectValue(item.id.toString());
                                      }}
                                      className={`px-3 py-2 text-sm flex items-center justify-between ${
                                        index === highlightedDropdownIndexValue 
                                          ? 'bg-medical-primary/10 border-l-4 border-medical-primary' 
                                          : ''
                                      } ${
                                        dropdownSelectedItemsValue.find(selected => selected.id === item.id)
                                          ? 'bg-blue-500/10 text-blue-600'
                                          : billItems.find(billItem => billItem.id === item.id.toString())
                                            ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                            : 'cursor-pointer hover:bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <span>{item.name}</span>
                                        {dropdownSelectedItemsValue.find(selected => selected.id === item.id) && (
                                          <span className="ml-2 text-blue-600 text-xs">✓ Selected</span>
                                        )}
                                        {billItems.find(billItem => billItem.id === item.id.toString()) && !dropdownSelectedItemsValue.find(selected => selected.id === item.id) && (
                                          <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                        )}
                                        {index === highlightedDropdownIndexValue && (
                                          <span className="ml-2 text-medical-primary text-xs">← Highlighted</span>
                                        )}
                                      </div>
                                      <span className="text-medical-primary font-semibold">
                                        {format(item.price)}
                                      </span>
                                    </div>
                                  ))}
                                  {filteredDropdownItems.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                      No {getItemTypeName()} available
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                  ) : selectedCategory === 'X-Ray' ? (
                    <div className="space-y-4">
                      {/* Selected X-Ray items, price counter and Add to Bill button above search */}
                      {selectedXRayItems.length > 0 && (
                        <div className="space-y-2">
                          {/* Selected items tags */}
                          <div className="flex flex-wrap gap-1 p-2 bg-muted/20 rounded-md">
                            {selectedXRayItems.map((item) => (
                              <div key={item.id} className="inline-flex items-center bg-medical-primary/10 text-medical-primary px-2 py-1 rounded text-xs">
                                <span className="mr-1">{item.name}</span>
                                <button
                                  onClick={() => removeXRayItem(item.id)}
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
                                Total Price: {format(selectedXRayItems.reduce((sum, item) => sum + parseFloat(item.price), 0))}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {selectedXRayItems.length} item{selectedXRayItems.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <Button 
                              onClick={addSelectedXRayItemsToBill} 
                              variant="outline"
                              className="border-medical-primary/20 text-medical-primary hover:bg-medical-primary/10"
                            >
                              Add {selectedXRayItems.length} X-Ray{selectedXRayItems.length !== 1 ? 's' : ''} to Bill
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Input
                          ref={xRaySearchInputRef}
                          placeholder="Type X-ray name and press comma or enter to add..."
                          value={categorySearchQuery}
                          onChange={(e) => {
                            setCategorySearchQuery(e.target.value);
                            if (e.target.value.trim()) {
                              setXRayDropdownSelectedItems([]);
                            }
                          }}
                          onKeyDown={handleXRaySearchKeyDown}
                          className="w-full"
                        />
                        
                        {/* Search suggestions appear right below search input */}
                        {categorySearchQuery && getXRaySuggestions().length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2 bg-muted/10">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Matching X-rays (press comma to add):
                            </div>
                            {getXRaySuggestions().slice(0, 5).map((item: MedicalItem, index) => {
                              const alreadyInSearch = selectedXRayItems.find(selected => selected.id === item.id);
                              const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                              
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
                                     const alreadyInSearch = selectedXRayItems.find(selected => selected.id === item.id);
                                     const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                     
                                     if (!alreadyInSearch && !alreadyInBill) {
                                       handleXRayItemSelect(item);
                                     }
                                     setCategorySearchQuery('');
                                     setTimeout(() => {
                                       if (xRaySearchInputRef.current) {
                                         xRaySearchInputRef.current.focus();
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

                      {/* X-Ray View Selection Modal */}
                      {showXRayViewSelection && selectedXRayForViews && (
                        <div className="space-y-4 p-4 bg-muted/20 rounded-md border">
                          <div className="font-medium">Select views for {selectedXRayForViews.name}</div>
                          <div className="grid grid-cols-2 gap-2">
                            {['AP', 'LAT', 'OBLIQUE', 'BOTH'].map((view) => (
                              <label key={view} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={xRayViews[view as keyof typeof xRayViews]}
                                  onChange={(e) => handleXRayViewChange(view, e.target.checked)}
                                />
                                <span className="text-sm">{view === 'BOTH' ? 'AP and LAT' : view}</span>
                              </label>
                            ))}
                          </div>
                          {Object.values(xRayViews).some(checked => checked) && (
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isOffChargePortable}
                                onChange={(e) => setIsOffChargePortable(e.target.checked)}
                              />
                              <span className="text-sm">Off-Charge/Portable</span>
                            </label>
                          )}
                          <div className="flex space-x-2">
                            <Button onClick={addXRayToBill} size="sm" variant="medical">
                              Add to Bill
                            </Button>
                            <Button onClick={() => setShowXRayViewSelection(false)} size="sm" variant="outline">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Dropdown selected items as tags */}
                      {xRayDropdownSelectedItems.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1 p-2 bg-muted/20 rounded-md">
                            {xRayDropdownSelectedItems.map((item) => (
                              <div key={item.id} className="inline-flex items-center bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs">
                                <span className="mr-1">{item.name}</span>
                                <button
                                  onClick={() => removeXRayDropdownItem(item.id)}
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
                                Total Price: {format(xRayDropdownSelectedItems.reduce((sum, item) => sum + parseFloat(item.price), 0))}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {xRayDropdownSelectedItems.length} item{xRayDropdownSelectedItems.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <Button 
                              onClick={addXRayDropdownSelectedItemsToBill} 
                              variant="outline"
                              className="border-blue-500/20 text-blue-600 hover:bg-blue-500/10"
                            >
                              Add {xRayDropdownSelectedItems.length} X-Ray{xRayDropdownSelectedItems.length !== 1 ? 's' : ''} to Bill
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div ref={xRayDropdownRef} className="relative">
                          <button
                            ref={xRayDropdownButtonRef}
                            onClick={() => setIsXRayDropdownOpen(!isXRayDropdownOpen)}
                            onKeyDown={handleXRayDropdownKeyDown}
                            className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-primary/20 hover:bg-muted/50"
                          >
                            <span className="text-sm text-muted-foreground">
                              {xRayDropdownFilterQuery 
                                ? `Filter: "${xRayDropdownFilterQuery}" (${getXRayFilteredDropdownItems().length} matches)`
                                : 'X-Ray Dropdown - Type to filter, arrows to navigate'
                              }
                            </span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isXRayDropdownOpen ? 'rotate-90' : ''}`} />
                          </button>
                          
                          {/* Dropdown content */}
                          {isXRayDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {getXRayFilteredDropdownItems().map((item: MedicalItem, index) => {
                                const alreadyInDropdown = xRayDropdownSelectedItems.find(selected => selected.id === item.id);
                                const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                const isHighlighted = index === xRayHighlightedDropdownIndex;
                                
                                return (
                                <div
                                  key={item.id}
                                  className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/40 ${
                                    isHighlighted ? 'bg-medical-primary/10 border-l-2 border-medical-primary' : ''
                                  } ${
                                    alreadyInBill ? 'bg-red-50 text-red-600 cursor-not-allowed' : ''
                                  } ${
                                    alreadyInDropdown ? 'bg-green-50 text-green-600' : ''
                                  }`}
                                  onClick={() => {
                                    if (!alreadyInDropdown && !alreadyInBill) {
                                      handleXRayDropdownSelect(item.id.toString());
                                    }
                                  }}
                                >
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{item.name}</span>
                                    {alreadyInBill && (
                                      <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                    )}
                                    {alreadyInDropdown && !alreadyInBill && (
                                      <span className="ml-2 text-green-600 text-xs">✓ Selected</span>
                                    )}
                                    {isHighlighted && (
                                      <span className="ml-2 text-medical-primary text-xs">← Highlighted</span>
                                    )}
                                  </div>
                                  <span className="text-medical-primary font-semibold">
                                    {format(item.price)}
                                  </span>
                                </div>
                                );
                              })}
                              {getXRayFilteredDropdownItems().length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No X-Ray items available
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
                  ) : selectedCategory === 'Discharge Medicine' ? (
                    <div className="space-y-4">
                      {/* Compact Selected Medicines Display - positioned below Discharge Medicine label */}
                      {tempSelectedMedicines.length > 0 && (
                        <div className="medicine-dosage-card p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-medical-primary flex items-center">
                              <Calculator className="h-4 w-4 mr-2" />
                              Selected: {tempSelectedMedicines.length} medicines
                            </span>
                            <span className="text-sm font-bold text-medical-primary bg-medical-primary/10 px-2 py-1 rounded-md">
                              {format(tempSelectedMedicines.reduce((sum, medicine) => sum + parseFloat(medicine.price), 0))}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {tempSelectedMedicines.map((medicine, index) => (
                              <div key={medicine.tempId} className="medicine-item-card flex items-center justify-between text-sm p-2 rounded-lg">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <span className="text-xs font-bold text-medical-primary bg-medical-primary/10 px-2 py-1 rounded-md flex-shrink-0">
                                    #{index + 1}
                                  </span>
                                  <span className="font-medium text-foreground truncate">
                                    {medicine.name.length > 25 ? `${medicine.name.substring(0, 25)}...` : medicine.name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <span className="text-medical-primary font-semibold bg-medical-primary/10 px-2 py-1 rounded">
                                    {format(parseFloat(medicine.price))}
                                  </span>
                                  <button
                                    onClick={() => editTempMedicine(medicine)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors"
                                    title="Edit medicine dosage"
                                  >
                                    <Calculator className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => removeTempMedicine(medicine.tempId)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                    title="Remove medicine"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-medical-primary/20 flex justify-end">
                            <Button
                              onClick={addAllTempMedicinesToBill}
                              variant="medical"
                              size="sm"
                              className="text-xs font-medium shadow-md hover:shadow-lg transition-shadow px-3 py-1"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add to Bill
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Medicine Dosage Selection Interface */}
                      {showMedicineDosageSelection && selectedMedicineForDosage && (
                        <div className="medicine-dosage-card mt-6 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-medical-primary flex items-center">
                              <Calculator className="h-5 w-5 mr-2" />
                              Set Dosage for: {selectedMedicineForDosage.name}
                            </h3>
                            <Button
                              onClick={cancelMedicineDosageSelection}
                              variant="medical-ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-medical-primary"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {/* Ward Medicine vs Discharge Medicine selection */}
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-foreground">Medicine Type</label>
                              <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name="medicineType"
                                    value="discharge"
                                    checked={medicineType === 'discharge'}
                                    onChange={(e) => setMedicineType(e.target.value as 'ward' | 'discharge')}
                                    className="w-4 h-4 text-medical-primary"
                                  />
                                  <span className="text-sm">Discharge Medicine (Full bottles only)</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name="medicineType"
                                    value="ward"
                                    checked={medicineType === 'ward'}
                                    onChange={(e) => setMedicineType(e.target.value as 'ward' | 'discharge')}
                                    className="w-4 h-4 text-medical-primary"
                                  />
                                  <span className="text-sm">Ward Medicine (Partial allowed)</span>
                                </label>
                              </div>
                            </div>

                            {/* First Line: Dose Prescribed, Med Type, Dose Frequency */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Dose Prescribed</label>
                                <Input
                                  ref={doseInputRef}
                                  placeholder="e.g., 500, 1, 2.5"
                                  value={dosePrescribed}
                                  onChange={(e) => setDosePrescribed(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Med Type</label>
                                <Select value={medType} onValueChange={setMedType}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
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

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Dose Frequency</label>
                                <Select value={doseFrequency} onValueChange={setDoseFrequency}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select frequency" />
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
                            </div>

                            {/* Second Line: Duration, Total Price, Add to Bill */}
                            <div className="grid grid-cols-3 gap-4 items-end">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Duration (Days)</label>
                                <Input
                                  type="number"
                                  placeholder="e.g., 7, 10"
                                  value={totalDays}
                                  onChange={(e) => setTotalDays(e.target.value)}
                                  className="w-full"
                                  min="1"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Total Price</label>
                                <div className="h-10 p-2 bg-medical-primary/10 rounded-md border border-medical-primary/20 flex items-center justify-center">
                                  <span className="text-lg font-semibold text-medical-primary">
                                    {isDosageSelectionComplete() ? format(calculateInpatientMedicineDosage().totalPrice) : '---'}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground invisible">Add Medicine</label>
                                <Button
                                  onClick={addMedicineToTempList}
                                  disabled={!isDosageSelectionComplete()}
                                  variant="medical"
                                  className="w-full flex items-center justify-center space-x-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add</span>
                                </Button>
                              </div>
                            </div>

                            {/* Calculation Details (Optional) */}
                            {isDosageSelectionComplete() && (
                              <div className="medicine-dosage-card p-4 rounded-lg">
                                <div className="text-sm font-medium text-medical-primary mb-3 flex items-center">
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Calculation Preview
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                  <div className="flex justify-between">
                                    <span>Base price:</span>
                                    <span className="font-medium text-medical-primary">{format(selectedMedicineForDosage.price)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Calculation:</span>
                                    <span className="font-medium">{calculateInpatientMedicineDosage().calculationDetails}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Medicine Search and Selection Interface */}
                      <div className="space-y-4">
                        {/* Medicine Search */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              ref={medicineSearchInputRef}
                              placeholder="Search for medicines..."
                              value={medicineSearchQuery}
                              onChange={(e) => setMedicineSearchQuery(e.target.value)}
                              onKeyDown={handleMedicineSearchKeyDown}
                              className="pl-10"
                            />
                          </div>

                          {/* Search suggestions dropdown */}
                          {medicineSearchQuery.trim() && medicineSearchSuggestions.length > 0 && (
                            <div className="bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {medicineSearchSuggestions.map((item, index) => {
                                const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                const isHighlighted = index === highlightedSearchIndex;
                                
                                return (
                                  <div
                                    key={item.id}
                                    className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/40 ${
                                      isHighlighted ? 'bg-medical-primary/10 border-l-2 border-medical-primary' : ''
                                    } ${
                                      alreadyInBill ? 'bg-red-50 text-red-600 cursor-not-allowed' : ''
                                    }`}
                                    onClick={() => {
                                      if (!alreadyInBill) {
                                        selectMedicineForDosage(item);
                                      }
                                    }}
                                  >
                                    <div className="flex-1">
                                      <span className="text-sm font-medium">{item.name}</span>
                                      {alreadyInBill && (
                                        <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                      )}
                                      {isHighlighted && (
                                        <span className="ml-2 text-medical-primary text-xs">← Highlighted</span>
                                      )}
                                    </div>
                                    <span className="text-medical-primary font-semibold">
                                      {format(item.price)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Medicine Dropdown */}
                        <div className="space-y-2">
                          <div ref={medicineDropdownRef} className="relative">
                            <button
                              ref={medicineDropdownButtonRef}
                              onClick={() => setIsMedicineDropdownOpen(!isMedicineDropdownOpen)}
                              onKeyDown={handleMedicineDropdownKeyDown}
                              className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-primary/20 hover:bg-muted/50"
                            >
                              <span className="text-sm text-muted-foreground">
                                {medicineDropdownFilterQuery 
                                  ? `Filter: "${medicineDropdownFilterQuery}" (${getMedicineFilteredDropdownItems().length} matches)`
                                  : 'Medicine Dropdown - Type to filter, arrows to navigate'
                                }
                              </span>
                              <ChevronRight className={`h-4 w-4 transition-transform ${isMedicineDropdownOpen ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {/* Dropdown content */}
                            {isMedicineDropdownOpen && (
                              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {getMedicineFilteredDropdownItems().map((item: MedicalItem, index) => {
                                  const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                  const isHighlighted = index === medicineHighlightedDropdownIndex;
                                  
                                  return (
                                    <div
                                      key={item.id}
                                      className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/40 ${
                                        isHighlighted ? 'bg-medical-primary/10 border-l-2 border-medical-primary' : ''
                                      } ${
                                        alreadyInBill ? 'bg-red-50 text-red-600 cursor-not-allowed' : ''
                                      }`}
                                      onClick={() => {
                                        if (!alreadyInBill) {
                                          selectMedicineForDosage(item);
                                        }
                                      }}
                                    >
                                      <div className="flex-1">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        {alreadyInBill && (
                                          <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                        )}
                                        {isHighlighted && (
                                          <span className="ml-2 text-medical-primary text-xs">← Highlighted</span>
                                        )}
                                      </div>
                                      <span className="text-medical-primary font-semibold">
                                        {format(item.price)}
                                      </span>
                                    </div>
                                  );
                                })}
                                {getMedicineFilteredDropdownItems().length === 0 && (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No medicine items available
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          • Type to search and select medicine for dosage calculation<br/>
                          • Dropdown: Type letters to filter instantly, stays open for multiple selections<br/>
                          • Arrow keys to navigate, Enter to select<br/>
                          • Set dosage, frequency, and duration before adding to bill<br/>
                          • Ward Medicine allows partial bottles, Discharge Medicine requires full bottles<br/>
                          • <strong>Global Navigation:</strong> Use ← → arrow keys to switch categories, Escape to exit carousel
                        </div>
                      </div>
                    </div>
                  ) : selectedCategory === 'IV.\'s' ? (
                    /* IV dropdown with quantity controls */
                    <div className="space-y-4">
                      {/* Selected IVs Display */}
                      {selectedIVs.length > 0 && (
                        <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-blue-600 flex items-center">
                              <Calculator className="h-4 w-4 mr-2" />
                              Selected: {selectedIVs.length} IV item{selectedIVs.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-sm font-bold text-blue-600 bg-blue-100/80 px-2 py-1 rounded-md">
                              {format(selectedIVs.reduce((sum, iv) => sum + (parseFloat(iv.item.price) * iv.quantity), 0))}
                            </span>
                          </div>
                          
                          {selectedIVs.map((iv, index) => (
                            <div key={iv.item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-foreground">{iv.item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(parseFloat(iv.item.price))} × {iv.quantity} = {format(parseFloat(iv.item.price) * iv.quantity)}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {/* Quantity Controls */}
                                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                  <button
                                    onClick={() => {
                                      setSelectedIVs(prev => prev.map(item => 
                                        item.item.id === iv.item.id 
                                          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                                          : item
                                      ));
                                    }}
                                    className="h-6 w-6 rounded bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  
                                  <span className="w-8 text-center text-sm font-medium text-foreground">
                                    {iv.quantity}
                                  </span>
                                  
                                  <button
                                    onClick={() => {
                                      setSelectedIVs(prev => prev.map(item => 
                                        item.item.id === iv.item.id 
                                          ? { ...item, quantity: item.quantity + 1 }
                                          : item
                                      ));
                                    }}
                                    className="h-6 w-6 rounded bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                
                                {/* Remove Button */}
                                <button
                                  onClick={() => {
                                    setSelectedIVs(prev => prev.filter(item => item.item.id !== iv.item.id));
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => {
                                selectedIVs.forEach(iv => {
                                  for (let i = 0; i < iv.quantity; i++) {
                                    const billId = `${iv.item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                    const billItem = {
                                      ...iv.item,
                                      id: iv.item.id.toString(),
                                      price: parseFloat(iv.item.price),
                                      billId,
                                      quantity: 1
                                    };
                                    setBillItems(prev => [...prev, billItem]);
                                  }
                                });
                                setSelectedIVs([]);
                              }}
                              variant="outline"
                              size="sm"
                              className="border-blue-500/20 text-blue-600 hover:bg-blue-500/10"
                            >
                              Add to Bill
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* IV Dropdown */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Select IV fluids and medications:
                        </div>
                        
                        <div className="relative" ref={ivDropdownRef}>
                          <Button
                            ref={ivDropdownButtonRef}
                            variant="outline"
                            onClick={() => setIsIvDropdownOpen(!isIvDropdownOpen)}
                            onKeyDown={handleIvDropdownKeyDown}
                            className="w-full justify-between h-10 border-blue-500/20"
                          >
                            <span className="text-left truncate">
                              {ivDropdownFilterQuery 
                                ? `Filter: "${ivDropdownFilterQuery}" (${categoryItems.filter((item: MedicalItem) => 
                                    item.name.toLowerCase().includes(ivDropdownFilterQuery.toLowerCase())
                                  ).length} matches)`
                                : 'Select IV items...'
                              }
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isIvDropdownOpen ? 'rotate-180' : ''}`} />
                          </Button>
                          
                          {isIvDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {categoryItems
                                .filter((item: MedicalItem) => 
                                  item.name.toLowerCase().includes(ivDropdownFilterQuery.toLowerCase())
                                )
                                .map((item: MedicalItem, index) => {
                                  const alreadySelected = selectedIVs.find(iv => iv.item.id === item.id);
                                  const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                  const isHighlighted = index === ivHighlightedDropdownIndex;
                                  
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => {
                                        if (!alreadySelected && !alreadyInBill) {
                                          setSelectedIVs(prev => [...prev, { item, quantity: 1 }]);
                                        }
                                      }}
                                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/40 ${
                                        isHighlighted ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500' :
                                        alreadySelected ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                                        alreadyInBill ? 'bg-red-100 dark:bg-red-900/20 text-red-600 cursor-not-allowed' :
                                        'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                      }`}
                                    >
                                      <div className="flex-1">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        {alreadyInBill && (
                                          <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                        )}
                                        {alreadySelected && !alreadyInBill && (
                                          <span className="ml-2 text-green-600 text-xs">✓ Selected (Qty: {alreadySelected.quantity})</span>
                                        )}
                                        {isHighlighted && (
                                          <span className="ml-2 text-blue-600 text-xs">← Highlighted</span>
                                        )}
                                      </div>
                                      <span className="text-blue-600 font-semibold">
                                        {format(item.price)}
                                      </span>
                                    </div>
                                  );
                                })}
                              {categoryItems.filter((item: MedicalItem) => 
                                item.name.toLowerCase().includes(ivDropdownFilterQuery.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No IV items available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        • Select IV items from dropdown<br/>
                        • Use quantity controls (+ / -) to adjust amounts<br/>
                        • Multiple quantities of same item will be added as separate entries<br/>
                        • <strong>Global Navigation:</strong> Use ← → arrow keys to switch categories, Escape to exit carousel
                      </div>
                    </div>
                  ) : selectedCategory === 'Plaster/Milk' ? (
                    /* Plaster/Milk dual interface */
                    <div className="space-y-4">
                      {/* Mode Selection Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setPlasterMilkMode('plaster');
                            setMilkQuantity(1);
                          }}
                          variant={plasterMilkMode === 'plaster' ? 'medical' : 'medical-outline'}
                          className="h-12 font-medium"
                        >
                          Plaster
                        </Button>
                        
                        <Button
                          onClick={() => {
                            setPlasterMilkMode('milk');
                            setSelectedPlasters([]);
                            setPlasterChargeChecked(false);
                          }}
                          variant={plasterMilkMode === 'milk' ? 'medical' : 'medical-outline'}
                          className="h-12 font-medium"
                        >
                          Milk
                        </Button>
                      </div>

                      {/* Plaster Interface */}
                      {plasterMilkMode === 'plaster' && (
                        <div className="space-y-4">
                          {/* Selected Plasters Display */}
                          {selectedPlasters.length > 0 && (
                            <div className="space-y-2 p-4 bg-medical-primary/5 dark:bg-medical-primary/10 rounded-lg border border-medical-primary/20">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-medical-primary flex items-center">
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Selected: {selectedPlasters.length} plaster item{selectedPlasters.length !== 1 ? 's' : ''}
                                </span>
                                <span className="text-sm font-bold text-medical-primary bg-medical-primary/10 px-2 py-1 rounded-md">
                                  {format(selectedPlasters.reduce((sum, plaster) => sum + (parseFloat(plaster.item.price) * plaster.quantity), 0))}
                                </span>
                              </div>
                              
                              {selectedPlasters.map((plaster) => (
                                <div key={plaster.item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-foreground">{plaster.item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(parseFloat(plaster.item.price))} × {plaster.quantity} = {format(parseFloat(plaster.item.price) * plaster.quantity)}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                      <button
                                        onClick={() => {
                                          setSelectedPlasters(prev => prev.map(item => 
                                            item.item.id === plaster.item.id 
                                              ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                                              : item
                                          ));
                                        }}
                                        className="h-6 w-6 rounded bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      
                                      <span className="w-8 text-center text-sm font-medium text-foreground">
                                        {plaster.quantity}
                                      </span>
                                      
                                      <button
                                        onClick={() => {
                                          setSelectedPlasters(prev => prev.map(item => 
                                            item.item.id === plaster.item.id 
                                              ? { ...item, quantity: item.quantity + 1 }
                                              : item
                                          ));
                                        }}
                                        className="h-6 w-6 rounded bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    
                                    {/* Remove Button */}
                                    <button
                                      onClick={() => {
                                        setSelectedPlasters(prev => prev.filter(item => item.item.id !== plaster.item.id));
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Plaster Charge Checkbox */}
                              <div className="flex items-center space-x-2 pt-2 border-t border-medical-primary/20">
                                <input
                                  type="checkbox"
                                  id="plaster-charge"
                                  checked={plasterChargeChecked}
                                  onChange={(e) => setPlasterChargeChecked(e.target.checked)}
                                  className="h-4 w-4 text-medical-primary border-medical-primary/30 rounded focus:ring-medical-primary"
                                />
                                <label htmlFor="plaster-charge" className="text-sm font-medium text-medical-primary">
                                  Plaster Charge
                                </label>
                              </div>
                              
                              <div className="flex justify-end pt-2">
                                <Button
                                  onClick={() => {
                                    selectedPlasters.forEach(plaster => {
                                      for (let i = 0; i < plaster.quantity; i++) {
                                        const billId = `${plaster.item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                        const billItem = {
                                          ...plaster.item,
                                          id: plaster.item.id.toString(),
                                          price: parseFloat(plaster.item.price),
                                          billId,
                                          quantity: 1
                                        };
                                        setBillItems(prev => [...prev, billItem]);
                                      }
                                    });
                                    
                                    // Add plaster charge if checked
                                    if (plasterChargeChecked) {
                                      const plasterChargeBillId = `plaster-charge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                      const plasterChargeItem = {
                                        id: 'plaster-charge',
                                        name: 'Plaster Charge',
                                        category: 'Plaster/Milk',
                                        price: 50, // You can adjust this price as needed
                                        billId: plasterChargeBillId,
                                        quantity: 1
                                      };
                                      setBillItems(prev => [...prev, plasterChargeItem]);
                                    }
                                    
                                    setSelectedPlasters([]);
                                    setPlasterChargeChecked(false);
                                  }}
                                  variant="medical-outline"
                                  size="sm"
                                >
                                  Add to Bill
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Plaster Dropdown */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              Select plaster items:
                            </div>
                            
                            <div className="relative" ref={plasterDropdownRef}>
                              <Button
                                ref={plasterDropdownButtonRef}
                                variant="outline"
                                onClick={() => setIsPlasterDropdownOpen(!isPlasterDropdownOpen)}
                                onKeyDown={handlePlasterDropdownKeyDown}
                                className="w-full justify-between h-10 border-medical-primary/20"
                              >
                                <span className="text-left truncate">
                                  {plasterDropdownFilterQuery 
                                    ? `Filter: "${plasterDropdownFilterQuery}" (${categoryItems.filter((item: MedicalItem) => 
                                        item.name.toLowerCase().includes('plaster') &&
                                        item.name.toLowerCase().includes(plasterDropdownFilterQuery.toLowerCase())
                                      ).length} matches)`
                                    : 'Select plaster items...'
                                  }
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isPlasterDropdownOpen ? 'rotate-180' : ''}`} />
                              </Button>
                              
                              {isPlasterDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  {categoryItems
                                    .filter((item: MedicalItem) => 
                                      item.name.toLowerCase().includes('plaster') &&
                                      item.name.toLowerCase().includes(plasterDropdownFilterQuery.toLowerCase())
                                    )
                                    .map((item: MedicalItem, index) => {
                                      const alreadySelected = selectedPlasters.find(plaster => plaster.item.id === item.id);
                                      const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                      const isHighlighted = index === plasterHighlightedDropdownIndex;
                                      
                                      return (
                                        <div
                                          key={item.id}
                                          onClick={() => {
                                            if (!alreadySelected && !alreadyInBill) {
                                              setSelectedPlasters(prev => [...prev, { item, quantity: 1 }]);
                                            }
                                          }}
                                          className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/40 ${
                                            isHighlighted ? 'bg-medical-primary/10 dark:bg-medical-primary/20 border-l-4 border-medical-primary' :
                                            alreadySelected ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                                            alreadyInBill ? 'bg-red-100 dark:bg-red-900/20 text-red-600 cursor-not-allowed' :
                                            'hover:bg-medical-primary/5 dark:hover:bg-medical-primary/10'
                                          }`}
                                        >
                                          <div className="flex-1">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            {alreadyInBill && (
                                              <span className="ml-2 text-red-600 text-xs">● Already in Bill</span>
                                            )}
                                            {alreadySelected && !alreadyInBill && (
                                              <span className="ml-2 text-green-600 text-xs">✓ Selected (Qty: {alreadySelected.quantity})</span>
                                            )}
                                            {isHighlighted && (
                                              <span className="ml-2 text-medical-primary text-xs">← Highlighted</span>
                                            )}
                                          </div>
                                          <span className="text-medical-primary font-semibold">
                                            {format(item.price)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  {categoryItems.filter((item: MedicalItem) => 
                                    item.name.toLowerCase().includes('plaster') &&
                                    item.name.toLowerCase().includes(plasterDropdownFilterQuery.toLowerCase())
                                  ).length === 0 && (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                      No plaster items available
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Milk Interface */}
                      {plasterMilkMode === 'milk' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-medical-primary/5 dark:bg-medical-primary/10 rounded-lg border border-medical-primary/20">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-semibold text-medical-primary">Milk Quantity</span>
                              <span className="text-sm font-bold text-medical-primary bg-medical-primary/10 px-2 py-1 rounded-md">
                                {format(milkQuantity * 25)} {/* Assuming milk costs 25 BDT per unit */}
                              </span>
                            </div>
                            
                            {/* Milk Quantity Controls */}
                            <div className="flex items-center justify-center space-x-4">
                              <button
                                onClick={() => setMilkQuantity(prev => Math.max(1, prev - 1))}
                                className="h-10 w-10 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center text-medical-primary border border-medical-primary/20"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              
                              <div className="text-center">
                                <div className="text-2xl font-bold text-medical-primary">{milkQuantity}</div>
                                <div className="text-xs text-medical-primary">bottles</div>
                              </div>
                              
                              <button
                                onClick={() => setMilkQuantity(prev => prev + 1)}
                                className="h-10 w-10 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center text-medical-primary border border-medical-primary/20"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="flex justify-end mt-4">
                              <Button
                                onClick={() => {
                                  for (let i = 0; i < milkQuantity; i++) {
                                    const billId = `milk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                    const milkItem = {
                                      id: 'milk',
                                      name: 'Milk',
                                      category: 'Plaster/Milk',
                                      price: 25, // Milk price per bottle
                                      billId,
                                      quantity: 1
                                    };
                                    setBillItems(prev => [...prev, milkItem]);
                                  }
                                  setMilkQuantity(1);
                                }}
                                variant="medical-outline"
                                size="sm"
                              >
                                Add to Bill
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!plasterMilkMode && (
                        <div className="text-center text-muted-foreground py-8">
                          <div className="text-lg font-medium mb-2">Select Plaster or Milk</div>
                          <div className="text-sm">Choose one of the options above to continue</div>
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        • <strong>Plaster:</strong> Select items from dropdown, set quantities, optional plaster charge<br/>
                        • <strong>Milk:</strong> Simple quantity counter for milk bottles<br/>
                        • <strong>Global Navigation:</strong> Use ← → arrow keys to switch categories, Escape to exit carousel
                      </div>
                    </div>
                  ) : ['Physical Therapy', 'Limb and Brace', 'Blood', 'Food'].includes(selectedCategory) ? (
                    /* Manual entry interface for Physical Therapy, Limb and Brace, Blood, and Food matching outpatient */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Service Name</label>
                        <Input
                          placeholder={`Enter ${selectedCategory} service name...`}
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Price (BDT)</label>
                        <Input
                          type="number"
                          placeholder="Enter price..."
                          value={manualEntryPrice}
                          onChange={(e) => setManualEntryPrice(e.target.value)}
                          className="w-full"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={addManualEntryToBill}
                          variant="medical"
                          size="sm"
                          className="text-xs font-medium shadow-md hover:shadow-lg transition-shadow px-3 py-1"
                          disabled={!categorySearchQuery.trim() || !manualEntryPrice.trim() || isNaN(parseFloat(manualEntryPrice)) || parseFloat(manualEntryPrice) <= 0}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Bill
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        • Enter service name and price manually<br/>
                        • All entries are saved for future reference<br/>
                        • <strong>Global Navigation:</strong> Use ← → arrow keys to switch categories, Escape to exit carousel
                      </div>
                    </div>
                  ) : selectedCategory === 'Seat & Ad. Fee' ? (
                    /* Seat & Ad. Fee with General and Private buttons */
                    <div className="space-y-4">
                      <div className="text-center space-y-4">
                        <div className="text-lg font-medium text-medical-primary mb-6">
                          Select Seat & Ad. Fee Type
                        </div>
                        
                        <div className="flex space-x-4 justify-center">
                          <Button
                            onClick={() => {
                              const generalFeeItem = {
                                id: 'seat-general',
                                name: 'Seat & Ad. Fee - General',
                                category: 'Seat & Ad. Fee',
                                price: 500, // You can adjust this price as needed
                                billId: `seat-general-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                              };
                              setBillItems(prev => [...prev, generalFeeItem]);
                            }}
                            variant="medical"
                            size="lg"
                            className="px-8 py-4 text-lg font-medium"
                          >
                            General
                          </Button>
                          
                          <Button
                            onClick={() => {
                              const privateFeeItem = {
                                id: 'seat-private',
                                name: 'Seat & Ad. Fee - Private',
                                category: 'Seat & Ad. Fee',
                                price: 1000, // You can adjust this price as needed
                                billId: `seat-private-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                              };
                              setBillItems(prev => [...prev, privateFeeItem]);
                            }}
                            variant="medical"
                            size="lg"
                            className="px-8 py-4 text-lg font-medium"
                          >
                            Private
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground text-center">
                        • Click <strong>General</strong> or <strong>Private</strong> to add seat and additional fees<br/>
                        • Each button adds the appropriate fee type to the bill<br/>
                        • <strong>Global Navigation:</strong> Use ← → arrow keys to switch categories, Escape to exit carousel
                      </div>
                    </div>
                  ) : ['Registration Fees'].includes(selectedCategory) ? (
                    /* Compact interface for Registration Fees matching outpatient */
                    <div className="space-y-2">
                      {categoryItems.map((item: MedicalItem) => {
                        const isInBill = billItems.some(billItem => billItem.id === item.id.toString());
                        
                        const handleItemClick = () => {
                          if (isInBill) {
                            // Remove from bill
                            const billItem = billItems.find(billItem => billItem.id === item.id.toString());
                            if (billItem) {
                              setBillItems(prev => prev.filter(bi => bi.billId !== billItem.billId));
                            }
                          } else {
                            // Add to bill
                            addItemToBill(item);
                          }
                        };
                        
                        return (
                          <div 
                            key={item.id} 
                            onClick={handleItemClick}
                            className={`flex items-center justify-between p-2 ${
                              isInBill 
                                ? 'bg-medical-primary/20 border border-medical-primary/30' 
                                : 'bg-muted/30'
                            } rounded-lg hover:bg-muted/50 transition-colors cursor-pointer`}
                          >
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${isInBill ? 'text-medical-primary' : 'text-foreground'}`}>
                                {item.name}
                                {isInBill && <span className="ml-2 text-xs">✓ Added</span>}
                              </div>
                              {item.description && (
                                <div className="text-muted-foreground text-xs">{item.description}</div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-medical-primary text-sm">
                                {format(item.price)}
                              </span>
                              <div 
                                className={`flex items-center justify-center h-7 w-7 rounded ${
                                  isInBill 
                                    ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30' 
                                    : 'bg-medical-primary/20 text-medical-primary hover:bg-medical-primary/30'
                                } transition-colors`}
                              >
                                {isInBill ? (
                                  <X className="h-3 w-3" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Standard interface for other categories
                    <div className="space-y-4">
                      {/* Category Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder={`Search ${selectedCategory} items...`}
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Filtered Results */}
                      <div className="grid grid-cols-1 gap-2">
                        {categoryItems
                          .filter((item: MedicalItem) => 
                            item.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                          )
                          .map((item: MedicalItem) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">{format(parseFloat(item.price))}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addItemToBill(item)}
                                variant="medical-outline"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bill Summary Panel */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center text-medical-primary">
                  <Calculator className="mr-2 h-5 w-5" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-8">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Bill calculation will be implemented here.</p>
                      <p className="text-sm">Total items: {billItems.length}</p>
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

            {/* Hospital Bill Form */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle 
                  className="flex items-center justify-between text-medical-primary cursor-pointer"
                  onClick={() => setIsBillFormHeaderExpanded(!isBillFormHeaderExpanded)}
                >
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Hospital Bill Form
                  </div>
                  <div className="flex items-center">
                    {isBillFormHeaderExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
              {isBillFormHeaderExpanded && (
                <CardContent className="space-y-4 pt-0">
                  {/* Hospital Header */}
                  <div className="text-center space-y-1 border-b border-border pb-4">
                    <h2 className="text-xl font-bold text-foreground">Memorial Christian Hospital</h2>
                    <p className="text-base font-semibold text-muted-foreground">P.O. Malumghat Hospital</p>
                    <p className="text-sm text-muted-foreground">District Cox's Bazar</p>
                  </div>

                  {/* Patient Information Row */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <span className="font-medium">Patient's Name:</span>
                      <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                    </div>
                    <div className="flex">
                      <span className="font-medium">O.D. No:</span>
                      <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <span className="font-medium">Hospital No:</span>
                      <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                    </div>
                    <div className="flex">
                      <span className="font-medium">Bill Date:</span>
                      <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <span className="font-medium">Bill No:</span>
                      <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                    </div>
                    <div className="flex">
                      <span className="font-medium">Date Discharged:</span>
                      <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                    </div>
                  </div>

                  <div className="flex text-sm">
                    <span className="font-medium">Date Admitted:</span>
                    <div className="flex-1 border-b border-dotted border-muted-foreground/50 ml-1"></div>
                  </div>
                </CardContent>
              )}
              
              <CardContent className={`${isBillFormHeaderExpanded ? 'pt-0' : ''}`}>

                {/* Bill Categories Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        { category: 'Blood', code: '50303' },
                        { category: 'Laboratory', code: '50303' },
                        { category: 'Limb and Brace', code: '50304' },
                        { category: 'Food', code: '50319' },
                        { category: 'Halo, O2, NO2, etc.', code: '50319' },
                        { category: 'Orthopedic, S. Roll, etc.', code: '50306' },
                        { category: 'Surgery, O.R. & Delivery', code: '50306' },
                        { category: 'Registration fees', code: '50307' },
                        { category: 'Discharge Medicine', code: '50308' },
                        { category: 'Medicine, ORS & Anesthesia, Ket, Spinal', code: '50308' },
                        { category: 'Physical Therapy', code: '50309' },
                        { category: 'IV.\'s', code: '50310' },
                        { category: 'Plaster/Milk', code: '50310' },
                        { category: 'Procedures', code: '50310' },
                        { category: 'Seat & Ad. Fee', code: '50313' },
                        { category: 'X-Ray', code: '50315' },
                        { category: 'Lost Laundry', code: '50310' },
                        { category: 'Travel', code: '20901' },
                        { category: 'Other', code: '50317' },
                        { category: '', code: '' },
                        { category: '', code: '' }
                      ].map((row, index) => (
                        <tr key={index} className="border-b border-border">
                          <td className="border-r border-border p-2 w-1/2 font-medium bg-muted/20">
                            {row.category}
                          </td>
                          <td className="border-r border-border p-2 w-1/4"></td>
                          <td className="p-2 w-1/4 text-center text-xs text-muted-foreground">
                            {row.code}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Sub Total Bill Row */}
                      <tr className="border-b border-border">
                        <td className="border-r border-border p-2 w-1/2 font-bold bg-muted/30">
                          Sub. Total Bill
                        </td>
                        <td className="border-r border-border p-2 w-1/4"></td>
                        <td className="p-2 w-1/4 text-center text-xs text-muted-foreground">
                          50311
                        </td>
                      </tr>
                      
                      {/* Ancillary Row */}
                      <tr className="border-b border-border">
                        <td className="border-r border-border p-2 w-1/2 font-medium bg-muted/20">
                          Ancillary
                        </td>
                        <td className="border-r border-border p-2 w-1/4"></td>
                        <td className="p-2 w-1/4 text-center text-xs text-muted-foreground">
                          
                        </td>
                      </tr>
                      
                      {/* Total Bill Row */}
                      <tr className="border-b border-border">
                        <td className="border-r border-border p-2 w-1/2 font-bold bg-muted/30">
                          Total Bill
                        </td>
                        <td className="border-r border-border p-2 w-1/4"></td>
                        <td className="p-2 w-1/4 text-center text-xs text-muted-foreground">
                          
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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

      {/* X-Ray View Selection Dialog */}
      {showXRayViewSelection && selectedXRayForViews && (
        <Dialog open={showXRayViewSelection} onOpenChange={setShowXRayViewSelection}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select X-Ray Views</DialogTitle>
              <DialogDescription>
                Choose the film views for: {selectedXRayForViews.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-sm font-medium">Film Views:</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={xRayViews.AP}
                      onChange={(e) => handleXRayViewChange('AP', e.target.checked)}
                      className="rounded"
                    />
                    <span>AP (Antero-Posterior)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={xRayViews.LAT}
                      onChange={(e) => handleXRayViewChange('LAT', e.target.checked)}
                      className="rounded"
                    />
                    <span>LAT (Lateral)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={xRayViews.OBLIQUE}
                      onChange={(e) => handleXRayViewChange('OBLIQUE', e.target.checked)}
                      className="rounded"
                    />
                    <span>OBLIQUE</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={xRayViews.BOTH}
                      onChange={(e) => handleXRayViewChange('BOTH', e.target.checked)}
                      className="rounded"
                    />
                    <span>BOTH (AP & LAT)</span>
                  </label>
                </div>
              </div>

              {/* Off-Charge/Portable option */}
              {Object.values(xRayViews).some(v => v) && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isOffChargePortable}
                      onChange={(e) => setIsOffChargePortable(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Off-Charge/Portable</span>
                  </label>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Price per film: {format(parseFloat(selectedXRayForViews.price))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowXRayViewSelection(false)}>
                Cancel
              </Button>
              <Button
                onClick={addXRayToBill}
                disabled={!Object.values(xRayViews).some(v => v)}
                variant="medical"
              >
                Add to Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Duplicate Item Dialog */}
      {duplicateDialog.open && duplicateDialog.item && (
        <Dialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog({open, item: null})}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-amber-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Duplicate Item
              </DialogTitle>
              <DialogDescription>
                "{duplicateDialog.item.name}" is already in the bill.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="text-sm">
                  <div className="font-medium">{duplicateDialog.item.name}</div>
                  <div className="text-muted-foreground">{duplicateDialog.item.category}</div>
                  <div className="font-medium text-medical-primary">{format(parseFloat(duplicateDialog.item.price))}</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                What would you like to do?
              </div>
            </div>

            <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  const billItem = {
                    ...duplicateDialog.item!,
                    id: duplicateDialog.item!.id.toString(),
                    price: parseFloat(duplicateDialog.item!.price),
                    billId: `${duplicateDialog.item!.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  };
                  setBillItems(prev => [...prev, billItem]);
                  setDuplicateDialog({open: false, item: null});
                }}
                className="w-full sm:w-auto"
              >
                Add Again
              </Button>
              <Button
                variant="outline"
                onClick={() => setDuplicateDialog({open: false, item: null})}
                className="w-full sm:w-auto"
              >
                Skip
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setBillItems(prev => prev.filter(item => item.id !== duplicateDialog.item!.id.toString()));
                  const billItem = {
                    ...duplicateDialog.item!,
                    id: duplicateDialog.item!.id.toString(),
                    price: parseFloat(duplicateDialog.item!.price),
                    billId: `${duplicateDialog.item!.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  };
                  setBillItems(prev => [...prev, billItem]);
                  setDuplicateDialog({open: false, item: null});
                }}
                className="w-full sm:w-auto"
              >
                Replace Existing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}