import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function InpatientFixed() {
  const format = useTakaFormat();
  
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

  // Fetch medical items
  const { data: medicalItems = [] } = useQuery<MedicalItem[]>({
    queryKey: ['/api/medical-items'],
  });

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
    'Registration Fees', 'Discharge Medicine',
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
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      Total Admitted Days: <span className="font-semibold text-medical-primary">{daysAdmitted}{daysAdmitted === 1 ? 'day' : 'days'}</span>
                    </span>
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
                  // Carousel mode
                  <div className="space-y-4">
                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="medical-ghost"
                        size="sm"
                        onClick={goToPreviousCategory}
                        disabled={currentCategoryIndex === 0}
                        className="flex items-center text-xs"
                      >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        {currentCategoryIndex > 0 ? orderedCategories[currentCategoryIndex - 1] : 'Previous'}
                      </Button>
                      
                      <Button
                        variant="medical-ghost"
                        size="sm"
                        onClick={goToNextCategory}
                        disabled={currentCategoryIndex === orderedCategories.length - 1}
                        className="flex items-center text-xs"
                      >
                        {currentCategoryIndex < orderedCategories.length - 1 ? orderedCategories[currentCategoryIndex + 1] : 'Next'}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {/* Current Category Display */}
                    <div className="text-center">
                      <Button
                        variant="medical"
                        className="font-semibold text-sm px-4 py-2"
                        disabled
                      >
                        {orderedCategories[currentCategoryIndex]} ({medicalItems.filter((item: MedicalItem) => item.category === orderedCategories[currentCategoryIndex]).length} items)
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

                  {/* Category Items */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {medicalItems
                      .filter((item: MedicalItem) => 
                        !item.isOutpatient && 
                        item.category === selectedCategory &&
                        (categorySearchQuery === '' || 
                         item.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                      )
                      .map((item: MedicalItem) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-medical-primary">{format.format(parseFloat(item.price))}</span>
                            <Button
                              size="sm"
                              variant="medical-outline"
                              onClick={() => {
                                const newItem: BillItem = {
                                  id: item.id.toString(),
                                  name: item.name,
                                  category: item.category,
                                  price: parseFloat(item.price),
                                  quantity: 1
                                };
                                setBillItems(prev => [...prev, newItem]);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
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
    </Layout>
  );
}