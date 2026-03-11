import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { 
  Loader2, Save, Upload, Plus, Trash2, Palette, Settings as SettingsIcon, 
  Pipette, Download, RefreshCw, Database, Terminal, Search, AlertTriangle
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

export default function Settings() {
  const { toast } = useToast();
  const [appName, setAppName] = useState("");
  const [primaryColorHue, setPrimaryColorHue] = useState(160);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isOutpatientCategory, setIsOutpatientCategory] = useState(true);
  const [sqlQuery, setSqlQuery] = useState("SELECT COUNT(*) FROM sqlite_master;");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  
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
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted successfully" });
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

  const handleResetDatabase = () => {
    if (confirm('Are you sure you want to reset the database to defaults? This cannot be undone.')) {
      fetch('/api/reset-database', { method: 'POST' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/settings", "/api/categories"] });
          toast({ title: "Database reset to defaults" });
        })
        .catch(err => toast({ title: "Error resetting database", variant: "destructive" }));
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Outpatient Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {outpatientCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                      <span className="font-medium">{cat.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
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
                <CardContent className="space-y-4">
                  {inpatientCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                      <span className="font-medium">{cat.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
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
                <div className="flex gap-4">
                  <Button 
                    variant={isOutpatientCategory ? "default" : "outline"}
                    onClick={() => setIsOutpatientCategory(true)}
                  >
                    Outpatient
                  </Button>
                  <Button 
                    variant={!isOutpatientCategory ? "default" : "outline"}
                    onClick={() => setIsOutpatientCategory(false)}
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

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Presets</CardTitle>
                <CardDescription>Quick theme color presets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyThemePreset(preset.hue)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        Math.abs(primaryColorHue - preset.hue) < 5 
                          ? 'border-primary' 
                          : 'border-muted'
                      }`}
                      style={{ backgroundColor: `hsl(${preset.hue}, 60%, 45%)` }}
                    >
                      <div className="text-white text-sm font-semibold">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Color</CardTitle>
                <CardDescription>Adjust primary color hue (0-360°)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
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
                </div>
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
                      <Button variant="outline" className="w-full" asChild>
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
                      <Button variant="outline" className="w-full" asChild>
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
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Backup, restore, and manage your database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={handleResetDatabase} variant="destructive" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" /> Reset to Defaults
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" /> Export Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Database Version</div>
                    <div className="text-lg font-bold">SQLite 3</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Categories</div>
                    <div className="text-lg font-bold">{categories?.length || 0}</div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-900">System Health</div>
                    <div className="text-sm text-amber-800">All systems operational</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
