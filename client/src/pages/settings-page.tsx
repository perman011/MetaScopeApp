import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Bell, Shield, Database, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 lg:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Settings</h1>
              <p className="text-neutral-500 mt-1">Manage your account and application preferences</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button 
                    variant={activeTab === "account" ? "secondary" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("account")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                  <Button 
                    variant={activeTab === "notifications" ? "secondary" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  <Button 
                    variant={activeTab === "security" ? "secondary" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("security")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Button>
                  <Button 
                    variant={activeTab === "api" ? "secondary" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("api")}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    API Settings
                  </Button>
                </nav>
              </CardContent>
            </Card>
            
            <div className="lg:col-span-3">
              {activeTab === "account" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your personal account information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input id="full-name" defaultValue={user?.name || ""} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={user?.email || ""} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue={user?.username || ""} disabled />
                      <p className="text-xs text-neutral-500">Username cannot be changed</p>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">Email Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-sync">Sync Completion</Label>
                          <p className="text-sm text-neutral-500">Receive notifications when metadata sync completes</p>
                        </div>
                        <Switch id="email-sync" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-security">Security Alerts</Label>
                          <p className="text-sm text-neutral-500">Receive notifications about critical security issues</p>
                        </div>
                        <Switch id="email-security" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-newsletter">Product Updates</Label>
                          <p className="text-sm text-neutral-500">Receive product updates and newsletters</p>
                        </div>
                        <Switch id="email-newsletter" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">In-App Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="app-sync">Sync Status</Label>
                          <p className="text-sm text-neutral-500">Show notifications for sync status changes</p>
                        </div>
                        <Switch id="app-sync" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="app-issues">New Issues</Label>
                          <p className="text-sm text-neutral-500">Show notifications when new issues are detected</p>
                        </div>
                        <Switch id="app-issues" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "security" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">Password</h3>
                      
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
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">Two-Factor Authentication</h3>
                      
                      <div className="bg-primary-50 p-4 rounded-md">
                        <p className="text-sm text-primary-800">Two-factor authentication is not enabled yet. Enable it to add an extra layer of security.</p>
                        <Button className="mt-2" variant="outline" size="sm">
                          Enable 2FA
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">Session Settings</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-logout">Automatic Logout</Label>
                          <p className="text-sm text-neutral-500">Automatically log out after 24 hours of inactivity</p>
                        </div>
                        <Switch id="auto-logout" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "api" && (
                <Card>
                  <CardHeader>
                    <CardTitle>API Settings</CardTitle>
                    <CardDescription>
                      Manage API keys and integration settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">API Keys</h3>
                      
                      <div className="p-4 border border-neutral-200 rounded-md">
                        <p className="text-sm text-neutral-600 mb-2">No API keys have been generated yet</p>
                        <Button variant="outline" size="sm">
                          Generate API Key
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-700">Salesforce API Settings</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="api-version">Default API Version</Label>
                        <select id="api-version" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option>v58.0</option>
                          <option selected>v57.0</option>
                          <option>v56.0</option>
                          <option>v55.0</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="bulk-api">Use Bulk API</Label>
                          <p className="text-sm text-neutral-500">Use Bulk API for large data sets when possible</p>
                        </div>
                        <Switch id="bulk-api" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="metadata-cache">Cache Metadata</Label>
                          <p className="text-sm text-neutral-500">Cache metadata to improve performance</p>
                        </div>
                        <Switch id="metadata-cache" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
