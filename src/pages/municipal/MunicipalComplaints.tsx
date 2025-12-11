import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, AlertTriangle, Clock, CheckCircle, Filter } from "lucide-react";
import StatCard from "@/components/municipal/StatCard";

interface Complaint {
  id: string;
  category: string;
  description: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  household_id: string | null;
  household?: { name: string; phone: string | null; district: string | null };
}

const MunicipalComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const { toast } = useToast();

  const [districts, setDistricts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    avgResolutionTime: "2.5 days",
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, categoryFilter, districtFilter, complaints]);

  const applyFilters = () => {
    let filtered = complaints;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.household?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    if (districtFilter !== "all") {
      filtered = filtered.filter((c) => c.household?.district === districtFilter);
    }

    setFilteredComplaints(filtered);
  };

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        household:households(name, phone, district)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComplaints(data as any);
      setFilteredComplaints(data as any);

      // Extract unique districts and categories
      const uniqueDistricts = [...new Set(data.map((c: any) => c.household?.district).filter(Boolean))];
      const uniqueCategories = [...new Set(data.map((c: any) => c.category))];
      setDistricts(uniqueDistricts as string[]);
      setCategories(uniqueCategories);

      setStats({
        total: data.length,
        pending: data.filter((c) => c.status === "pending").length,
        resolved: data.filter((c) => c.status === "resolved").length,
        avgResolutionTime: "2.5 days",
      });
    }
    setLoading(false);
  };

  const resolveComplaint = async () => {
    if (!selectedComplaint) return;

    const { error } = await supabase
      .from("complaints")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", selectedComplaint.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Complaint resolved", description: "Status updated successfully" });
      setSelectedComplaint(null);
      setResolutionNotes("");
      fetchComplaints();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "in progress":
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Complaint Management</h1>
        <p className="text-muted-foreground">Track and resolve citizen complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats.total} icon={AlertTriangle} />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          iconClassName="bg-amber-500"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          iconClassName="bg-green-500"
        />
        <StatCard
          title="Avg Resolution Time"
          value={stats.avgResolutionTime}
          icon={Clock}
          iconClassName="bg-blue-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Household</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No complaints found
                  </TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.category}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{complaint.household?.name || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {complaint.household?.phone || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {complaint.household?.district || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {complaint.description || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedComplaint(complaint)}
                        disabled={complaint.status === "resolved"}
                      >
                        {complaint.status === "resolved" ? "Resolved" : "Resolve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{selectedComplaint.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{selectedComplaint.description || "No description provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Resolution Notes (Optional)</p>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add notes about how this was resolved..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
              Cancel
            </Button>
            <Button onClick={resolveComplaint}>Mark as Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MunicipalComplaints;
