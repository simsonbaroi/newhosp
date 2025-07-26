import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle, ChevronDown, ChevronUp, FileText, FileX } from 'lucide-react';
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
  const [isPatientInfoExpanded, setIsPatientInfoExpanded] = useState<boolean>(true);
  const [isBillFormHeaderExpanded, setIsBillFormHeaderExpanded] = useState<boolean>(false);
  
  // Advanced category functionality states (matching outpatient)
  const [selectedLabItems, setSelectedLabItems] = useState<MedicalItem[]>([]);
  const [dropdownSelectedItems, setDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedXRayItems, setSelectedXRayItems] = useState<MedicalItem[]>([]);
  const [xRayDropdownSelectedItems, setXRayDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [selectedRegistrationItems, setSelectedRegistrationItems] = useState<MedicalItem[]>([]);
  const [registrationDropdownSelectedItems, setRegistrationDropdownSelectedItems] = useState<MedicalItem[]>([]);
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

  // Fetch medical items
  const { data: medicalItems = [] } = useQuery<MedicalItem[]>({
    queryKey: ['/api/medical-items'],
  });

  // Filter items by category
  const categoryItems = selectedCategory 
    ? medicalItems.filter((item: MedicalItem) => item.category === selectedCategory)
    : [];

  // Get inpatient categories from the database, excluding Dr. Fees, Medic Fee, and Medicine
  const excludedCategories = ['Dr. Fees', 'Medic Fee', 'Medicine'];
  const categories = Array.from(new Set(
    medicalItems
      .filter((item: MedicalItem) => !item.isOutpatient && !excludedCategories.includes(item.category))
      .map((item: MedicalItem) => item.category)
  ));

  // Inpatient category order - updated per user request (removed Dr. Fees, Medic Fee, Medicine)
  const categoryOrder = [
    'Blood', 'Laboratory', 'Limb and Brace', 'Food', 
    'Halo, O2, NO2, etc.', 'Orthopedic, S.Roll, etc.', 'Surgery, O.R. & Delivery', 
    'Registration Fees', 'Discharge Medicine', 'Medicine, ORS & Anesthesia, Ket, Spinal',
    'Physical Therapy', 'IV.\'s', 'Plaster/Milk', 'Procedures', 
    'Seat & Ad. Fee', 'X-Ray', 'Lost Laundry', 'Travel', 'Others'
  ];

  const orderedCategories = categoryOrder.filter(cat => categories.includes(cat))
    .concat(categories.filter(cat => !categoryOrder.includes(cat)));

  // Category navigation functions
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentCategoryIndex(orderedCategories.indexOf(category));
    setIsCarouselMode(true);
    setCategorySearchQuery('');
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentCategoryIndex - 1 + orderedCategories.length) % orderedCategories.length
      : (currentCategoryIndex + 1) % orderedCategories.length;
    
    setCurrentCategoryIndex(newIndex);
    setSelectedCategory(orderedCategories[newIndex]);
    setCategorySearchQuery(''); // Reset search when switching categories
  };

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
                  <div className="flex items-center">
                    {isPatientInfoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-medical-primary">
                  <span className="flex items-center">
                    <Grid3X3 className="mr-2 h-5 w-5" />
                    Inpatient Categories
                  </span>
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
                        
                        {/* Search suggestions appear right below search input */}
                        {categorySearchQuery && getLabSuggestions().length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2 bg-muted/10">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Matching tests (press comma to add):
                            </div>
                            {getLabSuggestions().slice(0, 5).map((item: MedicalItem, index) => {
                              const alreadyInSearch = selectedLabItems.find(selected => selected.id === item.id);
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
                                     // Check if item is already selected in search OR already in the bill
                                     const alreadyInSearch = selectedLabItems.find(selected => selected.id === item.id);
                                     const alreadyInBill = billItems.find(billItem => billItem.id === item.id.toString());
                                     
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
                                      : billItems.find(billItem => billItem.id === item.id.toString())
                                        ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                        : 'cursor-pointer hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span>{item.name}</span>
                                    {dropdownSelectedItems.find(selected => selected.id === item.id) && (
                                      <span className="ml-2 text-blue-600 text-xs">✓ Selected</span>
                                    )}
                                    {billItems.find(billItem => billItem.id === item.id.toString()) && !dropdownSelectedItems.find(selected => selected.id === item.id) && (
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