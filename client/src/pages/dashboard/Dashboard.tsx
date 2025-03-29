import StatusCards from "./StatusCards";
import QRCodeSection from "./QRCodeSection";
import RecentActivity from "./RecentActivity";
import UsageAnalytics from "./UsageAnalytics";
import PricingPlans from "./PricingPlans";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSessionDuration, setActiveSessionDuration] = useState<number | null>(null);
  
  // Fetch current check-in status
  const { data: currentCheckIn, isLoading: checkInLoading } = useQuery({
    queryKey: [`/api/check-ins/current/${user?.id}`],
    enabled: !!user,
  });
  
  // Fetch weekly usage data
  const { data: weeklyUsage, isLoading: weeklyUsageLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/weekly-usage`],
    enabled: !!user,
  });
  
  // Fetch recent activity data
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/recent-activity`],
    enabled: !!user,
  });
  
  // Update active session timer
  useEffect(() => {
    if (currentCheckIn && currentCheckIn.status === "active") {
      const checkInTime = new Date(currentCheckIn.checkInTime).getTime();
      
      const updateDuration = () => {
        const now = new Date().getTime();
        const durationMs = now - checkInTime;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        setActiveSessionDuration(durationMinutes);
      };
      
      updateDuration();
      const intervalId = setInterval(updateDuration, 60000); // Update every minute
      
      return () => clearInterval(intervalId);
    }
  }, [currentCheckIn]);
  
  return (
    <>
      {/* Status overview cards */}
      <StatusCards
        currentCheckIn={currentCheckIn}
        weeklyUsage={weeklyUsage}
        activeSessionDuration={activeSessionDuration}
        isLoading={checkInLoading || weeklyUsageLoading}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code section */}
        <div className="lg:col-span-1">
          <QRCodeSection user={user} />
        </div>
        
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity 
            recentActivity={recentActivity} 
            isLoading={activityLoading} 
          />
        </div>
        
        {/* Usage Analytics */}
        <div className="lg:col-span-2">
          <UsageAnalytics userId={user?.id} />
        </div>
        
        {/* Pricing Plans */}
        <div className="lg:col-span-1">
          <PricingPlans currentPlan={user?.currentPlan} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
