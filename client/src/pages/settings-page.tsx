import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";
import { Settings, Save, UserCircle, BellRing, Shield, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Settings</h1>
            <p className="text-neutral-600 mb-6">
              Manage your account settings and preferences.
            </p>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full md:w-[600px] grid-cols-4 mb-8">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserCircle className="h-5 w-5 mr-2" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Update your account details and personal information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={user?.username || ""} readOnly />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" defaultValue={user?.fullName || ""} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={user?.email || ""} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" defaultValue="Acme Corporation" />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea 
                        id="bio" 
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about yourself"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={handleSaveSettings}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BellRing className="h-5 w-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Manage how and when you receive notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-neutral-500">
                          Receive email notifications for important updates and alerts.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Security Alerts</h3>
                        <p className="text-sm text-neutral-500">
                          Get notified about potential security issues in your Salesforce org.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Product Updates</h3>
                        <p className="text-sm text-neutral-500">
                          Receive notifications about new features and product updates.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Marketing Communications</h3>
                        <p className="text-sm text-neutral-500">
                          Receive occasional marketing communications and newsletters.
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={handleSaveSettings}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and authentication settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Change Password</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                      </div>
                      
                      <Button className="mt-2">Update Password</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-neutral-500">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Session Timeout</h3>
                          <p className="text-sm text-neutral-500">
                            Automatically log out after a period of inactivity.
                          </p>
                        </div>
                        <select className="flex h-10 w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60" selected>1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="240">4 hours</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={handleSaveSettings}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Security Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="advanced">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>
                      Customize advanced application settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Data Caching</h3>
                        <p className="text-sm text-neutral-500">
                          Cache metadata for faster loading times.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Auto-refresh Analysis</h3>
                        <p className="text-sm text-neutral-500">
                          Automatically refresh analysis data when connecting to an org.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Default API Version</h3>
                      <p className="text-sm text-neutral-500 mb-2">
                        Select the default Salesforce API version to use for queries.
                      </p>
                      <select className="flex h-10 w-full max-w-xs items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <option value="60.0">API v60.0 (Spring '24)</option>
                        <option value="59.0" selected>API v59.0 (Winter '24)</option>
                        <option value="58.0">API v58.0 (Summer '23)</option>
                        <option value="57.0">API v57.0 (Spring '23)</option>
                      </select>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Display Density</h3>
                          <p className="text-sm text-neutral-500">
                            Choose how compact the UI should be.
                          </p>
                        </div>
                        <select className="flex h-10 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="compact">Compact</option>
                          <option value="normal" selected>Normal</option>
                          <option value="comfortable">Comfortable</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button onClick={handleSaveSettings}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Advanced Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}