import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";
import { HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Support() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Help & Support</h1>
            <p className="text-neutral-600 mb-6">
              Get help and learn how to get the most out of MetaScope.
            </p>
            
            <Tabs defaultValue="guides" className="w-full">
              <TabsList className="grid w-full md:w-[400px] grid-cols-3 mb-8">
                <TabsTrigger value="guides">Guides</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="contact">Contact Us</TabsTrigger>
              </TabsList>
              
              <TabsContent value="guides">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Getting Started</CardTitle>
                      <CardDescription>Learn the basics of MetaScope</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600">
                        A comprehensive guide to help you get started with MetaScope, connecting your first Salesforce org, and understanding the dashboard.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Guide <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Model Analysis</CardTitle>
                      <CardDescription>Understand your org's data model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600">
                        Learn how to use the Data Model Analyzer to visualize and understand your Salesforce org's objects, fields, and relationships.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Guide <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Analysis</CardTitle>
                      <CardDescription>Secure your Salesforce org</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600">
                        Learn how to use the Security Analyzer to identify potential vulnerabilities and security risks in your Salesforce org.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Guide <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="faq">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">How do I connect my Salesforce org?</h3>
                      <p className="text-neutral-600">
                        You can connect your Salesforce org by clicking on the org selector dropdown in the top navigation bar and selecting "Connect New Org". You'll need to provide your org's instance URL and authentication credentials.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Is my data secure?</h3>
                      <p className="text-neutral-600">
                        Yes, MetaScope does not store any of your Salesforce data. We only store metadata information and authentication tokens securely. All communication is encrypted using industry-standard protocols.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Can I analyze multiple orgs?</h3>
                      <p className="text-neutral-600">
                        Yes, you can connect and analyze multiple Salesforce orgs. Simply use the org selector in the top navigation bar to switch between your connected orgs.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">How often is the metadata updated?</h3>
                      <p className="text-neutral-600">
                        Metadata is refreshed each time you run an analysis. You can manually refresh the metadata for any analysis by clicking the "Run Analysis" button on the respective page.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Us</CardTitle>
                    <CardDescription>
                      Need help or have a question? We're here to assist you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-primary-50">
                      <HelpCircle className="h-6 w-6 text-primary-500 mt-1" />
                      <div>
                        <h3 className="font-medium text-lg mb-1">Email Support</h3>
                        <p className="text-neutral-600 mb-2">
                          Our support team typically responds within 24 hours.
                        </p>
                        <Button variant="outline">
                          support@metascope.io
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-primary-50">
                      <HelpCircle className="h-6 w-6 text-primary-500 mt-1" />
                      <div>
                        <h3 className="font-medium text-lg mb-1">Documentation</h3>
                        <p className="text-neutral-600 mb-2">
                          Explore our comprehensive documentation for detailed information.
                        </p>
                        <Button variant="outline">
                          Visit Documentation <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}