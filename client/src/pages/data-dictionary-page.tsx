import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Layout } from '@/components/layout/layout';
import { DataDictionaryComponent } from '@/components/data-dictionary/data-dictionary';
import { PendingChangesComponent } from '@/components/data-dictionary/pending-changes';
import { AuditLogComponent } from '@/components/data-dictionary/audit-log';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrg } from '@/hooks/use-org';

export function DataDictionaryPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { toast } = useToast();
  const { currentOrg } = useOrg();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');

  const { data: fields, isLoading, refetch } = useQuery({
    queryKey: ['/api/data-dictionary', orgId],
    enabled: !!orgId,
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/data-dictionary/${orgId}/export`);
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
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsImporting(true);
      const response = await fetch(`/api/data-dictionary/${orgId}/import`, {
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

  return (
    <Layout>
      <div className="container mx-auto py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <PageHeader 
            title="Data Dictionary" 
            description="Manage field metadata across your Salesforce org" 
          />
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || isLoading}
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
              disabled={isImporting}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="pending">Pending Changes</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fields" className="space-y-4">
            <DataDictionaryComponent orgId={Number(orgId)} />
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <PendingChangesComponent orgId={Number(orgId)} />
          </TabsContent>
          
          <TabsContent value="audit" className="space-y-4">
            <AuditLogComponent orgId={Number(orgId)} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}