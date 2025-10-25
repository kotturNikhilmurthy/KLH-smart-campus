import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Download, Upload, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface ResourceItem {
  _id: string;
  title: string;
  type: string;
  department: string;
  semester: string;
  uploaderName?: string;
  fileUrl?: string;
  downloads: number;
  uploadedAt: string;
}

const Resources = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: resources = [],
    isLoading,
  } = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.get<ResourceItem[]>("/api/resources"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const resolveFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http")) return fileUrl;
    return `${api.baseUrl}${fileUrl}`;
  };

  const downloadMutation = useMutation({
    mutationFn: (resource: ResourceItem) => api.post<ResourceItem>(`/api/resources/${resource._id}/download`),
    onSuccess: (updatedResource, resource) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      const fileUrl = resolveFileUrl(updatedResource?.fileUrl ?? resource.fileUrl);

      if (fileUrl) {
        toast.success("Download started");
        window.open(fileUrl, "_blank", "noopener");
      } else {
        toast.info("Download count updated, but no file was linked.");
      }
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: (payload: Record<string, string>) => api.post<ResourceItem>("/api/teacher/resources", payload),
    onSuccess: () => {
      toast.success("Resource uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsDialogOpen(false);
    },
  });

  const handleCreateResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: (formData.get("title") || "").toString().trim(),
      type: (formData.get("type") || "").toString().trim(),
      department: (formData.get("department") || "").toString().trim(),
      semester: (formData.get("semester") || "").toString().trim(),
      fileUrl: (formData.get("fileUrl") || "").toString().trim(),
    };

    if (!payload.title || !payload.type || !payload.department || !payload.semester) {
      toast.error("Please fill in all required fields");
      return;
    }

    createResourceMutation.mutate(payload, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDept === "all" || resource.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [resources, searchQuery, filterDept]);

  const departmentOptions = useMemo(() => {
    const unique = new Set(resources.map((resource) => resource.department));
    return Array.from(unique).sort();
  }, [resources]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PDF":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "PPTX":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "DOCX":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-accent/20 text-accent border-accent/30";
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading resources…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-glow">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Academic Resources</h1>
                <p className="text-sm text-muted-foreground">Access study materials</p>
              </div>
            </div>
            {currentUser?.role === "teacher" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 shadow-glow">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload Resource</DialogTitle>
                    <DialogDescription>Share study material with students.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateResource}>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" placeholder="Advanced Calculus Notes" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" defaultValue="PDF" required>
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="PPTX">PPTX</SelectItem>
                            <SelectItem value="DOCX">DOCX</SelectItem>
                            <SelectItem value="Link">Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select name="semester" defaultValue="1" required>
                          <SelectTrigger id="semester">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {["1","2","3","4","5","6","7","8"].map((sem) => (
                              <SelectItem key={sem} value={sem}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" name="department" placeholder="CSE" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fileUrl">File URL</Label>
                      <Input id="fileUrl" name="fileUrl" placeholder="https://example.com/resource.pdf" />
                    </div>
                    <Button type="submit" className="w-full" disabled={createResourceMutation.isPending}>
                      {createResourceMutation.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 shadow-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-full md:w-[220px] bg-secondary/50 border-border/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {filteredResources.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No resources found</p>
              </CardContent>
            </Card>
          ) : (
            filteredResources.map((resource) => (
              <Card
                key={resource._id}
                className="group hover:shadow-elegant transition-all border-border/50 hover:border-primary/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                          {resource.department}
                        </Badge>
                        <Badge variant="outline" className="bg-secondary text-muted-foreground">
                          Sem {resource.semester}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors mb-1">
                        {resource.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Uploaded by {resource.uploaderName ?? "Unknown"} • {new Date(resource.uploadedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => downloadMutation.mutate(resource)}
                      size="sm"
                      className="ml-4 bg-primary hover:bg-primary/90 shadow-glow"
                      disabled={downloadMutation.isPending}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {resource.downloads}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Resources;
