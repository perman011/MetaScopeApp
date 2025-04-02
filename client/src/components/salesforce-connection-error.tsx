import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

type ConnectionErrorProps = {
  onRetry: () => void;
};

export function SalesforceConnectionError({ onRetry }: ConnectionErrorProps) {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <Card className="border-red-400 bg-red-50 p-4 space-y-3">
      <div className="flex items-start space-x-3">
        <AlertCircle className="text-red-500 mt-0.5" />
        <div>
          <h3 className="text-red-700 font-semibold">Connection Failed</h3>
          <p className="text-red-600 text-sm">
            We couldn't connect to Salesforce. Please check your username, password, and security token, then try again.
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={() => setShow(false)}>
          Dismiss
        </Button>
        <Button variant="default" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Card>
  );
}