import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Send, MessageSquare, Filter, Reply } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

type FeedbackStatus = "submitted" | "in_review" | "resolved";

interface FeedbackItem {
  _id: string;
  category: string;
  description: string;
  status: FeedbackStatus;
  submittedBy?: string;
  submittedAt: string;
  response?: string;
}

const Feedback = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseStatus, setResponseStatus] = useState<FeedbackStatus>("in_review");

  const {
    data: feedbackList = [],
    isLoading,
  } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => api.get<FeedbackItem[]>("/api/feedback"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: () => api.post<FeedbackItem>("/api/feedback", { category, description }),
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      setCategory("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response, status }: { id: string; response: string; status: FeedbackStatus }) =>
      api.post<FeedbackItem>(`/api/teacher/feedback/${id}/respond`, { response, status }),
    onSuccess: () => {
      toast.success("Response recorded");
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setSelectedFeedback(null);
      setResponseMessage("");
      setResponseStatus("in_review");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) {
      toast.error("Please fill all fields");
      return;
    }

    submitFeedbackMutation.mutate();
  };

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case "submitted":
        return "bg-accent/20 text-accent border-accent/30";
      case "in_review":
        return "bg-primary/20 text-primary border-primary/30";
      case "resolved":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      default:
        return "";
    }
  };

  const filteredFeedback = filterStatus === "all"
    ? feedbackList
    : feedbackList.filter((f) => f.status === filterStatus);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading feedback…</p>
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
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Feedback &amp; Grievance</h1>
                <p className="text-sm text-muted-foreground">Share your concerns</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentUser?.role !== "admin" && (
            <Card className="shadow-card hover:shadow-elegant transition-all border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Submit Feedback
                </CardTitle>
                <CardDescription>Let us know your concerns or suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={category} onValueChange={setCategory} disabled={submitFeedbackMutation.isPending}>
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Academics">Academics</SelectItem>
                        <SelectItem value="Faculty">Faculty</SelectItem>
                        <SelectItem value="Facilities">Facilities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your feedback or grievance..."
                      className="min-h-[150px] bg-secondary/50 border-border/50"
                      disabled={submitFeedbackMutation.isPending}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-glow" disabled={submitFeedbackMutation.isPending}>
                    {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className={`shadow-card ${currentUser?.role === "admin" ? "lg:col-span-2" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    {currentUser?.role === "admin" ? "All Feedback" : "Your Feedback"}
                  </CardTitle>
                  <CardDescription>Track feedback status</CardDescription>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeedback.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No feedback found</p>
                ) : (
                  filteredFeedback.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-medium">
                            {feedback.category}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(feedback.status)}>
                            {feedback.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{feedback.description}</p>
                      {currentUser?.role === "admin" && feedback.submittedBy && (
                        <p className="text-xs text-muted-foreground">By: {feedback.submittedBy}</p>
                      )}
                      {feedback.response && (
                        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-xs font-medium text-primary mb-1">Response:</p>
                          <p className="text-sm whitespace-pre-wrap">{feedback.response}</p>
                        </div>
                      )}
                      {currentUser?.role === "teacher" && (
                        <div className="mt-4">
                          <Dialog
                            open={selectedFeedback?._id === feedback._id}
                            onOpenChange={(open) => {
                              if (open) {
                                setSelectedFeedback(feedback);
                                setResponseMessage(feedback.response ?? "");
                                setResponseStatus(feedback.status);
                              } else {
                                setSelectedFeedback(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Reply className="w-4 h-4" />
                                Respond
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Respond to Feedback</DialogTitle>
                                <DialogDescription>Send an update to the student and adjust the status.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  value={responseMessage}
                                  onChange={(e) => setResponseMessage(e.target.value)}
                                  placeholder="Write your response..."
                                  className="min-h-[140px]"
                                />
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Status</label>
                                  <Select value={responseStatus} onValueChange={(value: FeedbackStatus) => setResponseStatus(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="submitted">Submitted</SelectItem>
                                      <SelectItem value="in_review">In Review</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={() => {
                                    if (!responseMessage.trim()) {
                                      toast.error("Response message is required");
                                      return;
                                    }
                                    respondMutation.mutate({ id: feedback._id, response: responseMessage, status: responseStatus });
                                  }}
                                  disabled={respondMutation.isPending}
                                >
                                  {respondMutation.isPending ? "Sending..." : "Send Response"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
