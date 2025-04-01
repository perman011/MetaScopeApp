import { useState } from "react";
import { Search, Filter, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FilterBarProps {
  onSearch: (term: string) => void;
  onTypeFilter: (type: string) => void;
  onProfileFilter: (profile: string) => void;
}

export default function FilterBar({ onSearch, onTypeFilter, onProfileFilter }: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    onTypeFilter(value);
  };

  const handleProfileChange = (value: string) => {
    setSelectedProfile(value);
    onProfileFilter(value);
  };

  const saveFilterMutation = useMutation({
    mutationFn: async () => {
      const filter = {
        name: filterName,
        filters: {
          searchTerm,
          type: selectedType,
          profile: selectedProfile
        },
        isShared: false
      };

      const res = await apiRequest("POST", "/api/filter-templates", filter);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filter-templates"] });
      toast({
        title: "Filter saved",
        description: `Filter "${filterName}" has been saved successfully.`,
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save filter",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast({
        title: "Filter name required",
        description: "Please enter a name for your filter.",
        variant: "destructive",
      });
      return;
    }
    saveFilterMutation.mutate();
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
      <form onSubmit={handleSearch} className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <Input
          type="text"
          placeholder="Search metadata..."
          className="pl-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
      <div className="flex flex-wrap gap-2 md:gap-4">
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="object-custom">Custom Objects</SelectItem>
            <SelectItem value="object-standard">Standard Objects</SelectItem>
            <SelectItem value="field">Fields</SelectItem>
            <SelectItem value="apex">Apex Classes</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedProfile} onValueChange={handleProfileChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Profiles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Profiles</SelectItem>
            <SelectItem value="admin">System Administrator</SelectItem>
            <SelectItem value="standard">Standard User</SelectItem>
            <SelectItem value="sales">Custom: Sales</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          More Filters
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Filter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Filter Template</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filter-name">Filter Name</Label>
                <Input
                  id="filter-name"
                  placeholder="Enter a name for this filter"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Filter Settings</Label>
                <div className="text-sm text-neutral-500 space-y-1">
                  <p>Search Term: {searchTerm || "(none)"}</p>
                  <p>Type: {selectedType === 'all' ? 'All Types' : selectedType}</p>
                  <p>Profile: {selectedProfile === 'all' ? 'All Profiles' : selectedProfile}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleSaveFilter}
                disabled={saveFilterMutation.isPending}
              >
                {saveFilterMutation.isPending ? "Saving..." : "Save Filter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
