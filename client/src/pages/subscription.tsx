import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";
import { CreditCard, CheckCircle, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export default function Subscription() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Subscription</h1>
            <p className="text-neutral-600 mb-6">
              Manage your MetaScope subscription and billing information.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      You are currently on the Free Trial plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-primary-50 border-primary-200 mb-4">
                      <div>
                        <Badge className="mb-2 bg-primary-100 text-primary-800 hover:bg-primary-100">
                          Trial
                        </Badge>
                        <h3 className="text-xl font-semibold">Free Trial</h3>
                        <p className="text-neutral-600 text-sm">
                          Your trial ends in 14 days
                        </p>
                      </div>
                      <Button>
                        Upgrade Plan
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Features included in your plan:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Connect up to 2 Salesforce orgs</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Data model analysis</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Basic security analysis</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>SOQL/SOSL Editor</span>
                        </li>
                        <li className="flex items-start text-neutral-400">
                          <AlertCircle className="h-5 w-5 mr-2 text-neutral-400 flex-shrink-0 mt-0.5" />
                          <span>Advanced security analysis (Pro plan)</span>
                        </li>
                        <li className="flex items-start text-neutral-400">
                          <AlertCircle className="h-5 w-5 mr-2 text-neutral-400 flex-shrink-0 mt-0.5" />
                          <span>Unlimited Salesforce org connections (Pro plan)</span>
                        </li>
                        <li className="flex items-start text-neutral-400">
                          <AlertCircle className="h-5 w-5 mr-2 text-neutral-400 flex-shrink-0 mt-0.5" />
                          <span>Team collaboration features (Enterprise plan)</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View All Plans
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                      View your recent payments and invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-neutral-600">
                        No payment history available for free trial
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                      Manage your payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <CreditCard className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                      <p className="text-neutral-600 mb-4">
                        No payment method added yet
                      </p>
                      <Button>
                        Add Payment Method
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>
                      Manage your billing details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Name</h3>
                        <p>{user?.fullName || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Email</h3>
                        <p>{user?.email || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Address</h3>
                        <p>Not specified</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Company</h3>
                        <p>Not specified</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Update Billing Information
                    </Button>
                  </CardFooter>
                </Card>
                
                <Alert variant="default" className="bg-primary-50 border-primary-200">
                  <AlertTitle className="text-primary-800">Need help?</AlertTitle>
                  <AlertDescription>
                    Contact our support team for assistance with your subscription.
                  </AlertDescription>
                  <Button variant="link" className="p-0 mt-2 text-primary-800">
                    Contact Support <ChevronRight className="h-4 w-4" />
                  </Button>
                </Alert>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}