import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Award, BriefcaseBusiness, Clock3, Loader2, Mail, MapPin, Phone, ShieldCheck, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getAgentInitials } from "@/lib/agentProfile";
import {
  AgentDetail as AgentDetailType,
  AgentReview,
  createAgentReview,
  deleteAgent,
  getAgent,
  getAgentReviews,
  revokeAgentVerification,
} from "@/lib/agentsApi";

const statCards = (agent: AgentDetailType) => [
  {
    label: "Rating",
    value: `${agent.rating} / 5`,
    note: `${agent.total_reviews} reviews`,
    icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
  },
  {
    label: "Experience",
    value: `${agent.years_experience} years`,
    note: "Advising buyers and sellers",
    icon: <Award className="w-5 h-5 text-sky-600" />,
  },
  {
    label: "Closed deals",
    value: `${agent.deals_closed}`,
    note: `${agent.total_listings} active and past listings`,
    icon: <BriefcaseBusiness className="w-5 h-5 text-sky-600" />,
  },
  {
    label: "Response time",
    value: agent.response_time || "Fast",
    note: "Average first reply",
    icon: <Clock3 className="w-5 h-5 text-sky-600" />,
  },
];

const AgentDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [agent, setAgent] = useState<AgentDetailType | null>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [adminLoading, setAdminLoading] = useState<"revoke" | "delete" | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadAgent = async () => {
      setLoading(true);
      setError("");
      setActionError("");

      try {
        const [data, reviewData] = await Promise.all([
          getAgent(slug),
          getAgentReviews(slug),
        ]);
        if (!cancelled) {
          setAgent(data);
          setReviews(reviewData);
        }
      } catch (fetchError) {
        console.error("Failed to load agent detail:", fetchError);
        if (!cancelled) {
          setAgent(null);
          setError("Could not load this agent profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAgent();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || loading) return;

    let cancelled = false;
    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await getAgentReviews(slug);
        if (!cancelled) {
          setReviews(data);
        }
      } catch (fetchError) {
        console.error("Failed to load agent reviews:", fetchError);
      } finally {
        if (!cancelled) {
          setLoadingReviews(false);
        }
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [slug, loading]);

  const handleRevokeVerification = async () => {
    if (!agent || !window.confirm(`Remove verification for ${agent.full_name}?`)) return;

    try {
      setAdminLoading("revoke");
      setActionError("");
      await revokeAgentVerification(agent.slug);
      setAgent((prev) => (prev ? { ...prev, is_verified: false } : prev));
    } catch (actionError) {
      console.error("Failed to revoke verification:", actionError);
      setActionError("Could not remove agent verification.");
    } finally {
      setAdminLoading(null);
    }
  };

  const handleDeleteAgent = async () => {
    if (!agent || !window.confirm(`Delete ${agent.full_name} permanently?`)) return;

    try {
      setAdminLoading("delete");
      setActionError("");
      await deleteAgent(agent.slug);
      navigate("/agents", { replace: true });
    } catch (actionError) {
      console.error("Failed to delete agent:", actionError);
      setActionError("Could not delete this agent.");
      setAdminLoading(null);
    }
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slug) return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      await createAgentReview(slug, {
        rating: reviewRating,
        comment: reviewComment,
      });
      const [updatedAgent, updatedReviews] = await Promise.all([
        getAgent(slug),
        getAgentReviews(slug),
      ]);
      setAgent(updatedAgent);
      setReviews(updatedReviews);
      setReviewComment("");
    } catch (submitError) {
      console.error("Failed to submit agent review:", submitError);
      const detail = (submitError as { response?: { data?: { detail?: string; rating?: string[] } } }).response?.data;
      setReviewError(detail?.detail || detail?.rating?.[0] || "Could not submit this rating.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const canReview = Boolean(agent && user?.agent_slug !== agent.slug);

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans">
      <Header />

      <main className="pt-[140px]">
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-700 animate-spin" />
          </div>
        ) : error || !agent ? (
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="rounded-[32px] border border-rose-200 bg-white px-8 py-14 text-center">
              <p className="text-2xl font-semibold text-slate-900">Agent profile unavailable</p>
              <p className="mt-3 text-slate-500">{error || "This agent could not be found."}</p>
              <Link
                to="/agents"
                className="inline-flex items-center gap-2 mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all agents
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="bg-white border-b border-slate-100">
              <div className="max-w-6xl mx-auto px-6 py-10">
                <Link to="/agents" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to all agents
                </Link>

                <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-xl bg-white">
                      <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name} className="object-cover" />
                      <AvatarFallback className="bg-sky-50 text-sky-700 text-3xl font-semibold">
                        {getAgentInitials(agent.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                          agent.is_verified
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {agent.is_verified ? "Verified Blue Sky Agent" : "Not verified yet"}
                      </span>
                      <h1 className="mt-4 text-4xl font-bold text-slate-900">{agent.full_name}</h1>
                      <p className="mt-2 text-lg text-slate-600">{agent.specialization}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {agent.city}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          {agent.rating} rating
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="w-4 h-4" />
                          {agent.response_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      {agent.email && (
                        <Button asChild className="rounded-full bg-sky-700 hover:bg-sky-800 text-white px-6 cursor-pointer">
                          <a href={`mailto:${agent.email}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Email agent
                          </a>
                        </Button>
                      )}
                      {agent.phone && (
                        <Button asChild variant="outline" className="rounded-full px-6 cursor-pointer">
                          <a href={`tel:${agent.phone}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call agent
                          </a>
                        </Button>
                      )}
                    </div>
                    {user?.is_staff && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            className="rounded-full px-6 cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50"
                            disabled={adminLoading !== null || !agent.is_verified}
                            onClick={handleRevokeVerification}
                          >
                            {adminLoading === "revoke" ? "Removing..." : "Remove Verification"}
                          </Button>
                          <Button
                            variant="destructive"
                            className="rounded-full px-6 cursor-pointer"
                            disabled={adminLoading !== null}
                            onClick={handleDeleteAgent}
                          >
                            {adminLoading === "delete" ? "Deleting..." : "Delete Agent"}
                          </Button>
                        </div>
                        {actionError && (
                          <p className="text-sm text-rose-600 font-medium">{actionError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards(agent).map((stat) => (
                  <div key={stat.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">{stat.icon}</div>
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <div className="mt-4 text-2xl font-bold text-slate-900">{stat.value}</div>
                    <p className="mt-1 text-sm text-slate-500">{stat.note}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                <div className="lg:col-span-3 space-y-8">
                  <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">About</h2>
                    <p className="mt-4 text-slate-600 leading-8">
                      {agent.bio || agent.tagline || "This agent profile has not been updated yet."}
                    </p>
                  </div>

                  <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">Coverage areas</h2>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {agent.areas.length > 0 ? (
                        agent.areas.map((area) => (
                          <span key={area} className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                            {area}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-500">No coverage areas yet.</p>
                      )}
                    </div>
                  </div>

                  {agent.activity_visible && (
                    <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
                      <h2 className="text-2xl font-semibold text-slate-900">Latest Activity</h2>
                      {agent.latest_activities.length > 0 ? (
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {agent.latest_activities.map((activity) => (
                            <Link
                              key={activity.id}
                              to={`/property/${activity.id}`}
                              className="block rounded-3xl border border-slate-200 p-4 bg-slate-50/50 transition-all hover:border-sky-200 hover:bg-white hover:shadow-sm"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600">{activity.listing_type}</span>
                              </div>
                              <h3 className="text-base font-semibold text-slate-900 hover:text-sky-700 transition-colors">
                                {activity.title}
                              </h3>
                              <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{activity.address}</span>
                              </div>
                              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                <Clock3 className="w-3.5 h-3.5" />
                                {new Date(activity.created_at).toLocaleString()}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-5 text-slate-500">No recent listing activity yet.</p>
                      )}
                    </div>
                  )}

                  <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Ratings & Comments</h2>
                        <p className="mt-2 text-sm text-slate-500">
                          Visitor feedback for this seller profile.
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-amber-600">
                        {agent.rating} / 5 · {agent.total_reviews} reviews
                      </div>
                    </div>

                    {canReview ? (
                      <form onSubmit={handleReviewSubmit} className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                          <div className="md:w-40">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Rating</label>
                            <select
                              value={reviewRating}
                              onChange={(event) => setReviewRating(Number(event.target.value))}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-500"
                            >
                              {[5, 4, 3, 2, 1].map((value) => (
                                <option key={value} value={value}>{value} stars</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Comment</label>
                            <input
                              value={reviewComment}
                              onChange={(event) => setReviewComment(event.target.value)}
                              placeholder="Share your experience with this seller"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-500"
                            />
                          </div>
                          <Button type="submit" disabled={submittingReview} className="rounded-full bg-sky-700 hover:bg-sky-800">
                            {submittingReview ? "Submitting..." : "Submit Rating"}
                          </Button>
                        </div>
                        {reviewError && <p className="mt-3 text-sm font-medium text-rose-600">{reviewError}</p>}
                      </form>
                    ) : (
                      <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        {isLoggedIn ? "You cannot rate your own profile." : "Sign in to leave a rating and comment."}
                      </div>
                    )}

                    <div className="mt-6 space-y-4">
                      {loadingReviews ? (
                        <div className="text-sm text-slate-500">Loading ratings...</div>
                      ) : reviews.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                          No ratings yet.
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900">{review.reviewer_name}</div>
                                <div className="text-xs text-slate-400">@{review.reviewer_username}</div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-amber-600">{review.rating} / 5</span>
                                <span className="text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {review.comment && (
                              <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
                    <div className="mt-6 space-y-5">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-sky-700" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Email</div>
                          <div className="mt-1 text-slate-700">{agent.email || "Not available"}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-sky-700" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Phone</div>
                          <div className="mt-1 text-slate-700">{agent.phone || "Not available"}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-sky-700" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Base city</div>
                          <div className="mt-1 text-slate-700">{agent.city || "Not available"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">Languages</h2>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {agent.languages.length > 0 ? (
                        agent.languages.map((language) => (
                          <span
                            key={language}
                            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                          >
                            {language}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-500">No language information yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AgentDetail;
