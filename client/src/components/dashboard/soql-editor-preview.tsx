import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function SOQLEditorPreview() {
  const [, navigate] = useLocation();

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-neutral-800">SOQL Editor</CardTitle>
          <button
            onClick={() => navigate("/soql-editor")}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Open editor
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="font-mono bg-neutral-800 rounded-md p-4 text-white text-sm overflow-hidden">
          <div className="flex items-start">
            <div className="flex-none w-5 text-neutral-500 select-none">1</div>
            <div className="flex-grow">
              <span className="text-purple-400">SELECT</span> Id, Name, AccountNumber, Type, Industry, AnnualRevenue
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-none w-5 text-neutral-500 select-none">2</div>
            <div className="flex-grow">
              <span className="text-purple-400">FROM</span> Account
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-none w-5 text-neutral-500 select-none">3</div>
            <div className="flex-grow">
              <span className="text-purple-400">WHERE</span> AnnualRevenue &gt; 1000000
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-none w-5 text-neutral-500 select-none">4</div>
            <div className="flex-grow">
              <span className="text-purple-400">ORDER BY</span> AnnualRevenue <span className="text-purple-400">DESC</span>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-none w-5 text-neutral-500 select-none">5</div>
            <div className="flex-grow">
              <span className="text-purple-400">LIMIT</span> 10
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/soql-editor")}
          >
            Execute Query
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/soql-editor")}
          >
            Format
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/soql-editor")}
          >
            Optimize
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
