import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, Calendar, Bell, Star, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface ClubItem {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  eventCount: number;
  joined: boolean;
}

type CreateClubPayload = {
  name: string;
  description: string;
  category: string;
};

const categorySuggestions = ["Technical", "Creative", "Arts", "Business", "Sports", "Cultural", "Others"] as const;

const Clubs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubCategory, setClubCategory] = useState<string>(categorySuggestions[0]);
  const [activeClubId, setActiveClubId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      navigate("/auth");
    }
  }, [isAuthLoading, currentUser, navigate]);

  const {
    data: clubs = [],
    isLoading,
  } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => api.get<ClubItem[]>("/api/clubs"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const createClubMutation = useMutation({
    mutationFn: (payload: CreateClubPayload) => api.post<ClubItem>("/api/clubs", payload),
    onSuccess: () => {
      toast.success("Club created successfully");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      setIsDialogOpen(false);
      setClubName("");
      setClubDescription("");
      setClubCategory(categorySuggestions[0]);
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: (clubId: string) => api.delete<null>(`/api/clubs/${clubId}`),
    onSuccess: () => {
      toast.success("Club removed");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onSettled: (_data, _error, clubId) => {
      if (activeClubId === clubId) {
        setActiveClubId(null);
      }
    },
  });

  const joinClubMutation = useMutation({
    mutationFn: (clubId: string) => api.post(`/api/student/clubs/${clubId}/join`),
    onSuccess: () => {
      toast.success("Joined club");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onSettled: (_data, _error, clubId) => {
      if (activeClubId === clubId) {
        setActiveClubId(null);
      }
    },
  });

  const leaveClubMutation = useMutation({
    mutationFn: (clubId: string) => api.post(`/api/student/clubs/${clubId}/leave`),
    onSuccess: () => {
      toast.success("Left club");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onSettled: (_data, _error, clubId) => {
      if (activeClubId === clubId) {
        setActiveClubId(null);
      }
    },
  });

  const isStudent = currentUser?.role === "student";
  const isAdmin = currentUser?.role === "admin";

  const isProcessingClub = (clubId: string) => {
    if (activeClubId !== clubId) {
      return false;
    }
    return joinClubMutation.isPending || leaveClubMutation.isPending || deleteClubMutation.isPending;
  };

  const handleCreateClub = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = clubName.trim();
    const description = clubDescription.trim();
    const category = clubCategory.trim();

    if (!name || !description || !category) {
      toast.error("Please fill in all fields");
      return;
    }

    createClubMutation.mutate({ name, description, category });
  };

  const handleDeleteClub = (clubId: string, clubTitle: string) => {
    const confirmed = window.confirm(`Delete ${clubTitle}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    setActiveClubId(clubId);
    deleteClubMutation.mutate(clubId);
  };

  const handleJoinToggle = (club: ClubItem) => {
    if (!isStudent) {
      return;
    }
    setActiveClubId(club.id);
    if (club.joined) {
      leaveClubMutation.mutate(club.id);
    } else {
      joinClubMutation.mutate(club.id);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical":
        return "bg-primary/20 text-primary border-primary/30";
      case "Creative":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Arts":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "Business":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Sports":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Cultural":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-accent/20 text-accent border-accent/30";
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading clubs…</p>
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
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Student Clubs</h1>
                <p className="text-sm text-muted-foreground">Join and manage student communities</p>
              </div>
            </div>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Club
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Club</DialogTitle>
                    <DialogDescription>Add a new club for students to join.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateClub}>
                    <div className="space-y-2">
                      <Label htmlFor="club-name">Club Name</Label>
                      <Input
                        id="club-name"
                        value={clubName}
                        onChange={(event) => setClubName(event.target.value)}
                        placeholder="Enter club name"
                        required
                        disabled={createClubMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="club-category">Category</Label>
                      <Input
                        id="club-category"
                        list="club-category-suggestions"
                        value={clubCategory}
                        onChange={(event) => setClubCategory(event.target.value)}
                        placeholder="e.g., Technical"
                        required
                        disabled={createClubMutation.isPending}
                      />
                      <datalist id="club-category-suggestions">
                        {categorySuggestions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="club-description">Description</Label>
                      <Textarea
                        id="club-description"
                        value={clubDescription}
                        onChange={(event) => setClubDescription(event.target.value)}
                        placeholder="Describe the club's activities"
                        className="min-h-[120px]"
                        required
                        disabled={createClubMutation.isPending}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createClubMutation.isPending}>
                      {createClubMutation.isPending ? "Creating..." : "Create Club"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {clubs.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="py-12 text-center text-muted-foreground">
              No clubs found. {isAdmin ? "Create the first club to get started." : "Please check back later."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Card
                key={club.id}
                className="group hover:shadow-elegant transition-all border-border/50 hover:border-primary/50 overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getCategoryColor(club.category)}>
                          {club.category}
                        </Badge>
                        {isStudent && club.joined && <Star className="w-5 h-5 text-primary fill-primary" />}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {club.name}
                      </CardTitle>
                      <CardDescription className="text-sm">{club.description}</CardDescription>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClub(club.id, club.name)}
                        disabled={isProcessingClub(club.id)}
                        aria-label={`Delete ${club.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{club.members}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{club.eventCount} events</span>
                    </div>
                  </div>
                  {isStudent ? (
                    <Button
                      onClick={() => handleJoinToggle(club)}
                      variant={club.joined ? "outline" : "default"}
                      className={`w-full ${
                        club.joined
                          ? "border-primary/50 hover:bg-primary/10"
                          : "bg-primary hover:bg-primary/90 shadow-glow"
                      }`}
                      disabled={isProcessingClub(club.id)}
                    >
                      {club.joined ? (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        "Join Club"
                      )}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clubs;
