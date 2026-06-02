import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Loader2, User } from 'lucide-react';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getNewsDetail, NewsItem } from '@/lib/newsApi';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadArticle = async () => {
      const articleId = Number(id);
      if (!Number.isInteger(articleId) || articleId <= 0) {
        setError('News article ID is invalid.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getNewsDetail(articleId);
        if (mounted) {
          setArticle(data);
        }
      } catch {
        if (mounted) {
          setError('Cannot load this news article right now.');
          setArticle(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadArticle();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-32 md:px-8">
        <Link to="/news" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Article unavailable</h1>
            <p className="mt-3 text-sm text-red-600">{error}</p>
          </div>
        ) : article ? (
          <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <img
              src={article.thumbnail || FALLBACK_IMAGE}
              alt={article.title}
              className="h-[320px] w-full object-cover md:h-[440px]"
            />

            <div className="p-6 md:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.created_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {article.author_fullname || article.author_name || 'Blue Sky'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {article.views_count} views
                </span>
              </div>

              <h1 className="text-3xl font-bold leading-tight text-slate-950 md:text-4xl">{article.title}</h1>
              <div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700">
                {article.content}
              </div>
            </div>
          </article>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;
