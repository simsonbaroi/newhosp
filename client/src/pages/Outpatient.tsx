import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import { 
  getCategories, 
  getItemsByCategory, 
  searchItems, 
  saveBill, 
  loadBill,
  DatabaseItem,
  BillItem 
} from '@/lib/database';

const Outpatient = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryItems, setCategoryItems] = useState<DatabaseItem[]>([]);
  const [filteredCategoryItems, setFilteredCategoryItems] = useState<DatabaseItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [globalSearchResults, setGlobalSearchResults] = useState<DatabaseItem[]>([]);
  
  const categories = getCategories(true);

  useEffect(() => {
    const savedBill = loadBill('outpatient');
    setBillItems(savedBill);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const items = getItemsByCategory(selectedCategory, true);
      setCategoryItems(items);
      setCategorySearchQuery(''); // Reset category search when changing category
    }
  }, [selectedCategory]);

  // Filter category items based on category search
  useEffect(() => {
    if (categorySearchQuery && categoryItems.length > 0) {
      const filtered = categoryItems.filter(item =>
        item.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
      );
      setFilteredCategoryItems(filtered);
    } else {
      setFilteredCategoryItems(categoryItems);
    }
  }, [categorySearchQuery, categoryItems]);

  useEffect(() => {
    if (globalSearchQuery) {
      const results = searchItems(globalSearchQuery, true);
      setGlobalSearchResults(results);
    } else {
      setGlobalSearchResults([]);
    }
  }, [globalSearchQuery]);

  useEffect(() => {
    saveBill('outpatient', billItems);
  }, [billItems]);

  const addToBill = (item: DatabaseItem, quantity: number = 1) => {
    const existingItem = billItems.find(billItem => billItem.id === item.id);
    
    if (existingItem) {
      setBillItems(billItems.map(billItem =>
        billItem.id === item.id
          ? { ...billItem, quantity: billItem.quantity + quantity }
          : billItem
      ));
    } else {
      const newBillItem: BillItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        category: item.category
      };
      setBillItems([...billItems, newBillItem]);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setBillItems(billItems.filter(item => item.id !== id));
    } else {
      setBillItems(billItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const total = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const ItemCard = ({ item }: { item: DatabaseItem }) => (
    <Card className="mb-2 hover:shadow-hover transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.category}</p>
            <p className="text-lg font-bold text-primary">₱{item.price.toLocaleString()}</p>
          </div>
          <Button 
            onClick={() => addToBill(item)}
            size="sm"
            className="bg-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Outpatient Calculator</h1>
          <p className="text-muted-foreground">Select items and calculate outpatient bills with search and dropdown functionality</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Categories and Items */}
          <div className="space-y-6">
            {/* Search */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-primary" />
                  Search Items
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
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {globalSearchResults.map(item => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Selection */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Select Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className={`text-xs px-4 py-3 h-auto text-left justify-start rounded-xl border-2 font-medium transition-all duration-300 transform ${
                        selectedCategory === category 
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-xl border-primary scale-105 ring-2 ring-primary/20' 
                          : 'bg-white dark:bg-card hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-lg hover:border-primary/40 hover:scale-102 border-border shadow-sm active:scale-95'
                      }`}
                    >
                      <span className="truncate">{category}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Items */}
            {selectedCategory && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedCategory} Items</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredCategoryItems.length} item{filteredCategoryItems.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Category Search and Dropdown */}
                  <div className="space-y-4 mb-4">
                    {/* Search within category */}
                    <div>
                      <Input
                        placeholder={`Search in ${selectedCategory}...`}
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Dropdown for category items */}
                    <div>
                      <Select 
                        value="" 
                        onValueChange={(value) => {
                          const item = categoryItems.find(i => i.id === value);
                          if (item) addToBill(item);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select from ${selectedCategory} dropdown`} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border max-h-60">
                          {categoryItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{item.name}</span>
                                <span className="ml-4 font-bold text-primary">৳{item.price.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="max-h-96 overflow-y-auto border-t pt-4">
                    {filteredCategoryItems.length > 0 ? (
                      filteredCategoryItems.map(item => (
                        <ItemCard key={item.id} item={item} />
                      ))
                    ) : categorySearchQuery ? (
                      <p className="text-muted-foreground text-center py-8">
                        No items found matching "{categorySearchQuery}" in {selectedCategory}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No items found in this category
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Live Bill */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <Card className="shadow-card">
              <CardHeader className="bg-medical-gradient text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Live Bill Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {billItems.length > 0 ? (
                  <div className="space-y-4">
                    {billItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          <p className="text-sm font-medium text-primary">৳{item.price.toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-bold text-lg">৳{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div style={{background: 'linear-gradient(to right, #065f46, #14532d)', borderColor: '#047857'}} className="text-white p-6 rounded-xl shadow-2xl border-2">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span style={{color: '#a7f3d0'}} className="text-sm font-medium mb-1">Grand Total</span>
                            <span className="text-2xl font-bold">৳{total.toLocaleString()}</span>
                          </div>
                          <div style={{backgroundColor: 'rgba(5, 150, 105, 0.5)'}} className="p-3 rounded-full">
                            <Calculator className="h-6 w-6" style={{color: '#a7f3d0'}} />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center text-sm" style={{color: '#a7f3d0'}}>
                          <span style={{backgroundColor: 'rgba(5, 150, 105, 0.3)'}} className="px-2 py-1 rounded-full text-xs mr-2">
                            {billItems.length} item{billItems.length !== 1 ? 's' : ''}
                          </span>
                          <span>Outpatient Services</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No items selected yet. Start adding items to calculate the bill.
                    </p>
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