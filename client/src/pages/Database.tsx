import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Database as DatabaseIcon, Save, X, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { 
  getAllItems, 
  addItem, 
  updateItem, 
  deleteItem, 
  getCategories,
  DatabaseItem 
} from '@/lib/database';

const Database = () => {
  const [items, setItems] = useState<DatabaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'outpatient' | 'inpatient'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<DatabaseItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    isOutpatient: true
  });
  
  const { toast } = useToast();

  const allCategories = [
    ...getCategories(true),
    ...getCategories(false)
  ].filter((category, index, arr) => arr.indexOf(category) === index);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const allItems = getAllItems();
    setItems(allItems);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'outpatient' && item.isOutpatient) ||
                       (filterType === 'inpatient' && !item.isOutpatient);
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      isOutpatient: formData.isOutpatient
    };

    try {
      if (editingItem) {
        updateItem(editingItem.id, itemData);
        toast({
          title: "Success",
          description: "Item updated successfully"
        });
      } else {
        addItem(itemData);
        toast({
          title: "Success",
          description: "Item added successfully"
        });
      }
      
      loadItems();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        deleteItem(id);
        loadItems();
        toast({
          title: "Success",
          description: "Item deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive"
        });
      }
    }
  };

  const startEdit = (item: DatabaseItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || '',
      isOutpatient: item.isOutpatient
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      isOutpatient: true
    });
    setEditingItem(null);
    setIsAdding(false);
  };

  // Carousel navigation functions
  const handleCategoryClick = (category: string) => {
    if (isCarouselMode && category === filterCategory) {
      // If already in carousel mode and same category clicked, exit carousel
      setIsCarouselMode(false);
      setFilterCategory('all');
    } else {
      setFilterCategory(category);
      setIsCarouselMode(true);
      setCurrentCategoryIndex(allCategories.indexOf(category));
    }
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentCategoryIndex - 1 + allCategories.length) % allCategories.length
      : (currentCategoryIndex + 1) % allCategories.length;
    
    setCurrentCategoryIndex(newIndex);
    setFilterCategory(allCategories[newIndex]);
  };

  const exitCarousel = () => {
    setIsCarouselMode(false);
    setFilterCategory('all');
    setSearchQuery(''); // Clear search when exiting carousel
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            <DatabaseIcon className="h-8 w-8 mr-3 text-primary" />
            Database Management
          </h1>
          <p className="text-muted-foreground">Manage medical items and their prices</p>
        </div>

        {/* Add/Edit Form */}
        {isAdding && (
          <Card className="mb-6 shadow-card border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingItem ? 'Edit Item' : 'Add New Item'}</span>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Item Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Price *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Category *</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {allCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Type *</label>
                  <Select 
                    value={formData.isOutpatient ? 'outpatient' : 'inpatient'} 
                    onValueChange={(value) => setFormData({ ...formData, isOutpatient: value === 'outpatient' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="outpatient">Outpatient</SelectItem>
                      <SelectItem value="inpatient">Inpatient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary-hover">
                  <Save className="h-4 w-4 mr-2" />
                  {editingItem ? 'Update' : 'Add'} Item
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div>
            <Button 
              onClick={() => setIsAdding(true)}
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Search - Hidden in carousel mode */}
          {!isCarouselMode && (
            <div>
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          
          <div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="outpatient">Outpatient</SelectItem>
                <SelectItem value="inpatient">Inpatient</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Carousel Navigation */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-medical-primary">
              <span className="flex items-center">
                <Grid3X3 className="mr-2 h-5 w-5" />
                Browse Categories
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Add Items Button - Always visible */}
                <Button
                  variant="medical"
                  className="h-auto p-3 text-left justify-start border-2 border-dashed border-medical-primary/50"
                  onClick={() => setIsAdding(true)}
                  disabled={isAdding}
                >
                  <div>
                    <div className="font-semibold text-sm flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Items
                    </div>
                    <div className="text-xs opacity-75">Create new medical item</div>
                  </div>
                </Button>
                
                {allCategories.map((category) => {
                  const itemCount = items.filter(item => item.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant="medical-outline"
                      className="h-auto p-3 text-left justify-start"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div>
                        <div className="font-semibold text-sm truncate">{category}</div>
                        <div className="text-xs opacity-75">{itemCount} items</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              // Carousel mode with preview buttons
              <div>
                {/* Category Navigation */}
                <div className="flex items-center justify-center space-x-2">
                  {/* Previous preview button */}
                  <Button
                    variant="medical-ghost"
                    className="h-auto p-2 text-left flex-shrink-0 opacity-60 hover:opacity-80 max-w-[80px] justify-start"
                    onClick={() => navigateCarousel('prev')}
                  >
                    <div className="w-full">
                      <div className="text-xs truncate text-left">
                        {allCategories[(currentCategoryIndex - 1 + allCategories.length) % allCategories.length]}
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
                    className="h-auto p-4 text-center flex-1 max-w-[200px]"
                    onClick={() => handleCategoryClick(filterCategory)}
                  >
                    <div>
                      <div className="font-semibold text-sm">{filterCategory}</div>
                      <div className="text-xs opacity-75">
                        {items.filter(item => item.category === filterCategory).length} items
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
                        {allCategories[(currentCategoryIndex + 1) % allCategories.length]}
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {isCarouselMode && filterCategory !== 'all' 
                ? `${filterCategory} Items (${filteredItems.length} found)`
                : `Items (${filteredItems.length} found)`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length > 0 ? (
              <div className="space-y-3">
                {filteredItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-foreground">{item.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.isOutpatient 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-accent text-accent-foreground'
                        }`}>
                          {item.isOutpatient ? 'Outpatient' : 'Inpatient'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">৳{item.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DatabaseIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || filterType !== 'all' || filterCategory !== 'all'
                    ? 'No items match your filters'
                    : 'No items in database yet. Add some items to get started.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Database;