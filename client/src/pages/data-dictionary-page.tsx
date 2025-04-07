import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Layout } from '@/components/layout/layout';
import { DataDictionaryComponent } from '@/components/data-dictionary/data-dictionary';
import { PendingChangesComponent } from '@/components/data-dictionary/pending-changes';
import { AuditLogComponent } from '@/components/data-dictionary/audit-log';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FileUp, Loader2, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrg } from '@/hooks/use-org';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function DataDictionaryPage() {
  const { orgId } = useParams<{ orgId?: string }>();
  const { toast } = useToast();
  const { currentOrg, orgs } = useOrg();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  const [, navigate] = useLocation();

  // If there's no orgId in the URL but we have a current org selected, use that
  const activeOrgId = orgId ? Number(orgId) : currentOrg?.id;

  // If there's no orgId in the URL, show org selection
  const showOrgSelection = !orgId && orgs && orgs.length > 0;

  // Redirect to specific org page if we have an active org but no orgId in URL
  useEffect(() => {
    if (!orgId && activeOrgId) {
      navigate(`/data-dictionary/${activeOrgId}`);
    }
  }, [orgId, activeOrgId, navigate]);

  const { data: fields, isLoading, refetch } = useQuery({
    queryKey: ['/api/data-dictionary', activeOrgId],
    enabled: !!activeOrgId,
  });

  const handleExport = async () => {
    if (!activeOrgId) return;
    
    try {
      setIsExporting(true);
      const response = await fetch(`/api/orgs/${activeOrgId}/data-dictionary/export`);
      if (!response.ok) throw new Error('Failed to export data dictionary');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-dictionary-${currentOrg?.name || 'export'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: 'Export Successful',
        description: 'Data dictionary exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeOrgId) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsImporting(true);
      const response = await fetch(`/api/orgs/${activeOrgId}/data-dictionary/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data dictionary');
      }

      toast({
        title: 'Import Successful',
        description: 'Data dictionary imported successfully',
      });
      
      // Refetch data to show updated fields
      refetch();
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  // Org Selection View
  if (showOrgSelection) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <PageHeader 
            title="Data Dictionary" 
            description="Select an organization to view its data dictionary" 
            icon={<Database size={24} />}
            className="mb-8"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map(org => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>
                    {org.type === 'production' ? 'Production Org' : 'Sandbox Org'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 truncate">{org.domain}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => navigate(`/data-dictionary/${org.id}`)}
                    className="w-full"
                  >
                    Open Data Dictionary
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Data Dictionary View (when we have an active org)
  return (
    <Layout>
      <div className="container mx-auto py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <PageHeader 
            title="Data Dictionary" 
            description={`Manage field metadata for ${currentOrg?.name || 'your Salesforce org'}`} 
            icon={<Database size={24} />}
          />
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || isLoading || !activeOrgId}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
              disabled={isImporting || !activeOrgId}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>

        {activeOrgId ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="pending">Pending Changes</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fields" className="space-y-4">
              <DataDictionaryComponent orgId={activeOrgId} />
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              <PendingChangesComponent orgId={activeOrgId} />
            </TabsContent>
            
            <TabsContent value="audit" className="space-y-4">
              <AuditLogComponent orgId={activeOrgId} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-600">Please select an organization to view its data dictionary.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}