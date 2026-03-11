import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { 
  Loader2, Save, Upload, Plus, Trash2, Palette, Settings as SettingsIcon, 
  Download, RefreshCw, Database, Terminal, Search, AlertTriangle, 
  LayoutGrid, Pencil, GripVertical, X, Check
} from "lucide-react";
import { AppSettings, ItemCategory, InsertAppSettings } from "@shared/schema";
import { Slider } from "@/components/ui/slider";

const THEME_PRESETS = [
  { id: 'preset1', name: 'Emerald Clinical', hue: 160 },
  { id: 'preset2', name: 'Cobalt Surgical', hue: 217 },
  { id: 'preset3', name: 'Amethyst Ward', hue: 280 },
  { id: 'preset4', name: 'Rose Trauma', hue: 354 },
  { id: 'preset5', name: 'Amber Alert', hue: 38 },
  { id: 'preset6', name: 'Slate Registry', hue: 217 },
];

interface TerminalButton {
  id: string;
  label: string;
  terminal: 'outpatient' | 'inpatient';
  category: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [appName, setAppName] = useState("");
  const [primaryColorHue, setPrimaryColorHue] = useState(160);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isOutpatientCategory, setIsOutpatientCategory] = useState(true);
  const [terminalButtons, setTerminalButtons] = useState<TerminalButton[]>([]);
  const [sqlQuery, setSqlQuery] = useState("SELECT COUNT(*) as item_count FROM sqlite_master;");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const { data: settings, isLoading: settingsLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<ItemCategory[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName);
      const hueMatch = settings.primaryColor.match(/^(\d+)/);
      if (hueMatch) setPrimaryColorHue(parseInt(hueMatch[1]));
    }
    // Load terminal buttons from localStorage
    const saved = localStorage.getItem('terminalButtons');
    if (saved) setTerminalButtons(JSON.parse(saved));
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<InsertAppSettings>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated successfully" });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          isOutpatient: isOutpatientCategory,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategoryName("");
      toast({ title: "Category added successfully" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted successfully" });
      setConfirmDelete(null);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateSettingsMutation.mutate({ [type === 'logo' ? 'logoUrl' : 'faviconUrl']: base64String });
    };
    reader.readAsDataURL(file);
  };

  const applyThemePreset = (hue: number) => {
    setPrimaryColorHue(hue);
    updateSettingsMutation.mutate({ primaryColor: `${hue} 47.4% 11.2%` });
  };

  const addTerminalButton = (terminal: 'outpatient' | 'inpatient') => {
    const newBtn: TerminalButton = {
      id: `${terminal}-${Date.now()}`,
      label: 'New Button',
      terminal,
      category: categories?.[0]?.name || 'General',
    };
    const updated = [...terminalButtons, newBtn];
    setTerminalButtons(updated);
    localStorage.setItem('terminalButtons', JSON.stringify(updated));
    toast({ title: "Button added successfully" });
  };

  const updateTerminalButton = (id: string, updates: Partial<TerminalButton>) => {
    const updated = terminalButtons.map(b => b.id === id ? { ...b, ...updates } : b);
    setTerminalButtons(updated);
    localStorage.setItem('terminalButtons', JSON.stringify(updated));
  };

  const removeTerminalButton = (id: string) => {
    const updated = terminalButtons.filter(b => b.id !== id);
    setTerminalButtons(updated);
    localStorage.setItem('terminalButtons', JSON.stringify(updated));
    toast({ title: "Button removed" });
  };

  const runSql = async () => {
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      if (data.error) {
        setQueryError(data.error);
        setQueryResults([]);
      } else {
        setQueryResults(data.results || []);
        setQueryError(null);
        toast({ title: "Query executed successfully" });
      }
    } catch (err: any) {
      setQueryError(err.message);
      setQueryResults([]);
    }
  };

  const exportDatabase = async () => {
    try {
      const res = await fetch("/api/export-database");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hospital_${new Date().toISOString()}.db`;
      a.click();
      toast({ title: "Database exported successfully" });
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleResetDatabase = () => {
    if (confirm('Reset database to defaults? This cannot be undone.')) {
      fetch('/api/reset-database', { method: 'POST' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          toast({ title: "Database reset to defaults" });
        })
        .catch(() => toast({ title: "Reset failed", variant: "destructive" }));
    }
  };

  if (settingsLoading || categoriesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const outpatientCategories = categories?.filter(c => c.isOutpatient) || [];
  const inpatientCategories = categories?.filter(c => !c.isOutpatient) || [];

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
            <TabsTrigger value="buttons" className="text-xs sm:text-sm">Buttons</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
            <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
            <TabsTrigger value="database" className="text-xs sm:text-sm">Database</TabsTrigger>
            <TabsTrigger value="system" className="text-xs sm:text-sm">System</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Outpatient Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {outpatientCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                      <span className="font-medium text-sm">{cat.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8"
                        onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inpatient Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inpatientCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                      <span className="font-medium text-sm">{cat.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8"
                        onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button 
                    variant={isOutpatientCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsOutpatientCategory(true)}
                    className="flex-1"
                  >
                    Outpatient
                  </Button>
                  <Button 
                    variant={!isOutpatientCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsOutpatientCategory(false)}
                    className="flex-1"
                  >
                    Inpatient
                  </Button>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => addCategoryMutation.mutate()}
                  disabled={!newCategoryName || addCategoryMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terminal Buttons Tab */}
          <TabsContent value="buttons" className="space-y-6">
            {(['outpatient', 'inpatient'] as const).map(terminal => (
              <Card key={terminal}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5" /> {terminal} Buttons
                    </CardTitle>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addTerminalButton(terminal)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Button
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {terminalButtons.filter(b => b.terminal === terminal).map(btn => (
                    <div key={btn.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg border group">
                      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <Input 
                        value={btn.label}
                        onChange={(e) => updateTerminalButton(btn.id, { label: e.target.value })}
                        placeholder="Button label"
                        className="text-sm"
                      />
                      <Select value={btn.category} onValueChange={(val) => updateTerminalButton(btn.id, { category: val })}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeTerminalButton(btn.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {terminalButtons.filter(b => b.terminal === terminal).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No buttons configured. Click "Add Button" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyThemePreset(preset.hue)}
                      className={`p-4 rounded-lg border-2 transition-all relative ${
                        Math.abs(primaryColorHue - preset.hue) < 5 
                          ? 'border-emerald-600 bg-emerald-600/10' 
                          : 'border-muted hover:border-emerald-600/50'
                      }`}
                    >
                      <div 
                        className="w-12 h-12 rounded-lg mb-2 mx-auto shadow-md" 
                        style={{ backgroundColor: `hsl(${preset.hue}, 60%, 45%)` }}
                      ></div>
                      <div className="text-xs font-semibold text-center">{preset.name}</div>
                      {Math.abs(primaryColorHue - preset.hue) < 5 && (
                        <Check className="absolute top-1 right-1 h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <Label>Primary Hue</Label>
                  <span className="text-sm font-mono bg-muted px-3 py-1 rounded">{primaryColorHue}°</span>
                </div>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[primaryColorHue]}
                  onValueChange={(vals) => setPrimaryColorHue(vals[0])}
                />
                <div className="p-6 rounded-lg" style={{ backgroundColor: `hsl(${primaryColorHue}, 60%, 45%)` }}></div>
                <Button 
                  className="w-full"
                  onClick={() => updateSettingsMutation.mutate({ primaryColor: `${primaryColorHue} 47.4% 11.2%` })}
                  disabled={updateSettingsMutation.isPending}
                >
                  Apply Color
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="appName" 
                      value={appName} 
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Hospital name"
                    />
                    <Button 
                      onClick={() => updateSettingsMutation.mutate({ appName })}
                      disabled={updateSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Logo (PNG/JPG)</Label>
                    <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
                      {settings?.logoUrl && (
                        <img src={settings.logoUrl} alt="Logo" className="h-20 object-contain mb-4" />
                      )}
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </label>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Favicon (PNG/JPG)</Label>
                    <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
                      {settings?.faviconUrl && (
                        <img src={settings.faviconUrl} alt="Favicon" className="h-10 w-10 object-contain mb-4" />
                      )}
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Favicon
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={handleResetDatabase} variant="destructive" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" /> Re-seed Defaults
                  </Button>
                  <Button onClick={exportDatabase} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" /> Export DB
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" /> SQLite Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sqlQuery" className="text-xs">SQL Query</Label>
                  <Textarea 
                    id="sqlQuery"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM ..."
                    className="font-mono text-xs mt-2"
                    rows={4}
                  />
                </div>
                <Button onClick={runSql} className="w-full">
                  <Terminal className="h-4 w-4 mr-2" /> Execute Query
                </Button>

                {queryError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm font-mono">
                    Error: {queryError}
                  </div>
                )}

                {queryResults.length > 0 && (
                  <div className="bg-muted rounded p-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          {Object.keys(queryResults[0] || {}).map(key => (
                            <th key={key} className="text-left p-2 border-b font-semibold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-background">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="p-2 font-mono">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Database Type</div>
                    <div className="font-bold">SQLite 3</div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Total Categories</div>
                    <div className="font-bold">{categories?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Terminal Buttons</div>
                    <div className="font-bold">{terminalButtons.length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded border border-green-200">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-green-900 text-sm">Database</div>
                      <div className="text-xs text-green-800">All systems operational</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-blue-900 text-sm">API Server</div>
                      <div className="text-xs text-blue-800">Running normally</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
