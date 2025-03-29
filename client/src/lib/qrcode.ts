import { useState } from "react";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const useQRCode = () => {
  const { toast } = useToast();
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);

  // Query for existing QR code
  const { data: existingQRCode, isLoading, refetch } = useQuery({
    queryKey: ["/api/qrcode/current"],
    onSuccess: (data) => {
      if (data?.qrCode) {
        setQRCodeData(data.qrCode);
      }
    },
    onError: () => {
      setQRCodeData(null);
    },
  });

  // Function to generate a new QR code
  const generateQRCode = async (userId: number) => {
    try {
      const response = await apiRequest("POST", "/api/qrcode/generate", { userId });
      const data = await response.json();
      
      if (data?.qrCode) {
        setQRCodeData(data.qrCode);
        await refetch(); // Refresh the query
        return data.qrCode;
      } else {
        throw new Error("Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "QR Code Generation Failed",
        description: "Could not generate a new QR code. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    qrCodeData,
    isLoading,
    generateQRCode,
  };
};
