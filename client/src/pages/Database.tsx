import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Database as DatabaseIcon, Save, X } from 'lucide-react';
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
          
          <div>
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
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

        {/* Items List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              Items ({filteredItems.length} found)
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
                        <p className="text-xl font-bold text-primary">₱{item.price.toLocaleString()}</p>
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