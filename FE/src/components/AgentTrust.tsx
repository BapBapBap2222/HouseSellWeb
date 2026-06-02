import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, FileCheck, MapPin, Shield, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAgentInitials } from "@/lib/agentProfile";
import { AgentListItem, getAgents } from "@/lib/agentsApi";

const HOMEPAGE_AGENT_LIMIT = 4;
const TRUSTED_AGENTS_CACHE_TTL_MS = 60_000;

let trustedAgentsCache: {
  items: AgentListItem[];
  cachedAt: number;
} | null = null;

const trustFeatures = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Legal Support",
    description: "Free consultation on contracts and procedures",
  },
  {
    icon: <FileCheck className="w-6 h-6" />,
    title: "Planning Check",
    description: "Verify accurate planning information",
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: "Valuation",
    description: "Objective real estate valuation",
  },
];

export const AgentTrust = () => {
  const [agents, setAgents] = useState<AgentListItem[]>(() => {
    if (trustedAgentsCache && Date.now() - trustedAgentsCache.cachedAt < TRUSTED_AGENTS_CACHE_TTL_MS) {
      return trustedAgentsCache.items;
    }
    return [];
  });

  useEffect(() => {
    if (trustedAgentsCache && Date.now() - trustedAgentsCache.cachedAt < TRUSTED_AGENTS_CACHE_TTL_MS) {
      return undefined;
    }

    const controller = new AbortController();

    const loadAgents = async () => {
      try {
        const data = await getAgents({ page: 1, page_size: HOMEPAGE_AGENT_LIMIT }, controller.signal);
        const visibleAgents = data.slice(0, HOMEPAGE_AGENT_LIMIT);
        trustedAgentsCache = { items: visibleAgents, cachedAt: Date.now() };
        setAgents(visibleAgents);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to load trusted agents:", error);
      }
    };

    loadAgents();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className="section-padding bg-background">
      <div className="max-w-content mx-auto px-4 md:px-8">
        <div className="section-header">
          <div>
            <h2 className="mb-2">Trusted Agents</h2>
            <p className="text-muted-foreground">Professional agents, verified by us</p>
          </div>
          <Link
            to="/agents"
            className="text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {agents.length > 0 ? (
            agents.map((agent) => (
              <motion.div
                key={agent.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Link
                  to={`/agents/${agent.slug}`}
                  className="card-elevated card-hover p-5 text-center cursor-pointer group block h-full"
                >
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name} className="object-cover" />
                      <AvatarFallback className="bg-sky-50 text-sky-700 text-lg font-semibold">
                        {getAgentInitials(agent.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {agent.is_verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-primary mb-1 group-hover:text-accent transition-colors">
                    {agent.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{agent.specialization || agent.tagline}</p>

                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-foreground">{agent.rating}</span>
                    <span className="text-muted-foreground text-sm">({agent.total_reviews})</span>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{agent.areas.join(", ")}</span>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-4 card-elevated p-8 text-center text-muted-foreground">
              No verified agents are available right now.
            </div>
          )}
        </motion.div>

        <motion.div
          className="bg-primary rounded-2xl p-8 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-accent flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
