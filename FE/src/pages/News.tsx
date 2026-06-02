import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  DollarSign,
  Eye,
  Layers,
  MapPin,
  Newspaper,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Pagination } from '@/components/listings/Pagination';
import { getNewsList, NewsItem, NewsListResponse } from '@/lib/newsApi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DEFAULT_FEATURED = {
  title: 'Vietnam Real Estate Market Insights',
  excerpt: 'Follow the latest published updates about the Vietnamese property market, pricing trends and major investment areas.',
  image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80',
  date: 'Latest update',
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  'https://images.unsplash.com/photo-1585129777188-94600bc7b4b3?w=800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
];

const PRICE_DATA = {
  months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  hcmc: [62, 64, 63, 66, 69, 72],
  hanoi: [55, 56, 58, 57, 60, 62],
  danang: [35, 36, 35, 37, 38, 40],
};

const MARKET_STATS = [
  { label: 'Avg. Price/m²', value: '72M VND', change: '+5.2%', positive: true, icon: DollarSign },
  { label: 'Total Listings', value: '24,380', change: '+12.1%', positive: true, icon: Layers },
  { label: 'Monthly Views', value: '1.8M', change: '+18.5%', positive: true, icon: Eye },
  { label: 'Active Buyers', value: '52,100', change: '+8.7%', positive: true, icon: Users },
];

const TOP_PROVINCES = [
  { name: 'Ho Chi Minh City', slug: 'ho-chi-minh', avgPrice: '72M', change: '+5.2%', listings: 8420, positive: true },
  { name: 'Hanoi', slug: 'ha-noi', avgPrice: '62M', change: '+3.8%', listings: 6180, positive: true },
  { name: 'Da Nang', slug: 'da-nang', avgPrice: '40M', change: '+6.1%', listings: 3250, positive: true },
  { name: 'Binh Duong', slug: 'binh-duong', avgPrice: '28M', change: '+4.5%', listings: 2890, positive: true },
  { name: 'Nha Trang', slug: 'khanh-hoa', avgPrice: '35M', change: '-1.2%', listings: 1640, positive: false },
];

const LATEST_NEWS_PAGE_SIZE = 7;
const ALL_NEWS_PAGE_SIZE = 20;

interface NewsCardArticle {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  image: string;
}

const normalizeNewsResponse = (response: NewsListResponse): { items: NewsItem[]; count: number } => {
  if (Array.isArray(response)) {
    return { items: response, count: response.length };
  }

  return {
    items: Array.isArray(response.results) ? response.results : [],
    count: response.count ?? 0,
  };
};

