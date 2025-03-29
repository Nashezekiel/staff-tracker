import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIn } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

interface StatusCardsProps {
  currentCheckIn: CheckIn | null | undefined;
  weeklyUsage: { totalMinutes: number; weeklyLimit: number } | null | undefined;
  activeSessionDuration: number | null;
  isLoading: boolean;
}

const StatusCards = ({
  currentCheckIn,
  weeklyUsage,
  activeSessionDuration,
  isLoading,
}: StatusCardsProps) => {
  // Format duration in hours and minutes
  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Calculate percentage of weekly limit
  const calculatePercentage = () => {
    if (!weeklyUsage) return "0%";
    const percentage = Math.round((weeklyUsage.totalMinutes / weeklyUsage.weeklyLimit) * 100);
    return `${percentage}%`;
  };
  
  // Get next billing date (30 days from now for demo)
  const getNextBillingDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return format(date, "MMMM d, yyyy");
  };
  
  // Get days remaining until next billing
  const getDaysRemaining = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return formatDistanceToNow(date, { addSuffix: false });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Current Status Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current Status
            </h2>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : currentCheckIn?.status === "active" ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Check-in: {currentCheckIn ? format(new Date(currentCheckIn.checkInTime), "hh:mm a") : "--"}
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Checked out
              </span>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <div className="text-2xl font-semibold">
              {currentCheckIn?.status === "active"
                ? formatDuration(activeSessionDuration)
                : "0h 0m"}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current session duration
          </div>
        </CardContent>
      </Card>

      {/* Weekly Usage Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Weekly Usage
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              This Week
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <div className="text-2xl font-semibold">
              {weeklyUsage
                ? formatDuration(weeklyUsage.totalMinutes)
                : "0h 0m"}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {calculatePercentage()} of weekly limit
          </div>
        </CardContent>
      </Card>

      {/* Current Plan Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current Plan
            </h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <div className="text-2xl font-semibold capitalize">
              Monthly
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ₦68,000 / month
          </div>
        </CardContent>
      </Card>

      {/* Next Billing Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Next Billing
            </h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-40 mb-2" />
          ) : (
            <div className="text-2xl font-semibold">
              {getNextBillingDate()}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {getDaysRemaining()} remaining
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusCards;
