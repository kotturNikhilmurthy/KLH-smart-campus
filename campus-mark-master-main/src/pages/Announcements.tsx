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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Megaphone, Pin, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface AnnouncementItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  postedBy: string;
  postedAt: string;
}

type CreateAnnouncementPayload = {
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
};

const categoryOptions = [
  "Academics",
  "Events",
  "Facilities",
  "Infrastructure",
  "General",
];

const Announcements = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [category, setCategory] = useState("General");
  const [isPinned, setIsPinned] = useState(false);

  const {
    data: announcements = [],
    isLoading,
  } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<AnnouncementItem[]>("/api/announcements"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => api.post<AnnouncementItem>("/api/announcements", payload),
    onSuccess: () => {
      toast.success("Announcement published");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      setCategory("General");
      setIsPinned(false);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => api.delete<null>(`/api/announcements/${announcementId}`),
    onSuccess: () => {
      toast.success("Announcement removed");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const handleCreateAnnouncement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const form = e.currentTarget;
    const formData = new FormData(e.currentTarget);
    const payload: CreateAnnouncementPayload = {
      title: (formData.get("title") as string) || "",
      content: (formData.get("content") as string) || "",
      category,
      isPinned,
    };

    createAnnouncementMutation.mutate(payload, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    if (deleteAnnouncementMutation.isPending) {
      return;
    }

    const confirmed = window.confirm("Delete this announcement?");
    if (!confirmed) {
      return;
    }

    deleteAnnouncementMutation.mutate(announcementId);
  };

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case "Academics":
        return "bg-primary/20 text-primary border-primary/30";
      case "Events":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Facilities":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Infrastructure":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-accent/20 text-accent border-accent/30";
    }
  };

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);
  const regularAnnouncements = announcements.filter((a) => !a.isPinned);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading announcements…</p>
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
                <Megaphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Campus Announcements</h1>
                <p className="text-sm text-muted-foreground">Stay updated</p>
              </div>
            </div>
            {currentUser?.role === "admin" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>Share campus-wide updates with everyone.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" placeholder="Enter announcement title" required disabled={createAnnouncementMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea id="content" name="content" placeholder="Enter announcement details" required disabled={createAnnouncementMutation.isPending} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pinned">Pin to top</Label>
                        <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3">
                          <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} disabled={createAnnouncementMutation.isPending} />
                          <span className="text-sm text-muted-foreground">Pinned</span>
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={createAnnouncementMutation.isPending}>
                      {createAnnouncementMutation.isPending ? "Publishing..." : "Publish Announcement"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Pin className="w-4 h-4 text-primary" />
                Pinned Announcements
              </div>
              {pinnedAnnouncements.map((announcement) => (
                <Card
                  key={announcement._id}
                  className="shadow-elegant border-primary/30 bg-gradient-to-br from-card to-card/50"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Pin className="w-4 h-4 text-primary" />
                          <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                            {announcement.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                        <CardDescription className="text-base whitespace-pre-wrap">{announcement.content}</CardDescription>
                      </div>
                      {currentUser?.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                          disabled={deleteAnnouncementMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete announcement</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(announcement.postedAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>{announcement.postedBy}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {regularAnnouncements.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Recent Announcements
              </div>
            )}
            {regularAnnouncements.map((announcement) => (
              <Card
                key={announcement._id}
                className="hover:shadow-elegant transition-all border-border/50 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                          {announcement.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2">{announcement.title}</CardTitle>
                      <CardDescription className="whitespace-pre-wrap">{announcement.content}</CardDescription>
                    </div>
                    {currentUser?.role === "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAnnouncement(announcement._id)}
                        disabled={deleteAnnouncementMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete announcement</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(announcement.postedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>{announcement.postedBy}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {announcements.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No announcements yet. {currentUser?.role === "admin" ? "Create the first update." : "Please check back later."}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Announcements;
