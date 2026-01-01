import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Plus, Trash2, Palette, Settings as SettingsIcon } from "lucide-react";
import { AppSettings, ItemCategory, InsertAppSettings } from "@shared/schema";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
  const { toast } = useToast();
  const [appName, setAppName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("222.2 47.4% 11.2%");
  
  const { data: settings, isLoading: settingsLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<ItemCategory[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName);
      setPrimaryColor(settings.primaryColor);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<InsertAppSettings>) => {
      const res = await apiRequest("PATCH", "/api/settings", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated successfully" });
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

  if (settingsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="categories">Categories & Buttons</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your application name and identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <div className="flex gap-2">
                  <Input 
                    id="appName" 
                    value={appName} 
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Enter app name"
                  />
                  <Button 
                    onClick={() => updateSettingsMutation.mutate({ appName })}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo (PNG/JPG)</Label>
                  <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
                    {settings?.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo preview" className="h-20 object-contain mb-4" />
                    )}
                    <Button variant="outline" className="w-full" asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                        <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={(e) => handleFileUpload(e, 'logo')} />
                      </label>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Favicon (PNG/JPG)</Label>
                  <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
                    {settings?.faviconUrl && (
                      <img src={settings.faviconUrl} alt="Favicon preview" className="h-10 w-10 object-contain mb-4" />
                    )}
                    <Button variant="outline" className="w-full" asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Favicon
                        <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={(e) => handleFileUpload(e, 'favicon')} />
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Theme</CardTitle>
              <CardDescription>Customize the look and feel of your application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Primary Color (HSL Hue)</Label>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {primaryColor.split(' ')[0]}°
                  </span>
                </div>
                <Slider
                  defaultValue={[parseFloat(primaryColor.split(' ')[0]) || 222]}
                  max={360}
                  step={1}
                  onValueChange={(vals) => {
                    const newColor = `${vals[0]} 47.4% 11.2%`;
                    setPrimaryColor(newColor);
                  }}
                />
                <Button 
                  className="w-full"
                  onClick={() => updateSettingsMutation.mutate({ primaryColor })}
                  disabled={updateSettingsMutation.isPending}
                >
                  Apply Theme
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary text-primary-foreground text-center">
                  Primary Preview
                </div>
                <div className="p-4 rounded-lg border-2 border-primary text-center">
                  Outline Preview
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Outpatient Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories?.filter(c => c.isOutpatient).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{cat.name}</span>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inpatient Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories?.filter(c => !c.isOutpatient).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{cat.name}</span>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
