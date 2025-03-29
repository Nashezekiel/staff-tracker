import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageDay {
  day: string;
  hours: number;
  percentage: number;
}

interface UsageAnalyticsProps {
  userId: number | undefined;
}

const UsageAnalytics = ({ userId }: UsageAnalyticsProps) => {
  // Fetch weekly usage data
  const { data: usageData, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/analytics/weekly`],
    enabled: !!userId,
  });
  
  // Days of the week
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Default data structure with 0 hours for each day
  const defaultUsage: UsageDay[] = daysOfWeek.map(day => ({
    day,
    hours: 0,
    percentage: 0,
  }));

  // Combine data with defaults
  const combinedData = isLoading || !usageData 
    ? defaultUsage 
    : daysOfWeek.map(day => {
        const dayData = usageData.find((d: any) => d.day === day);
        return dayData || { day, hours: 0, percentage: 0 };
      });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Usage Analytics</CardTitle>
        <CardDescription>Hours spent this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <div className="space-y-1 w-full px-4">
            {isLoading ? (
              // Loading skeleton
              daysOfWeek.map((day, index) => (
                <div key={index} className="flex items-center mb-2">
                  <div className="w-16 text-xs text-gray-500 dark:text-gray-400">{day}</div>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="w-12 text-xs text-gray-500 dark:text-gray-400 ml-2">
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))
            ) : (
              // Actual data
              combinedData.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-16 text-xs text-gray-500 dark:text-gray-400">{day.day}</div>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {day.hours.toFixed(1)}h
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageAnalytics;
