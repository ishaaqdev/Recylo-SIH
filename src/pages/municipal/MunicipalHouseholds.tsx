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
} from "@/components/ui/dialog";
import { Search, Eye, Filter } from "lucide-react";
import QRCode from "react-qr-code";

interface Household {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  level: number;
  points: number;
  total_waste_recycled: number;
  qr_code: string | null;
  created_at: string;
}

const MunicipalHouseholds = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [householdComplaints, setHouseholdComplaints] = useState<any[]>([]);
  const [householdCollections, setHouseholdCollections] = useState<any[]>([]);

  useEffect(() => {
    fetchHouseholds();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = households.filter(
        (h) =>
          h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.phone?.includes(searchTerm) ||
          h.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHouseholds(filtered);
    } else {
      setFilteredHouseholds(households);
    }
  }, [searchTerm, households]);

  const fetchHouseholds = async () => {
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHouseholds(data);
      setFilteredHouseholds(data);
    }
    setLoading(false);
  };

  const viewHouseholdDetails = async (household: Household) => {
    setSelectedHousehold(household);

    // Fetch complaints for this household
    const { data: complaints } = await supabase
      .from("complaints")
      .select("*")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false });

    setHouseholdComplaints(complaints || []);

    // Fetch collection logs
    const { data: collections } = await supabase
      .from("collection_logs")
      .select("*")
      .eq("household_id", household.id)
      .order("collected_at", { ascending: false })
      .limit(10);

    setHouseholdCollections(collections || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Household Management</h1>
          <p className="text-muted-foreground">View and manage all registered households</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Recycled (kg)</TableHead>
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
              ) : filteredHouseholds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No households found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHouseholds.map((household) => (
                  <TableRow key={household.id}>
                    <TableCell className="font-medium">{household.name}</TableCell>
                    <TableCell>{household.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {household.address || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Level {household.level}</Badge>
                    </TableCell>
                    <TableCell>{household.points}</TableCell>
                    <TableCell>{household.total_waste_recycled}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewHouseholdDetails(household)}
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

      {/* Household Detail Dialog */}
      <Dialog open={!!selectedHousehold} onOpenChange={() => setSelectedHousehold(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Household Details</DialogTitle>
          </DialogHeader>
          {selectedHousehold && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedHousehold.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedHousehold.phone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedHousehold.address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <Badge>Level {selectedHousehold.level}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="font-bold text-primary">{selectedHousehold.points}</p>
                </div>
              </div>

              {/* QR Code */}
              {selectedHousehold.qr_code && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCode value={selectedHousehold.qr_code} size={120} />
                </div>
              )}

              {/* Collection History */}
              <div>
                <h3 className="font-semibold mb-2">Recent Collections</h3>
                {householdCollections.length > 0 ? (
                  <div className="space-y-2">
                    {householdCollections.map((c) => (
                      <div key={c.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                        <span>{new Date(c.collected_at).toLocaleDateString()}</span>
                        <Badge variant={c.status === "collected" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No collections yet</p>
                )}
              </div>

              {/* Complaints */}
              <div>
                <h3 className="font-semibold mb-2">Complaints</h3>
                {householdComplaints.length > 0 ? (
                  <div className="space-y-2">
                    {householdComplaints.map((c) => (
                      <div key={c.id} className="p-2 bg-slate-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{c.category}</span>
                          <Badge
                            variant={c.status === "resolved" ? "default" : "destructive"}
                          >
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No complaints</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MunicipalHouseholds;
