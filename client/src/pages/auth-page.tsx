import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, LineChart, Shield, Code, Zap } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const onLoginSubmit = (values: LoginValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterValues) => {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-4 lg:px-6">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <h1 className="ml-2 text-lg font-semibold text-neutral-800">Salesforce Metadata Analyzer</h1>
        </div>
      </header>
      
      <main className="flex-1 flex lg:flex-row flex-col">
        <div className="w-full lg:w-1/2 p-6 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                      Login to your account to manage your Salesforce org metadata
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-6"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="border-t border-neutral-100 p-4 text-sm text-neutral-500 text-center">
                    Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("register")}>Register</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                      Register to start analyzing your Salesforce orgs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Choose a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-6"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="border-t border-neutral-100 p-4 text-sm text-neutral-500 text-center">
                    Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>Login</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-6 lg:p-12 flex items-center justify-center text-white">
          <div className="max-w-lg">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Salesforce Metadata Analyzer</h2>
            <p className="text-lg mb-8 text-primary-50">
              Gain unprecedented visibility into your Salesforce org with powerful tools for metadata analysis, visualization, and optimization.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mt-1 bg-white bg-opacity-10 p-2 rounded-lg">
                  <Database className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">Data Model Visualization</h3>
                  <p className="text-primary-50">Interactive visualization of object relationships and dependencies</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 bg-white bg-opacity-10 p-2 rounded-lg">
                  <Code className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">Advanced SOQL/SOSL Editor</h3>
                  <p className="text-primary-50">Query builder with syntax highlighting and optimization suggestions</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 bg-white bg-opacity-10 p-2 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">Security Analysis</h3>
                  <p className="text-primary-50">Understand access controls and identify security vulnerabilities</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 bg-white bg-opacity-10 p-2 rounded-lg">
                  <LineChart className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">Health Score Analytics</h3>
                  <p className="text-primary-50">Monitor organization health with actionable insights</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 bg-white bg-opacity-10 p-2 rounded-lg">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">AI-Powered Recommendations</h3>
                  <p className="text-primary-50">Get intelligent suggestions to optimize your Salesforce implementation</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <Button variant="secondary" size="lg" className="group" onClick={() => setActiveTab("register")}>
                Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
