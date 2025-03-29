import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Billing = () => {
  const { user } = useAuth();
  
  // Fetch billing history
  const { data: billingHistory, isLoading: historyLoading } = useQuery({
    queryKey: [`/api/billings/${user?.id}/history`],
    enabled: !!user,
  });
  
  // Fetch payment methods
  const { data: paymentMethods, isLoading: methodsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/payment-methods`],
    enabled: !!user,
  });

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Billing Overview</CardTitle>
              <CardDescription>
                Review your current plan and upcoming charges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold mb-1">
                        {user?.currentPlan === "monthly" ? "Monthly Pass" :
                          user?.currentPlan === "weekly" ? "Weekly Pass" :
                          user?.currentPlan === "daily" ? "Daily Rate" : "Hourly Rate"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.currentPlan === "monthly" ? "₦68,000 / month" :
                          user?.currentPlan === "weekly" ? "₦20,000 / week" :
                          user?.currentPlan === "daily" ? "₦4,000 / day" : "₦500 / hour"}
                      </p>
                    </div>
                    <Button>Change Plan</Button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Next Billing Date</h3>
                    <p className="text-2xl font-bold">June 15, 2023</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your subscription will auto-renew
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Amount Due</h3>
                    <p className="text-2xl font-bold">₦68,000</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Next billing period
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button className="mr-4">Pay Now</Button>
                  <Button variant="outline">Download Invoice</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past transactions and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-3 w-24 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : billingHistory && billingHistory.length > 0 ? (
                <div className="space-y-4">
                  {billingHistory.map((bill: any) => (
                    <div key={bill.id} className="flex justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {bill.planType.charAt(0).toUpperCase() + bill.planType.slice(1)} Plan
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(bill.startDate), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₦{bill.amount.toLocaleString()}</p>
                        <p className={`text-sm ${
                          bill.status === "paid" 
                            ? "text-green-600 dark:text-green-400" 
                            : bill.status === "pending" 
                            ? "text-yellow-600 dark:text-yellow-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No billing history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your saved payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {methodsLoading ? (
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-14 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paymentMethods && paymentMethods.length > 0 ? (
                <div className="space-y-4">
                  {paymentMethods.map((method: any) => (
                    <div key={method.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                            {method.type === "card" ? (
                              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 10H22" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            ) : (
                              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 8H6C4.89543 8 4 8.89543 4 10V14C4 15.1046 4.89543 16 6 16H18C19.1046 16 20 15.1046 20 14V10C20 8.89543 19.1046 8 18 8Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 12C12 10.8954 11.1046 10 10 10C8.89543 10 8 10.8954 8 12C8 13.1046 8.89543 14 10 14C11.1046 14 12 13.1046 12 12Z" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {method.type === "card" ? `**** **** **** ${method.last4}` : method.email}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Button variant="ghost" size="sm">Remove</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button className="mt-4">Add Payment Method</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No payment methods added yet</p>
                  <Button>Add Payment Method</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
