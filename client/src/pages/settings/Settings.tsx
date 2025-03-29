import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Settings = () => {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [activityAlerts, setActivityAlerts] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveNotifications = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    }, 1000);
  };
  
  const exportData = () => {
    toast({
      title: "Data Export Initiated",
      description: "Your data export is being prepared and will be emailed to you.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button variant="outline">Change Password</Button>
                  <Button variant="outline">Configure Two-Factor Authentication</Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data & Privacy</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button variant="outline" onClick={exportData}>
                    Export Your Data
                  </Button>
                  <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400">
                    Delete Account
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sessions</h3>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Chrome on Windows • Last active now
                      </p>
                    </div>
                    <div>
                      <div className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline">Log Out All Other Devices</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive important notifications via SMS
                        </p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={smsNotifications}
                        onCheckedChange={setSmsNotifications}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="activity-alerts">Check-in/out Alerts</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Notifications about your workspace activity
                        </p>
                      </div>
                      <Switch
                        id="activity-alerts"
                        checked={activityAlerts}
                        onCheckedChange={setActivityAlerts}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="billing-alerts">Billing Alerts</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Payment receipts and billing reminders
                        </p>
                      </div>
                      <Switch
                        id="billing-alerts"
                        checked={billingAlerts}
                        onCheckedChange={setBillingAlerts}
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Notification Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer ${
                        theme === "light" ? "border-primary" : ""
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      <div className="h-20 bg-white border rounded-md mb-2"></div>
                      <p className="font-medium text-center">Light</p>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer ${
                        theme === "dark" ? "border-primary" : ""
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      <div className="h-20 bg-gray-900 border rounded-md mb-2"></div>
                      <p className="font-medium text-center">Dark</p>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer ${
                        theme === "system" ? "border-primary" : ""
                      }`}
                      onClick={() => setTheme("system")}
                    >
                      <div className="h-20 bg-gradient-to-r from-white to-gray-900 border rounded-md mb-2"></div>
                      <p className="font-medium text-center">System</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Language</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg cursor-pointer border-primary">
                      <p className="font-medium">English (US)</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Default language
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer">
                      <p className="font-medium">Add Language</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure additional languages
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
