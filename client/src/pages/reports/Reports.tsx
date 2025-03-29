import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FileDown, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const Reports = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [period, setPeriod] = useState("monthly");
  
  // Format the date range for display
  const getDateRangeText = () => {
    if (!date) return "Select date range";
    
    if (period === "daily") {
      return format(date, "MMMM d, yyyy");
    } else if (period === "weekly") {
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 6);
      return `${format(date, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    } else if (period === "monthly") {
      return format(date, "MMMM yyyy");
    } else {
      return format(date, "yyyy");
    }
  };
  
  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/reports/attendance`, { period, date: date?.toISOString() }],
    enabled: !!user && !!date,
  });
  
  // Fetch usage data
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/reports/usage`, { period, date: date?.toISOString() }],
    enabled: !!user && !!date,
  });
  
  // Fetch billing data
  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/reports/billing`, { period, date: date?.toISOString() }],
    enabled: !!user && !!date,
  });
  
  // Function to download reports
  const downloadReport = (reportType: string) => {
    // In a real application, this would call an API endpoint to generate a PDF or CSV
    console.log(`Downloading ${reportType} report`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={(value) => setPeriod(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{getDateRangeText()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Attendance Report</CardTitle>
                <CardDescription>
                  View your check-in and check-out activity
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport("attendance")}>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-72 w-full" />
                </div>
              ) : attendanceData && attendanceData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium text-sm">Date</th>
                        <th className="text-left py-3 font-medium text-sm">Check In</th>
                        <th className="text-left py-3 font-medium text-sm">Check Out</th>
                        <th className="text-left py-3 font-medium text-sm">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((record: any) => (
                        <tr key={record.id} className="border-b">
                          <td className="py-3 text-sm">
                            {format(new Date(record.checkInTime), "MMM d, yyyy")}
                          </td>
                          <td className="py-3 text-sm">
                            {format(new Date(record.checkInTime), "h:mm a")}
                          </td>
                          <td className="py-3 text-sm">
                            {record.checkOutTime
                              ? format(new Date(record.checkOutTime), "h:mm a")
                              : "—"}
                          </td>
                          <td className="py-3 text-sm">
                            {record.duration
                              ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No attendance data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Usage Report</CardTitle>
                <CardDescription>
                  Analyze your workspace usage patterns
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport("usage")}>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-72 w-full" />
                </div>
              ) : usageData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(usageData.totalMinutes / 60)}h {usageData.totalMinutes % 60}m
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Daily Usage</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(usageData.avgDailyMinutes / 60)}h {usageData.avgDailyMinutes % 60}m
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Peak Usage Day</p>
                      <p className="text-2xl font-bold">{usageData.peakDay}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Usage by Day of Week</h3>
                    <div className="space-y-3">
                      {usageData.dayBreakdown.map((day: any) => (
                        <div key={day.day} className="flex items-center">
                          <div className="w-20 text-sm">{day.day}</div>
                          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${day.percentage}%` }}
                            />
                          </div>
                          <div className="w-20 text-sm text-right">
                            {Math.floor(day.minutes / 60)}h {day.minutes % 60}m
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No usage data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Billing Report</CardTitle>
                <CardDescription>
                  Track your workspace expenses
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport("billing")}>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-72 w-full" />
                </div>
              ) : billingData && billingData.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium text-sm">Date</th>
                          <th className="text-left py-3 font-medium text-sm">Plan</th>
                          <th className="text-left py-3 font-medium text-sm">Amount</th>
                          <th className="text-left py-3 font-medium text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingData.map((record: any) => (
                          <tr key={record.id} className="border-b">
                            <td className="py-3 text-sm">
                              {format(new Date(record.startDate), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 text-sm capitalize">
                              {record.planType}
                            </td>
                            <td className="py-3 text-sm">
                              ₦{record.amount.toLocaleString()}
                            </td>
                            <td className="py-3 text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                record.status === "paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : record.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Billing Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                        <p className="text-2xl font-bold">
                          ₦{billingData.reduce((sum: number, record: any) => sum + record.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Average Per Month</p>
                        <p className="text-2xl font-bold">₦68,000</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Most Used Plan</p>
                        <p className="text-2xl font-bold capitalize">Monthly</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No billing data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
