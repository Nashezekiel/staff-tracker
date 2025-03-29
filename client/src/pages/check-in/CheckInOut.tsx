import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";

const CheckInOut = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);

  // Fetch current check-in status
  const { data: currentStatus, isLoading } = useQuery({
    queryKey: [`/api/check-ins/current/${user?.id}`],
    enabled: !!user,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/check-ins", { userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/check-ins/current/${user?.id}`] });
      toast({
        title: "Checked In",
        description: "You have successfully checked in.",
      });
      setScanning(false);
    },
    onError: (error) => {
      toast({
        title: "Check-in Failed",
        description: "There was an error checking in. Please try again.",
        variant: "destructive",
      });
      setScanning(false);
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (checkInId: number) => {
      return apiRequest("PATCH", `/api/check-ins/${checkInId}/checkout`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/check-ins/current/${user?.id}`] });
      toast({
        title: "Checked Out",
        description: "You have successfully checked out.",
      });
      setScanning(false);
    },
    onError: (error) => {
      toast({
        title: "Check-out Failed",
        description: "There was an error checking out. Please try again.",
        variant: "destructive",
      });
      setScanning(false);
    },
  });

  const handleQRScan = (result: string) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(result);
      
      // Validate QR code data
      if (!qrData || !qrData.workspace || qrData.workspace !== "techie") {
        throw new Error("Invalid QR code");
      }
      
      // Process check-in or check-out based on current status
      if (currentStatus && currentStatus.status === "active") {
        checkOutMutation.mutate(currentStatus.id);
      } else {
        checkInMutation.mutate();
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "The scanned QR code is not valid for this workspace.",
        variant: "destructive",
      });
      setScanning(false);
    }
  };

  const handleScanError = (error: any) => {
    console.error("QR scanning error:", error);
    toast({
      title: "Scanning Error",
      description: "There was an error with the scanner. Please try again.",
      variant: "destructive",
    });
    setScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check In / Check Out</CardTitle>
          <CardDescription>
            Scan the QR code at the workspace entrance to check in or out
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-lg">
              <Scanner
                onScan={(results) => results.length > 0 && handleQRScan(results[0].rawValue)}
                onError={handleScanError}
                formats={["qr_code"]}
                styles={{
                  container: {
                    borderRadius: "0.5rem"
                  }
                }}
              />
            </div>
          ) : (
            <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium">
                {currentStatus && currentStatus.status === "active"
                  ? "Ready to Check Out?"
                  : "Ready to Check In?"}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Click the button below to start scanning
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={() => setScanning(!scanning)}
            disabled={checkInMutation.isPending || checkOutMutation.isPending}
            className="w-full"
          >
            {scanning
              ? "Cancel Scanning"
              : currentStatus && currentStatus.status === "active"
              ? "Scan to Check Out"
              : "Scan to Check In"}
          </Button>
          
          {currentStatus && currentStatus.status === "active" && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              You checked in at{" "}
              {new Date(currentStatus.checkInTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" on "}
              {new Date(currentStatus.checkInTime).toLocaleDateString()}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckInOut;
