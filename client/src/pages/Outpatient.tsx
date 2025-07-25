import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Calculator, Grid3X3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useTakaFormat } from '../hooks/useCurrencyFormat';
import type { MedicalItem } from '../../../shared/schema';

interface BillItem extends MedicalItem {
  quantity: number;
}

const Outpatient = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const [selectedLabItems, setSelectedLabItems] = useState<MedicalItem[]>([]);
  const [dropdownSelectedItems, setDropdownSelectedItems] = useState<MedicalItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { format } = useTakaFormat();
  const queryClient = useQueryClient();

  // Get outpatient medical items
  const { data: medicalItems = [] } = useQuery<MedicalItem[]>({
    queryKey: ['/api/medical-items', { isOutpatient: true }],
  });

  // Get unique categories - only allow the 8 specified outpatient categories
  const allowedCategories = [
    'Registration Fees', 'Dr. Fees', 'Medic Fee', 'Medicine', 
    'Laboratory', 'X-Ray', 'Physical Therapy', 'Limb and Brace'
  ];
  const categories = Array.from(new Set(medicalItems.map((item: MedicalItem) => item.category)))
    .filter(cat => allowedCategories.includes(cat))
    .sort();

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
          type: 'outpatient',
          sessionId: 'browser-session',
          billData: JSON.stringify(billData),
          total: calculateTotal().toString(),
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
        const response = await fetch('/api/bills/browser-session/outpatient');
        if (response.ok) {
          const bill = await response.json();
          if (bill && bill.billData) {
            setBillItems(JSON.parse(bill.billData));
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
    if (billItems.length > 0) {
      saveBillMutation.mutate(billItems);
    }
  }, [billItems]);

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
    return billItems.reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const clearBill = () => {
    setBillItems([]);
  };

  // Category button order as specified by user
  const categoryOrder = [
    'Registration Fees', 'Dr. Fees', 'Medic Fee', 'Medicine', 
    'Laboratory', 'X-Ray', 'Physical Therapy', 'Limb and Brace'
  ];

  // Categories that should not have search functionality
  const categoriesWithoutSearch = ['Registration Fees', 'Dr. Fees', 'Medic Fee'];

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
    setSelectedLabItems([]); // Clear lab selections when exiting
    setDropdownSelectedItems([]); // Clear dropdown selections when exiting
    setIsDropdownOpen(false);
  };

  // Get sorted lab suggestions with closest match first
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

  // Handle comma-separated lab item selection
  const handleLabSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const query = categorySearchQuery.trim();
      if (query) {
        // Get the top suggestion (closest match)
        const suggestions = getLabSuggestions();
        if (suggestions.length > 0) {
          const topMatch = suggestions[0];
          if (!selectedLabItems.find(item => item.id === topMatch.id)) {
            setSelectedLabItems(prev => [...prev, topMatch]);
          }
        }
        setCategorySearchQuery('');
      }
    }
  };

  // Remove lab item from selection
  const removeLabItem = (itemId: number) => {
    setSelectedLabItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Add all selected lab items to bill
  const addSelectedLabItemsToBill = () => {
    selectedLabItems.forEach(item => {
      addToBill(item);
    });
    setSelectedLabItems([]);
  };

  // Handle dropdown item selection
  const handleDropdownSelect = (item: MedicalItem) => {
    if (!dropdownSelectedItems.find(selected => selected.id === item.id)) {
      setDropdownSelectedItems(prev => [...prev, item]);
    }
    // Keep dropdown open for multiple selections
  };

  // Remove item from dropdown selection
  const removeDropdownItem = (itemId: number) => {
    setDropdownSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Add all dropdown selected items to bill
  const addDropdownSelectedItemsToBill = () => {
    dropdownSelectedItems.forEach(item => {
      addToBill(item);
    });
    setDropdownSelectedItems([]);
    setIsDropdownOpen(false);
  };

  // Get dropdown options sorted by relevance
  const getDropdownOptions = () => {
    if (!categorySearchQuery) return categoryItems;
    
    const query = categorySearchQuery.toLowerCase();
    const filtered = categoryItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
    
    // Sort by relevance: exact matches first, then starts with, then contains
    return filtered.sort((a, b) => {
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Outpatient Calculator</h1>
          <p className="text-muted-foreground">Calculate bills for outpatient services and procedures</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Categories and Items */}
          <div className="lg:col-span-2 space-y-6">
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
                    Categories
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
                      className="h-auto p-1.5 sm:p-2 text-right flex-shrink-0 opacity-60 hover:opacity-80 max-w-[60px] sm:max-w-[80px] justify-end"
                      onClick={() => navigateCarousel('next')}
                    >
                      <div className="w-full">
                        <div className="text-xs sm:text-xs truncate text-right leading-tight">
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
                  {/* Show search + dropdown for Medicine, Laboratory, X-Ray categories */}
                  {selectedCategory === 'Laboratory' ? (
                    <div className="space-y-4">
                      {/* Selected lab items as tags */}
                      {selectedLabItems.length > 0 && (
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
                      )}
                      <Input
                        placeholder="Type lab test name and press comma or enter to add..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        onKeyDown={handleLabSearchKeyDown}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full"
                      />
                      {selectedLabItems.length > 0 && (
                        <Button onClick={addSelectedLabItemsToBill} variant="medical" className="w-full">
                          Add {selectedLabItems.length} Lab Test{selectedLabItems.length !== 1 ? 's' : ''} to Bill (Tags)
                        </Button>
                      )}
                      
                      {/* Dropdown selected items as tags */}
                      {dropdownSelectedItems.length > 0 && (
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
                      )}
                      
                      {/* Dropdown */}
                      {isDropdownOpen && (
                        <div className="relative">
                          <div className="absolute top-0 left-0 right-0 z-10 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {getDropdownOptions().map((item: MedicalItem) => (
                              <div
                                key={item.id}
                                className={`p-2 text-sm cursor-pointer hover:bg-muted/50 border-b border-border/50 last:border-b-0 ${
                                  dropdownSelectedItems.find(selected => selected.id === item.id) 
                                    ? 'bg-blue-500/10 text-blue-600' 
                                    : 'text-foreground'
                                }`}
                                onClick={() => handleDropdownSelect(item)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-medical-primary font-semibold">
                                    {format(item.price)}
                                  </span>
                                </div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                                )}
                              </div>
                            ))}
                            {getDropdownOptions().length === 0 && (
                              <div className="p-4 text-center text-muted-foreground text-sm">
                                No items found
                              </div>
                            )}
                          </div>
                          <Button 
                            onClick={() => setIsDropdownOpen(false)} 
                            variant="medical-outline" 
                            size="sm"
                            className="mt-2"
                          >
                            Close Dropdown
                          </Button>
                        </div>
                      )}
                      
                      {!isDropdownOpen && dropdownSelectedItems.length === 0 && (
                        <Button 
                          onClick={() => setIsDropdownOpen(true)} 
                          variant="medical-outline" 
                          className="w-full"
                        >
                          Open Dropdown to Select Multiple Items
                        </Button>
                      )}
                      
                      {dropdownSelectedItems.length > 0 && (
                        <Button onClick={addDropdownSelectedItemsToBill} variant="medical" className="w-full">
                          Add {dropdownSelectedItems.length} Selected Item{dropdownSelectedItems.length !== 1 ? 's' : ''} to Bill (Dropdown)
                        </Button>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        • Type and press comma for quick tag selection<br/>
                        • Use dropdown for multiple precise selections
                      </div>
                    </div>
                  ) : ['Medicine', 'X-Ray'].includes(selectedCategory) ? (
                    <div className="space-y-4">
                      <Input
                        placeholder={`Search in ${selectedCategory}...`}
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full"
                      />
                      <Select onValueChange={(value) => {
                        const selectedItem = (categorySearchQuery ? filteredCategoryItems : categoryItems).find(item => item.id.toString() === value);
                        if (selectedItem) addToBill(selectedItem);
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`Select ${selectedCategory} item...`} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border max-h-60">
                          {(categorySearchQuery ? filteredCategoryItems : categoryItems).map((item: MedicalItem) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{item.name}</span>
                                <span className="ml-4 text-medical-primary font-semibold">
                                  {format(item.price)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-muted-foreground">
                        {categorySearchQuery ? 'Filtered results' : 'All items'} - Select from dropdown to add to bill
                      </div>
                    </div>
                  ) : (
                    /* Regular search input for other categories */
                    !categoriesWithoutSearch.includes(selectedCategory) && (
                      <Input
                        placeholder={`Search in ${selectedCategory}...`}
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full"
                      />
                    )
                  )}
                </CardHeader>
                <CardContent>
                  {/* Show interface for Medicine, Laboratory, X-Ray */}
                  {selectedCategory === 'Laboratory' ? (
                    <div className="space-y-2">
                      {categorySearchQuery && getLabSuggestions().length > 0 ? (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Matching tests (press comma to add):
                          </div>
                          {getLabSuggestions().slice(0, 5).map((item: MedicalItem, index) => (
                            <div key={item.id} className={`text-xs p-2 rounded cursor-pointer hover:bg-muted/40 ${
                              index === 0 ? 'bg-medical-primary/10 border border-medical-primary/20' : 'bg-muted/20'
                            }`}
                                 onClick={() => {
                                   if (!selectedLabItems.find(selected => selected.id === item.id)) {
                                     setSelectedLabItems(prev => [...prev, item]);
                                   }
                                   setCategorySearchQuery('');
                                 }}>
                              <span className="font-medium">{item.name}</span> - {format(item.price)}
                              {index === 0 && (
                                <span className="ml-2 text-medical-primary text-xs">← Will be added</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <div className="text-lg font-medium mb-2">Laboratory Quick Selection</div>
                          <div className="text-sm">
                            Type test names and press comma to add as tags
                          </div>
                          <div className="text-xs mt-2 opacity-75">
                            {selectedLabItems.length > 0 ? `${selectedLabItems.length} test${selectedLabItems.length !== 1 ? 's' : ''} selected` : 'No tests selected yet'}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : ['Medicine', 'X-Ray'].includes(selectedCategory) ? (
                    <div className="space-y-2">
                      {(categorySearchQuery ? filteredCategoryItems : categoryItems).length > 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          <div className="text-lg font-medium mb-2">
                            {categorySearchQuery ? 'Search Results' : `Available ${selectedCategory} Items`}
                          </div>
                          <div className="text-sm">
                            {(categorySearchQuery ? filteredCategoryItems : categoryItems).length} item{(categorySearchQuery ? filteredCategoryItems : categoryItems).length !== 1 ? 's' : ''} 
                            {categorySearchQuery ? ' found' : ' available in database'}
                          </div>
                          <div className="text-xs mt-2 opacity-75">
                            Use the dropdown above to select and add items to your bill
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          {categorySearchQuery ? 'No items found matching your search.' : 'No items available in this category.'}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular item list for other categories */
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(categoriesWithoutSearch.includes(selectedCategory) ? categoryItems : filteredCategoryItems).length > 0 ? (
                        (categoriesWithoutSearch.includes(selectedCategory) ? categoryItems : filteredCategoryItems).map((item: MedicalItem) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
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
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          {!categoriesWithoutSearch.includes(selectedCategory) && categorySearchQuery ? 'No items found matching your search.' : 'No items in this category.'}
                        </div>
                      )}
                    </div>
                  )}
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
                    Bill Summary
                  </span>
                  {billItems.length > 0 && (
                    <Button size="sm" variant="medical-ghost" onClick={clearBill}>
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {billItems.map((item) => {
                        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                        const subtotal = price * item.quantity;
                        return (
                          <div key={item.id} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-foreground">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.category}</div>
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
                                <div className="text-sm text-muted-foreground">{format(price)} each</div>
                                <div className="font-semibold text-medical-primary">{format(subtotal)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="border-t border-medical-secondary/20 pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span className="text-foreground">Total:</span>
                        <span className="text-medical-primary">{format(calculateTotal())}</span>
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

export default Outpatient;