const formatNewsDate = (value: string): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const buildExcerpt = (content: string, maxLength: number): string => {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}...`;
};

const mapNewsItemToCard = (item: NewsItem, index: number): NewsCardArticle => ({
  id: item.id,
  title: item.title,
  excerpt: buildExcerpt(item.content, 140),
  date: formatNewsDate(item.created_at),
  image: item.thumbnail || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
});

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function PriceChart({ data }: { data: typeof PRICE_DATA }) {
  const legendItems = [
    { label: 'Ho Chi Minh City', color: '#0F766E' },
    { label: 'Hanoi', color: '#0369A1' },
    { label: 'Da Nang', color: '#D97706' },
  ];

  const chartData = {
    labels: data.months,
    datasets: [
      {
        label: 'Ho Chi Minh City',
        data: data.hcmc,
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0F766E',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      },
      {
        label: 'Hanoi',
        data: data.hanoi,
        borderColor: '#0369A1',
        backgroundColor: 'rgba(3, 105, 161, 0.06)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0369A1',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      },
      {
        label: 'Da Nang',
        data: data.danang,
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.05)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#D97706',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: 600 as const, family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => ` ${ctx.dataset.label}: ${ctx.parsed.y}M VND/m²`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12, weight: 600 as const, family: "'Inter', sans-serif" },
          color: '#94A3B8',
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: '#F1F5F9',
          drawBorder: false,
        },
        ticks: {
          font: { size: 12, weight: 600 as const, family: "'Inter', sans-serif" },
          color: '#94A3B8',
          callback: (val: string | number) => `${val}M`,
        },
        border: { display: false },
        min: 30,
      },
    },
  };

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 pl-[78px] pt-1">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
            <span
              className="h-[18px] w-[18px] rounded-full border-[3px] bg-white"
              style={{ borderColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="relative w-full" style={{ height: 236 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

function StatCard({ stat, index }: { stat: typeof MARKET_STATS[0]; index: number }) {
  const Icon = stat.icon;
  const numericValue = parseInt(stat.value.replace(/[^0-9]/g, ''), 10);
  const { value, ref } = useAnimatedCounter(numericValue || 0, 1400);

  const displayValue = stat.value.includes('M')
    ? `${(value / 10).toFixed(1)}M`
    : stat.value.includes('K')
      ? `${(value / 1000).toFixed(0)}K`
      : value.toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:border-slate-200 hover:shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 p-2.5 text-teal-600 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {stat.positive ? <TrendingUp className="mr-1 inline h-3 w-3" /> : <TrendingDown className="mr-1 inline h-3 w-3" />}
          {stat.change}
        </span>
      </div>
      <p className=" text-2xl font-bold tracking-tight text-slate-900">{displayValue}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{stat.label}</p>
    </motion.div>
  );
}

function NewsCard({ article, index }: { article: NewsCardArticle; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      viewport={{ once: true }}
      className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:border-slate-200 hover:shadow-xl"
    >
      <Link to={`/news/${article.id}`} className="flex flex-1 flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-1 text-xs font-semibold text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          {article.date}
        </div>
        <h3 className=" mb-2 line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-teal-700">
          {article.title}
        </h3>
        <p className="flex-1 line-clamp-3 text-sm leading-relaxed text-slate-500">{article.excerpt}</p>
      </div>
      </Link>
    </motion.article>
  );
}

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAllView = searchParams.get('view') === 'all';
  const currentPage = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [isAllView, currentPage]);

  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allCount, setAllCount] = useState(0);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const response = await getNewsList({ page: 1, page_size: LATEST_NEWS_PAGE_SIZE });
        const normalized = normalizeNewsResponse(response);
        setLatestNews(normalized.items);
      } catch (error) {
        console.error('Failed to load latest news:', error);
        setLatestNews([]);
      } finally {
        setLatestLoading(false);
      }
    };

    fetchLatestNews();
  }, []);

  useEffect(() => {
    if (!isAllView) return;

    const fetchAllNews = async () => {
      setAllLoading(true);
      try {
        const response = await getNewsList({ page: currentPage, page_size: ALL_NEWS_PAGE_SIZE });
        const normalized = normalizeNewsResponse(response);
        setAllNews(normalized.items);
        setAllCount(normalized.count);
      } catch (error) {
        console.error('Failed to load all news:', error);
        setAllNews([]);
        setAllCount(0);
      } finally {
        setAllLoading(false);
      }
    };

    fetchAllNews();
  }, [currentPage, isAllView]);

  const featuredArticle = useMemo(() => {
    if (latestNews.length === 0) {
      return DEFAULT_FEATURED;
    }

    const featured = latestNews[0];
    return {
      title: featured.title,
      excerpt: buildExcerpt(featured.content, 220),
      image: featured.thumbnail || DEFAULT_FEATURED.image,
      date: formatNewsDate(featured.created_at),
    };
  }, [latestNews]);

  const latestCards = useMemo(
    () => latestNews.slice(1, 7).map((item, index) => mapNewsItemToCard(item, index)),
    [latestNews],
  );

  const allCards = useMemo(
    () => allNews.map((item, index) => mapNewsItemToCard(item, index)),
    [allNews],
  );

  const newsCards = isAllView ? allCards : latestCards;
  const isGridLoading = isAllView ? allLoading : latestLoading;
  const totalPages = Math.max(1, Math.ceil(allCount / ALL_NEWS_PAGE_SIZE));

  const updateSearch = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />

      <div role="main" className="pb-16 pt-28">
        <section className="mx-auto mb-12 max-w-[1440px] px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="group relative overflow-hidden rounded-3xl"
          >
            <div className="relative h-[360px] md:h-[480px]">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-white/70">
                  <Calendar className="h-3.5 w-3.5" />
                  {featuredArticle.date}
                </span>
              </div>
              <h1 className=" mb-3 max-w-3xl text-2xl font-bold leading-tight text-white md:text-4xl">
                {featuredArticle.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                {featuredArticle.excerpt}
              </p>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto mb-12 max-w-[1440px] px-4 md:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {MARKET_STATS.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>
        </section>

        <section className="mx-auto mb-12 max-w-[1440px] px-4 md:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-1 flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 p-2.5 text-teal-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h2 className=" text-xl font-bold text-slate-900">Price Predictions</h2>
              </div>
              <p className="mb-6 ml-[52px] text-sm font-medium text-slate-500">Average price per m² (millions VND) - Last 6 months</p>

              <PriceChart data={PRICE_DATA} />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { city: 'Ho Chi Minh City', price: '72M VND/m²', trend: '+5.2%', color: '#0F766E', positive: true },
                  { city: 'Hanoi', price: '62M VND/m²', trend: '+3.8%', color: '#0369A1', positive: true },
                  { city: 'Da Nang', price: '40M VND/m²', trend: '+6.1%', color: '#D97706', positive: true },
                ].map((city) => (
                  <div key={city.city} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: city.color }} />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{city.city}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {city.price} <span className={city.positive ? 'text-emerald-600' : 'text-red-500'}>{city.trend}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="w-full flex-shrink-0 lg:w-[380px]"
            >
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 text-amber-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className=" text-lg font-bold text-slate-900">Top Provinces</h3>
                    <p className="text-xs font-medium text-slate-500">By average price per m²</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {TOP_PROVINCES.map((province, index) => (
                    <Link
                      key={province.name}
                      to={`/listings?province=${province.slug}`}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:border-slate-200 hover:bg-slate-50"
                    >
                      <span className="w-6 text-center text-sm font-bold text-slate-400">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-teal-700">{province.name}</p>
                        <p className="text-xs font-medium text-slate-500">{province.listings.toLocaleString()} listings</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-900">{province.avgPrice}</p>
                        <p className={`text-xs font-bold ${province.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {province.positive ? <TrendingUp className="mr-0.5 inline h-3 w-3" /> : <TrendingDown className="mr-0.5 inline h-3 w-3" />}
                          {province.change}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-sky-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-bold text-teal-800">Market Health</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: '78%' }} />
                    </div>
                    <span className="text-sm font-bold text-teal-700">78%</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-teal-600">Strong buyer demand • Growing supply</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto mb-12 max-w-[1440px] px-4 md:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-2.5 text-violet-600">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h2 className=" text-xl font-bold text-slate-900">{isAllView ? 'All News' : 'Latest News'}</h2>
                <p className="text-sm font-medium text-slate-500">
                  {isAllView ? 'All published news articles, 20 items per page.' : 'Showing the 6 latest published real estate news articles.'}
                </p>
              </div>
            </div>

            {isAllView ? (
              <button
                type="button"
                onClick={() => setSearchParams(new URLSearchParams())}
                className="hidden cursor-pointer items-center gap-1 text-sm font-bold text-teal-600 transition-colors hover:text-teal-700 sm:flex"
              >
                Back to Latest <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateSearch({ view: 'all', page: '1' })}
                className="hidden cursor-pointer items-center gap-1 text-sm font-bold text-teal-600 transition-colors hover:text-teal-700 sm:flex"
              >
                View All <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isGridLoading ? (
              <div className="col-span-full py-10 text-center text-gray-500">Loading news...</div>
            ) : newsCards.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-slate-500">
                No published news articles yet.
              </div>
            ) : (
              newsCards.map((article, index) => (
                <NewsCard key={article.id} article={article} index={index} />
              ))
            )}
          </div>

          {!isAllView && (
            <button
              type="button"
              onClick={() => updateSearch({ view: 'all', page: '1' })}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-teal-600 sm:hidden"
            >
              View All News <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {isAllView && totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => updateSearch({ view: 'all', page: String(page) })}
              />
            </div>
          )}
        </section>

        <section className="mx-auto mb-12 max-w-[1440px] px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl p-8 md:p-12"
            style={{
              background: 'linear-gradient(135deg, #0F766E 0%, #0369A1 50%, #1E40AF 100%)',
            }}
          >
            <div className="absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-20 h-48 w-48 translate-y-1/2 rounded-full bg-white/5" />

            <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
                  <span className="text-sm font-bold text-teal-200">AI-Powered Prediction</span>
                </div>
                <h2 className=" mb-3 text-2xl font-bold text-white md:text-3xl">Q2 2026 Market Forecast</h2>
                <p className="max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                  Our AI model predicts a continued <span className="font-bold text-emerald-300">4-7% growth</span> in Vietnam&apos;s major urban markets,
                  with Thu Duc City and Long An emerging as top investment hotspots for the next quarter.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-teal-700">
                <BarChart3 className="h-5 w-5" />
                Market outlook
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default News;

