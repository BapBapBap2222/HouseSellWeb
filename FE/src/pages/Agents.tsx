import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, BriefcaseBusiness, Clock3, MapPin, Search, ShieldCheck, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AgentListItem, getAgents } from "@/lib/agentsApi";
import { getAgentInitials } from "@/lib/agentProfile";

type SortMode = "rating" | "experience" | "reviews";

const sortAgents = (items: AgentListItem[], mode: SortMode) => {
  const list = [...items];

  if (mode === "experience") {
    return list.sort((a, b) => b.years_experience - a.years_experience);
  }

  if (mode === "reviews") {
    return list.sort((a, b) => b.total_reviews - a.total_reviews);
  }

  return list.sort((a, b) => Number(b.rating) - Number(a.rating));
};

const Agents = () => {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("rating");
  const deferredSearch = useDeferredValue(searchText);

  useEffect(() => {
    const controller = new AbortController();

    const loadAgents = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAgents({ page: 1, page_size: 20 }, controller.signal);
        setAgents(data);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to load agents:", fetchError);
        setAgents([]);
        setError("Could not load the trusted agent directory.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadAgents();

    return () => {
      controller.abort();
    };
  }, []);

  const cities = useMemo(() => {
    return Array.from(new Set(agents.map((agent) => agent.city).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    const filtered = agents.filter((agent) => {
      const matchesSearch =
        keyword.length === 0 ||
        [
          agent.full_name,
          agent.city,
          agent.specialization,
          agent.tagline,
          ...agent.areas,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesCity = selectedCity === "all" || agent.city === selectedCity;
      const matchesVerified = !verifiedOnly || agent.is_verified;

      return matchesSearch && matchesCity && matchesVerified;
    });

    return sortAgents(filtered, sortMode);
  }, [agents, deferredSearch, selectedCity, sortMode, verifiedOnly]);

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans">
      <Header />

      <main className="pt-[140px]">
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 text-sky-700 text-sm font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Blue Sky Trusted Agents
              </span>
              <h1 className="mt-5 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Meet the agents behind our verified property network
              </h1>
              <p className="mt-4 text-lg text-slate-500 leading-8">
                Browse experienced advisors, compare their focus areas, and open a full profile before you decide who
                to contact.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start">
            <aside className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 xl:sticky xl:top-36">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setSelectedCity("all");
                    setVerifiedOnly(false);
                    setSortMode("rating");
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Agent name, city, area..."
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">City</label>
                  <select
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 cursor-pointer"
                  >
                    <option value="all">All cities</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Sort by</label>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 cursor-pointer"
                  >
                    <option value="rating">Highest rating</option>
                    <option value="experience">Most experience</option>
                    <option value="reviews">Most reviews</option>
                  </select>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(event) => setVerifiedOnly(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Verified agents only</div>
                    <div className="text-sm text-slate-500 mt-1">Show agents that passed Blue Sky review.</div>
                  </div>
                </label>
              </div>
            </aside>

            <div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{filteredAgents.length} agents</p>
                  <p className="text-sm text-slate-500 mt-1">Profiles with verified coverage areas, ratings, and contact details.</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-600">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-80 rounded-[28px] bg-white border border-slate-200 animate-pulse" />
                  ))}
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-8 py-20 text-center">
                  <p className="text-2xl font-semibold text-slate-900">No agents match these filters</p>
                  <p className="text-slate-500 mt-3">Try another city, remove the search keyword, or show all verified agents.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      to={`/agents/${agent.slug}`}
                      className="group bg-white rounded-[28px] border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-6"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-20 h-20 border border-slate-100">
                          <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name} className="object-cover" />
                          <AvatarFallback className="bg-sky-50 text-sky-700 text-xl font-semibold">
                            {getAgentInitials(agent.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="text-xl font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                                {agent.full_name}
                              </h2>
                              <p className="text-sm text-slate-500 mt-1">{agent.specialization}</p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                agent.is_verified
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {agent.is_verified ? "Verified" : "Not verified"}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 mt-4 leading-6">{agent.tagline}</p>

                          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                Rating
                              </div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">
                                {agent.rating} <span className="text-sm font-normal text-slate-500">({agent.total_reviews})</span>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Award className="w-4 h-4 text-sky-600" />
                                Experience
                              </div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{agent.years_experience} years</div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <BriefcaseBusiness className="w-4 h-4 text-sky-600" />
                                Closed deals
                              </div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{agent.deals_closed}</div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Clock3 className="w-4 h-4 text-sky-600" />
                                Response
                              </div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{agent.response_time || "Fast"}</div>
                            </div>
                          </div>

                          <div className="mt-5 flex items-start gap-2 text-sm text-slate-500">
                            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-slate-700">{agent.city}</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {agent.areas.map((area) => (
                                  <span key={area} className="rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Agents;
