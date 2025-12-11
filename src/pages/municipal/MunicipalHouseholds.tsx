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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Filter } from "lucide-react";
import QRCode from "react-qr-code";

interface Household {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  state: string | null;
  district: string | null;
  pincode: string | null;
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
  
  // Filters
  const [districts, setDistricts] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  useEffect(() => {
    fetchHouseholds();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDistrict, selectedState, selectedLevel, households]);

  const applyFilters = () => {
    let filtered = households;

    if (searchTerm) {
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.phone?.includes(searchTerm) ||
          h.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.pincode?.includes(searchTerm)
      );
    }

    if (selectedDistrict !== "all") {
      filtered = filtered.filter((h) => h.district === selectedDistrict);
    }

    if (selectedState !== "all") {
      filtered = filtered.filter((h) => h.state === selectedState);
    }

    if (selectedLevel !== "all") {
      const level = parseInt(selectedLevel);
      filtered = filtered.filter((h) => h.level === level);
    }

    setFilteredHouseholds(filtered);
  };

  const fetchHouseholds = async () => {
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHouseholds(data as Household[]);
      setFilteredHouseholds(data as Household[]);

      // Extract unique districts and states
      const uniqueDistricts = [...new Set(data.map((h: any) => h.district).filter(Boolean))];
      const uniqueStates = [...new Set(data.map((h: any) => h.state).filter(Boolean))];
      setDistricts(uniqueDistricts as string[]);
      setStates(uniqueStates as string[]);
    }
    setLoading(false);
  };

  const viewHouseholdDetails = async (household: Household) => {
    setSelectedHousehold(household);

    const { data: complaints } = await supabase
      .from("complaints")
      .select("*")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false });

    setHouseholdComplaints(complaints || []);

    const { data: collections } = await supabase
      .from("collection_logs")
      .select("*")
      .eq("household_id", household.id)
      .order("collected_at", { ascending: false })
      .limit(10);

    setHouseholdCollections(collections || []);
  };

  const uniqueLevels = [...new Set(households.map((h) => h.level))].sort((a, b) => a - b);

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
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, address, pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-[150px]">
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
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {uniqueLevels.map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredHouseholds.length} of {households.length} households
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
                <TableHead>Location</TableHead>
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
                    <TableCell>
                      <div className="text-sm">
                        <p className="truncate max-w-[150px]">{household.address || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {household.district}, {household.state} - {household.pincode}
                        </p>
                      </div>
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
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{selectedHousehold.state || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{selectedHousehold.district || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pincode</p>
                  <p className="font-medium">{selectedHousehold.pincode || "-"}</p>
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
                        <div className="flex gap-2">
                          <Badge variant={c.status === "collected" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                          <Badge className={c.segregation_status === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {c.segregation_status || "pass"}
                          </Badge>
                        </div>
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
