import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useQRCode } from "@/lib/qrcode";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addMonths } from "date-fns";

interface QRCodeSectionProps {
  user: User | null;
}

const QRCodeSection = ({ user }: QRCodeSectionProps) => {
  const { toast } = useToast();
  const { qrCodeData, isLoading, generateQRCode } = useQRCode();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // QR code validity date (1 month from now)
  const validThrough = format(addMonths(new Date(), 1), "MMMM d, yyyy");
  
  // Function to download QR code
  const downloadQRCode = () => {
    if (!qrCodeData) return;
    
    setIsDownloading(true);
    
    try {
      const link = document.createElement("a");
      link.href = qrCodeData;
      link.download = `techie-workspace-qr-${user?.username || "user"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Generate QR code if not available
  const handleGenerateQRCode = async () => {
    if (!user) return;
    
    try {
      await generateQRCode(user.id);
      toast({
        title: "QR Code Generated",
        description: "Your new QR code has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Your QR Code</CardTitle>
        <CardDescription>Scan to check in or out</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <Skeleton className="w-56 h-56 rounded-lg" />
        ) : qrCodeData ? (
          <div className="w-56 h-56 bg-white p-2 rounded-lg shadow-sm mb-4">
            <img
              src={qrCodeData}
              alt="QR Code for check-in/out"
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-56 h-56 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
            <Button onClick={handleGenerateQRCode}>Generate QR Code</Button>
          </div>
        )}
        
        <p className="text-sm text-center text-gray-700 dark:text-gray-300 mb-4">
          Valid through <strong>{validThrough}</strong>
        </p>
        
        <Button 
          className="w-full"
          onClick={downloadQRCode}
          disabled={!qrCodeData || isDownloading}
        >
          {isDownloading ? "Downloading..." : "Download QR Code"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QRCodeSection;
