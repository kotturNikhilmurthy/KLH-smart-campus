import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Search, MapPin, Calendar, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface LostItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  status: "lost" | "found" | "claimed";
  imageUrl?: string;
  createdAt: string;
  reportedBy?: string;
  studentId?: string;
}

const LostFound = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: items = [],
    isLoading,
  } = useQuery({
    queryKey: ["lost-items"],
    queryFn: () => api.get<LostItem[]>("/api/lost-found"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const createItemMutation = useMutation({
    mutationFn: (payload: FormData) => api.post<LostItem>("/api/lost-found", payload),
    onSuccess: () => {
      toast.success("Item posted successfully!");
      queryClient.invalidateQueries({ queryKey: ["lost-items"] });
      setIsDialogOpen(false);
    },
  });

  const claimItemMutation = useMutation({
    mutationFn: (itemId: string) => api.patch<LostItem>(`/api/lost-found/${itemId}/status`, { status: "claimed" }),
    onSuccess: () => {
      toast.success("Item marked as claimed");
      queryClient.invalidateQueries({ queryKey: ["lost-items"] });
    },
  });

  const handleSubmitItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);
    formData.delete("image");

    const studentId = (formData.get("studentId") || "").toString().trim();
    if (!/^\d{10}$/.test(studentId)) {
      toast.error("Student ID must be a 10-digit number");
      return;
    }

    formData.set("studentId", studentId);
    if (!formData.get("date")) {
      formData.set("date", new Date().toISOString());
    }

    createItemMutation.mutate(formData, {
      onSuccess: () => {
        e.currentTarget.reset();
      },
    });
  };

  const filteredItems = items.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    const matchesTitle = item.title.toLowerCase().includes(normalizedQuery);
    const matchesDescription = item.description.toLowerCase().includes(normalizedQuery);
    const matchesStudentId = item.studentId?.includes(searchQuery.trim()) ?? false;

    return matchesTitle || matchesDescription || matchesStudentId;
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading lost &amp; found items…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Lost & Found</h1>
                <p className="text-sm text-muted-foreground">Report or find lost items</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Post Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post Lost/Found Item</DialogTitle>
                  <DialogDescription>Provide details about the item</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="lost" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="found">Found</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Item Title</Label>
                    <Input id="title" name="title" placeholder="Blue Backpack" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Detailed description..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" defaultValue="Others" required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bags">Bags</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Documents">Documents</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID (10 digits)</Label>
                    <Input
                      id="studentId"
                      name="studentId"
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      required
                      placeholder="2410012345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Library - 2nd Floor" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={createItemMutation.isPending}>
                    {createItemMutation.isPending ? "Posting..." : "Post Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b bg-card/30">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const itemDate = item.date || item.createdAt;
            const canClaim = currentUser?.role === "teacher" && item.status !== "claimed";

            return (
              <Card key={item._id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Badge
                      variant={item.status === "lost" ? "destructive" : item.status === "found" ? "default" : "secondary"}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-3 leading-relaxed">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {item.studentId && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Student ID:</span>
                        <span className="font-mono text-foreground/80">{item.studentId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(itemDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {canClaim && (
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={() => claimItemMutation.mutate(item._id)}
                      disabled={claimItemMutation.isPending}
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Mark as Claimed
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LostFound;
