import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useTakaFormat } from '../hooks/useCurrencyFormat';
import type { MedicalItem } from '../../../shared/schema';

interface BillItem extends MedicalItem {
  quantity: number;
}

const Inpatient = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [daysAdmitted, setDaysAdmitted] = useState<number>(1);
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const { format } = useTakaFormat();

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
        const response = await fetch('/api/bills/browser-session/inpatient');
        if (response.ok) {
          const bill = await response.json();
          if (bill && bill.billData) {
            setBillItems(JSON.parse(bill.billData));
            setDaysAdmitted(bill.daysAdmitted || 1);
          }
        }
      } catch (error) {
        console.error('Failed to load saved bill:', error);
      }
    };
    loadSavedBill();
  }, []);

  // Auto-save bill when items change
  useEffect(() => {
    if (billItems.length > 0 || daysAdmitted > 1) {
      saveBillMutation.mutate(billItems);
    }
  }, [billItems, daysAdmitted]);

  const addToBill = (item: MedicalItem, quantity: number = 1) => {
    const existingItem = billItems.find(billItem => billItem.id === item.id);
    
    if (existingItem) {
      setBillItems(billItems.map(billItem =>
        billItem.id === item.id
          ? { ...billItem, quantity: billItem.quantity + quantity }
          : billItem
      ));
    } else {
      setBillItems([...billItems, { ...item, quantity }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setBillItems(billItems.filter(item => item.id !== id));
    } else {
      setBillItems(billItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

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

  const clearBill = () => {
    setBillItems([]);
    setDaysAdmitted(1);
  };

  // Inpatient category order - includes outpatient categories
  const categoryOrder = [
    'Registration Fees', 'Dr. Fees', 'Medic Fee', 'Seat & Ad. Fee', 
    'Blood', 'Laboratory', 'Medicine', 'Food', 'Halo, O2, NO2, etc.', 
    'Surgery, O.R. & Delivery', 'Discharge Medicine', 'Medicine, ORS & Anesthesia, Ket, Spinal',
    'Physical Therapy', 'IV.\'s', 'Plaster/Milk', 'Procedures', 'X-Ray', 
    'Limb and Brace', 'Lost Laundry', 'Travel', 'Other'
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
                          <Button size="sm" onClick={() => addToBill(item)} variant="medical">
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
                  // Carousel mode with preview buttons
                  <div className="flex items-center justify-center space-x-2">
                    {/* Previous preview button */}
                    <Button
                      variant="medical-ghost"
                      className="h-auto p-1.5 sm:p-2 text-left flex-shrink-0 opacity-60 hover:opacity-80 max-w-[60px] sm:max-w-[80px] justify-start"
                      onClick={() => navigateCarousel('prev')}
                    >
                      <div className="w-full">
                        <div className="text-xs sm:text-xs truncate text-left leading-tight">
                          {orderedCategories[(currentCategoryIndex - 1 + orderedCategories.length) % orderedCategories.length]}
                        </div>
                      </div>
                    </Button>

                    {/* Previous arrow */}
                    <Button
                      variant="medical-outline"
                      size="sm"
                      onClick={() => navigateCarousel('prev')}
                      className="h-10 w-10 p-0 flex-shrink-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Current selected category */}
                    <Button
                      variant="medical"
                      className="h-auto p-2 sm:p-4 text-center flex-1 max-w-[140px] sm:max-w-[200px]"
                      onClick={() => handleCategoryClick(selectedCategory)}
                    >
                      <div className="w-full">
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
                      className="h-10 w-10 p-0 flex-shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Next preview button */}
                    <Button
                      variant="medical-ghost"
                      className="h-auto p-2 text-right flex-shrink-0 opacity-60 hover:opacity-80 max-w-[80px] justify-end"
                      onClick={() => navigateCarousel('next')}
                    >
                      <div className="w-full">
                        <div className="text-xs truncate text-right">
                          {orderedCategories[(currentCategoryIndex + 1) % orderedCategories.length]}
                        </div>
                      </div>
                    </Button>
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
                              <Button size="sm" onClick={() => addToBill(item)} variant="medical">
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
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {billItems.map((item) => {
                        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                        const isDailyItem = item.category.includes('Food') || 
                                           item.category.includes('Seat') || 
                                           item.category.includes('O2') ||
                                           item.name.toLowerCase().includes('per day');
                        const subtotal = isDailyItem ? price * item.quantity * daysAdmitted : price * item.quantity;
                        
                        return (
                          <div key={item.id} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-foreground">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.category}</div>
                                {isDailyItem && (
                                  <div className="text-xs text-medical-accent">Daily rate</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="medical-ghost"
                                onClick={() => removeFromBill(item.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="medical-outline"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-medium text-sm w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="medical-outline"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  {format(price)} each
                                  {isDailyItem && ` × ${daysAdmitted} days`}
                                </div>
                                <div className="font-semibold text-medical-primary">{format(subtotal)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="border-t border-medical-secondary/20 pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span className="text-foreground">Total Bill:</span>
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
    </Layout>
  );
};

export default Inpatient;