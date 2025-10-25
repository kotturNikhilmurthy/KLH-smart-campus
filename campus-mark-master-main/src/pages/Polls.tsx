import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BarChart3, CheckCircle2, Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface PollOption {
  optionKey: string;
  text: string;
  votes: number;
}

interface PollItem {
  _id: string;
  question: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  endDate: string;
  voted: boolean;
  userVote?: string | null;
}

const Polls = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [optionInputs, setOptionInputs] = useState<string[]>(["", ""]);

  const {
    data: polls = [],
    isLoading,
  } = useQuery({
    queryKey: ["polls"],
    queryFn: () => api.get<PollItem[]>("/api/polls"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 30,
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionKey }: { pollId: string; optionKey: string }) =>
      api.post<PollItem>(`/api/polls/${pollId}/vote`, { optionKey }),
    onSuccess: () => {
      toast.success("Vote recorded. Thanks for participating!");
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
  });

  const createPollMutation = useMutation({
    mutationFn: (payload: { question: string; description: string; endDate: string; options: string[] }) =>
      api.post<PollItem>("/api/polls", payload),
    onSuccess: () => {
      toast.success("Poll created");
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      setOptionInputs(["", ""]);
      setIsDialogOpen(false);
    },
  });

  const handleVote = (pollId: string, optionKey: string) => {
    voteMutation.mutate({ pollId, optionKey });
  };

  const handleCreatePoll = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(e.currentTarget);
    const question = (formData.get("question") as string) || "";
    const description = (formData.get("description") as string) || "";
    const endDate = (formData.get("endDate") as string) || "";

    const optionTexts = optionInputs
      .map((value) => value.trim())
      .filter(Boolean);

    if (optionTexts.length < 2) {
      toast.error("Please provide at least two options.");
      return;
    }

    if (!endDate) {
      toast.error("Select an end date for the poll.");
      return;
    }

    createPollMutation.mutate({ question, description, endDate, options: optionTexts }, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const getPercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const addOption = () => {
    setOptionInputs((prev) => [...prev, ""]);
  };

  const updateOption = (value: string, index: number) => {
    setOptionInputs((prev) => prev.map((opt, idx) => (idx === index ? value : opt)));
  };

  const removeOption = (index: number) => {
    setOptionInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading polls…</p>
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
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Campus Polls</h1>
                <p className="text-sm text-muted-foreground">Your voice matters</p>
              </div>
            </div>
            {currentUser && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Poll
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start a new poll</DialogTitle>
                    <DialogDescription>Ask the community anything you'd like their opinion on.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePoll} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="question">
                        Question
                      </label>
                      <Input id="question" name="question" placeholder="What should we host next?" required disabled={createPollMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="description">
                        Description (optional)
                      </label>
                      <Textarea id="description" name="description" placeholder="Share more context" disabled={createPollMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="endDate">
                        Closing date
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="endDate" name="endDate" type="date" className="pl-9" required disabled={createPollMutation.isPending} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Options</label>
                      <div className="space-y-3">
                        {optionInputs.map((value, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={value}
                              onChange={(event) => updateOption(event.target.value, index)}
                              placeholder={`Option ${index + 1}`}
                              required
                              disabled={createPollMutation.isPending}
                            />
                            {optionInputs.length > 2 && (
                              <Button type="button" variant="ghost" onClick={() => removeOption(index)} disabled={createPollMutation.isPending}>
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addOption} disabled={optionInputs.length >= 6 || createPollMutation.isPending}>
                          Add option
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={createPollMutation.isPending}>
                      {createPollMutation.isPending ? "Creating..." : "Create Poll"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {polls.map((poll) => {
            const endDate = new Date(poll.endDate);
            const alreadyVoted = poll.voted;
            const pollClosed = endDate.getTime() < Date.now();

            return (
              <Card key={poll._id} className="shadow-card hover:shadow-elegant transition-all border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{poll.question}</CardTitle>
                      <CardDescription>{poll.description}</CardDescription>
                    </div>
                    {alreadyVoted && (
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Voted
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span>{poll.totalVotes} votes</span>
                    <span>•</span>
                    <span>Ends {endDate.toLocaleDateString()}</span>
                    {pollClosed && <Badge variant="secondary">Closed</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = getPercentage(option.votes, poll.totalVotes);
                      const isUserChoice = alreadyVoted && poll.userVote === option.optionKey;

                      return (
                        <div key={option.optionKey} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {alreadyVoted || pollClosed ? (
                                <div
                                  className={`flex-1 p-3 rounded-lg border transition-all ${
                                    isUserChoice
                                      ? "bg-primary/20 border-primary"
                                      : "bg-secondary/30 border-border/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={isUserChoice ? "font-medium text-primary" : ""}>{option.text}</span>
                                    <Badge
                                      variant="outline"
                                      className={isUserChoice ? "bg-primary/20 text-primary border-primary/30" : ""}
                                    >
                                      {percentage}%
                                    </Badge>
                                  </div>
                                  <Progress value={percentage} className="h-2" />
                                  <p className="text-xs text-muted-foreground mt-1">{option.votes} votes</p>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleVote(poll._id, option.optionKey)}
                                  variant="outline"
                                  className="flex-1 justify-start h-auto p-3 border-border/50 hover:border-primary hover:bg-primary/10"
                                  disabled={voteMutation.isPending}
                                >
                                  <span>{option.text}</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {polls.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No polls available yet. Be the first to create one!
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Polls;
