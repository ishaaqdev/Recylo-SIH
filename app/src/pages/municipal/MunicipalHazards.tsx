import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, AlertTriangle, Clock, CheckCircle, Eye } from "lucide-react";
import StatCard from "@/components/municipal/StatCard";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface HazardReport {
  id: string;
  hazard_type: string;
  location: string;
  description: string | null;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

const SEVERITY_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

const MunicipalHazards = () => {
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [filteredHazards, setFilteredHazards] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchHazards();
  }, []);

  useEffect(() => {
    let filtered = hazards;

    if (searchTerm) {
      filtered = filtered.filter(
        (h) =>
          h.hazard_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((h) => h.status === statusFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((h) => h.severity === severityFilter);
    }

    setFilteredHazards(filtered);
  }, [searchTerm, statusFilter, severityFilter, hazards]);

  const fetchHazards = async () => {
    const { data, error } = await supabase
      .from("hazard_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHazards(data);
      setFilteredHazards(data);

      setStats({
        total: data.length,
        pending: data.filter((h) => h.status === "pending").length,
        inReview: data.filter((h) => h.status === "in_review").length,
        resolved: data.filter((h) => h.status === "resolved").length,
      });
    }
    setLoading(false);
  };

  const updateHazardStatus = async () => {
    if (!selectedHazard || !newStatus) return;

    const updateData: any = { status: newStatus };
    if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolution_notes = resolutionNotes;
    }

    const { error } = await supabase
      .from("hazard_reports")
      .update(updateData)
      .eq("id", selectedHazard.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Hazard status updated successfully" });
      setSelectedHazard(null);
      setResolutionNotes("");
      setNewStatus("");
      fetchHazards();
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: "bg-green-100 text-green-700",
      medium: "bg-amber-100 text-amber-700",
      high: "bg-red-100 text-red-700",
    };
    return <Badge className={colors[severity as keyof typeof colors] || colors.medium}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700",
      in_review: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
    };
    return <Badge className={colors[status as keyof typeof colors] || colors.pending}>{status.replace("_", " ")}</Badge>;
  };

  // Chart data
  const severityDistribution = [
    { name: "Low", value: hazards.filter((h) => h.severity === "low").length, color: "#22c55e" },
    { name: "Medium", value: hazards.filter((h) => h.severity === "medium").length, color: "#f59e0b" },
    { name: "High", value: hazards.filter((h) => h.severity === "high").length, color: "#ef4444" },
  ];

  const typeDistribution = hazards.reduce((acc: any, h) => {
    acc[h.hazard_type] = (acc[h.hazard_type] || 0) + 1;
    return acc;
  }, {});

  const typeChartData = Object.entries(typeDistribution).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hazard Reports</h1>
        <p className="text-muted-foreground">Monitor and manage hazard reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={stats.total} icon={Shield} />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={AlertTriangle}
          iconClassName="bg-amber-500"
        />
        <StatCard
          title="In Review"
          value={stats.inReview}
          icon={Clock}
          iconClassName="bg-blue-500"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          iconClassName="bg-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hazard Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search hazards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
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
              ) : filteredHazards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hazard reports found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHazards.map((hazard) => (
                  <TableRow key={hazard.id}>
                    <TableCell className="font-medium">{hazard.hazard_type}</TableCell>
                    <TableCell>{hazard.location}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {hazard.description || "-"}
                    </TableCell>
                    <TableCell>{getSeverityBadge(hazard.severity)}</TableCell>
                    <TableCell>{getStatusBadge(hazard.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(hazard.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHazard(hazard);
                          setNewStatus(hazard.status);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedHazard} onOpenChange={() => setSelectedHazard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Hazard Report Details</DialogTitle>
          </DialogHeader>
          {selectedHazard && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedHazard.hazard_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  {getSeverityBadge(selectedHazard.severity)}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedHazard.location}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{selectedHazard.description || "No description provided"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Update Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "resolved" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Resolution Notes</p>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how this hazard was resolved..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedHazard(null)}>
              Cancel
            </Button>
            <Button onClick={updateHazardStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MunicipalHazards;
