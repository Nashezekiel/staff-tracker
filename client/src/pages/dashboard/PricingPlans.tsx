import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string;
  rate: number;
  period: string;
  badge?: {
    text: string;
    className: string;
  };
}

interface PricingPlansProps {
  currentPlan?: string;
}

const PricingPlans = ({ currentPlan = "monthly" }: PricingPlansProps) => {
  const { toast } = useToast();
  const [isChanging, setIsChanging] = useState(false);
  
  const plans: Plan[] = [
    {
      id: "hourly",
      name: "Hourly Rate",
      description: "Pay only for the time you use",
      rate: 500,
      period: "hour",
      badge: {
        text: "Flexible",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
    },
    {
      id: "daily",
      name: "Daily Rate",
      description: "Full day access",
      rate: 4000,
      period: "day",
    },
    {
      id: "weekly",
      name: "Weekly Pass",
      description: "7 consecutive days",
      rate: 20000,
      period: "week",
      badge: {
        text: "Save 20%",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
    },
    {
      id: "monthly",
      name: "Monthly Pass",
      description: "30 days unlimited access",
      rate: 68000,
      period: "month",
      badge: {
        text: "Best Value",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
    },
  ];
  
  const handleChangePlan = async () => {
    setIsChanging(true);
    try {
      // This would integrate with a payment provider in a real app
      await apiRequest("POST", "/api/users/change-plan", { planType: currentPlan });
      toast({
        title: "Plan Updated",
        description: "Your subscription plan has been updated successfully.",
      });
      // Invalidate user data to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Plans & Pricing</CardTitle>
        <CardDescription>Choose your package</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "p-3 rounded-lg border-2 hover:border-primary dark:hover:border-primary cursor-pointer transition-colors",
                plan.id === currentPlan
                  ? "border-primary bg-primary-50 dark:bg-gray-700"
                  : "border-gray-200 dark:border-gray-700"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-medium">{plan.name}</h3>
                </div>
                {plan.badge && (
                  <div className={cn("ml-2 px-2 py-0.5 rounded text-xs", plan.badge.className)}>
                    {plan.badge.text}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {plan.description}
              </div>
              <div className="text-lg font-bold">
                ₦{plan.rate.toLocaleString()}/{plan.period}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleChangePlan}
          disabled={isChanging}
        >
          {isChanging ? "Processing..." : "Change Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingPlans;
