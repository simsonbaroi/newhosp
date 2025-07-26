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
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both admission and discharge days
    
    return daysDiff > 0 ? daysDiff : 1;
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
              <CardHeader>
                <CardTitle className="flex items-center text-medical-primary">
                  <Calculator className="mr-2 h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="admissionDate" className="text-foreground font-medium">Admission Date & Time</Label>
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
                        <span className="text-sm text-muted-foreground">Click to change admission date & time</span>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dischargeDate" className="text-foreground font-medium">Discharge Date & Time</Label>
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
                        <span className="text-sm text-muted-foreground">Click to change discharge date & time</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-medical-muted/10 rounded-lg border border-medical-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Admitted Days:</span>
                    <span className="text-lg font-semibold text-medical-primary">{daysAdmitted} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        title={`Select ${cupertinoDatePickerType === 'admission' ? 'Admission' : 'Discharge'} Date & Time`}
      />
    </Layout>
  );
}