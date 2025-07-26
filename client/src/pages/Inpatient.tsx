import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
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
import type { MedicalItem } from '../../../shared/schema';
import { calculateMedicineDosage, formatDosageForBill, MEDICINE_RULES } from '../../../shared/medicineCalculations';

interface BillItem extends MedicalItem {
  quantity: number;
}

const Inpatient = () => {
  // Patient information state
  const [patientName, setPatientName] = useState<string>('');
  const [opdNumber, setOpdNumber] = useState<string>('');
  const [hospitalNumber, setHospitalNumber] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [dischargeDate, setDischargeDate] = useState<string>('');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [daysAdmitted, setDaysAdmitted] = useState<number>(1);
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const [duplicateDialog, setDuplicateDialog] = useState<{open: boolean, item: MedicalItem | null}>({open: false, item: null});
  
  // Inpatient Medicine dosage selection state
  const [selectedMedicineForDosage, setSelectedMedicineForDosage] = useState<any>(null);
  const [showMedicineDosageSelection, setShowMedicineDosageSelection] = useState(false);
  const [dosePrescribed, setDosePrescribed] = useState('');
  const [medType, setMedType] = useState('');
  const [doseFrequency, setDoseFrequency] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [isDischargeMedicine, setIsDischargeMedicine] = useState(false);
  
  const { format } = useTakaFormat();

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
    if (billItems.length > 0 || daysAdmitted > 1 || patientName || opdNumber || hospitalNumber || billNumber || admissionDate || dischargeDate) {
      saveBillMutation.mutate(billItems);
    }
  }, [billItems, daysAdmitted, patientName, opdNumber, hospitalNumber, billNumber, admissionDate, dischargeDate]);

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
                <Input
                  id="admissionDate"
                  type="text"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  placeholder="DD/MM/YY"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dischargeDate" className="text-foreground font-medium">Discharge Date</Label>
                <Input
                  id="dischargeDate"
                  type="text"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  placeholder="DD/MM/YY"
                  className="w-full"
                />
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
              <p>Date format: DD/MM/YY (e.g., 25/01/25 for January 25, 2025)</p>
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
                  <Input
                    placeholder={`Search in ${selectedCategory}...`}
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full"
                  />
                </CardHeader>
                <CardContent>
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
    </Layout>
  );
};

export default Inpatient;