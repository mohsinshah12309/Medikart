import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Tag,
  ShoppingBag,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { BLOGS_DATA, getBlogBySlug } from "../../../data/blogsData";
import ProductCard from "../../../components/ProductCard";
import ReadingProgressBar from "../../../components/blog/ReadingProgressBar";
import BlogShareBar from "../../../components/blog/BlogShareBar";
import BlogTableOfContents from "../../../components/blog/BlogTableOfContents";
import BlogFaqAccordion from "../../../components/blog/BlogFaqAccordion";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const staticSlugs = BLOGS_DATA.map((b) => ({ slug: b.slug }));
  return staticSlugs;
}

const getFullUrl = (path) => {
  const fallback = "/uploads/placeholder.webp";
  if (!path || path === "/images/placeholder-product.png") {
    return fallback;
  }
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "") : "";
  return path.startsWith("http") || path.startsWith("/") ? path : `${apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
};

async function getBlogData(slug) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/blogs/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.blog) {
        return json.data;
      }
    }
  } catch (_) {}

  // Fallback to static seed data
  const staticBlog = getBlogBySlug(slug);
  if (staticBlog) {
    return {
      blog: {
        ...staticBlog,
        thumbnailUrl: staticBlog.image,
        categoryName: staticBlog.category,
        categorySlug: staticBlog.categorySlug,
        readTimeMinutes: parseInt(staticBlog.readTime) || 4,
        publishedAt: staticBlog.date,
        metaDescription: staticBlog.metaDescription || null,
        faqSchema: staticBlog.faqSchema || [],
      },
      relatedBlogs: BLOGS_DATA.filter((b) => b.categorySlug === staticBlog.categorySlug && b.slug !== staticBlog.slug).slice(0, 3),
      relatedCategories: [
        { name: "Baby & Mother Care", slug: "baby-mother-care" },
        { name: "Medicines & Antibiotics", slug: "medicines" },
        { name: "Nutrition & Supplements", slug: "nutrition-supplements" },
        { name: "Personal Care", slug: "personal-care" },
      ],
      relatedProducts: [],
    };
  }

  return null;
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = resolved?.slug || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';

  const data = await getBlogData(slug);
  const blog = data?.blog;

  if (!blog) {
    return {
      title: "Health & Wellness Article | Medikart Pakistan",
      description: "Read healthcare and medicine guidance articles on Medikart.",
    };
  }

  const title = `${blog.title} | Medikart Health Guide`;
  const description = blog.metaDescription || blog.summary || (blog.content ? blog.content.slice(0, 155) + '...' : `Read ${blog.title} on Medikart Pakistan.`);
  const canonicalUrl = `${siteUrl}/blogs/${slug}`;
  const bannerImg = blog.thumbnailUrl || blog.image || `${siteUrl}/og-image.png`;
  const fullBannerUrl = bannerImg.startsWith('http') ? bannerImg : `${siteUrl}${bannerImg.startsWith('/') ? '' : '/'}${bannerImg}`;

  return {
    title,
    description,
    keywords: [
      blog.title,
      `${blog.title} Pakistan`,
      blog.categoryName || blog.category || 'Health Guide',
      ...(Array.isArray(blog.tags) ? blog.tags : []),
      'health tips Pakistan',
      'medicine guide Pakistan',
      'clinical healthcare Pakistan',
      'Medikart health guide',
      'online pharmacy Pakistan',
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Medikart - Authentic Online Pharmacy',
      locale: 'en_PK',
      type: 'article',
      publishedTime: blog.publishedAt || blog.date,
      authors: [blog.author || 'Medikart Health Team'],
      images: [
        {
          url: fullBannerUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullBannerUrl],
    },
  };
}

// Helpers for Server-Side Markdown Parsing
function slugifyHeading(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderBoldText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderRichText(text) {
  if (!text) return null;

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: "text", content: text.slice(lastIdx, match.index) });
    }
    parts.push({
      type: "link",
      text: match[1],
      url: match[2],
    });
    lastIdx = linkRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push({ type: "text", content: text.slice(lastIdx) });
  }

  return (
    <>
      {parts.map((p, idx) => {
        if (p.type === "link") {
          const isInternal =
            p.url.includes("medikart.pk") || p.url.startsWith("/");
          const cleanUrl = p.url.replace("https://medikart.pk", "") || "/";

          if (isInternal) {
            return (
              <Link
                key={idx}
                href={cleanUrl}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 font-bold text-xs sm:text-sm text-slate-900 bg-gradient-to-r from-amber-200/90 via-yellow-200 to-amber-100 hover:from-amber-300 hover:to-yellow-300 rounded-lg border border-amber-300/80 shadow-3xs hover:shadow-2xs transition-all duration-200 hover:-translate-y-0.5 group/link"
              >
                <span className="text-amber-800 text-xs">💊</span>
                <span className="underline decoration-amber-500/50 underline-offset-2">
                  {p.text}
                </span>
                <span className="text-amber-800 opacity-70 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </Link>
            );
          }

          return (
            <a
              key={idx}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mx-1 font-semibold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-400 decoration-2 underline-offset-2 hover:decoration-emerald-700 transition-colors"
            >
              <span>{p.text}</span>
              <span className="text-[11px] text-emerald-600 font-bold">↗</span>
            </a>
          );
        }

        return <span key={idx}>{renderBoldText(p.content)}</span>;
      })}
    </>
  );
}

export default async function BlogPostPage({ params }) {
  const resolved = await params;
  const slug = resolved?.slug || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';

  const blogData = await getBlogData(slug);

  if (!blogData?.blog) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-3">
        <h2 className="text-2xl font-black text-slate-900">Article Not Found</h2>
        <p className="text-slate-600">The requested healthcare article could not be found.</p>
        <Link href="/blogs" className="inline-block mt-2 px-5 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs">
          &larr; Back to Health Hub
        </Link>
      </div>
    );
  }

  const { blog, relatedBlogs = [], relatedCategories = [], relatedProducts = [] } = blogData;
  const bannerImg = getFullUrl(blog.thumbnailUrl || blog.image || "/images/blogs/family-wellness.jpg");
  const fullBannerUrl = bannerImg.startsWith('http') ? bannerImg : `${siteUrl}${bannerImg.startsWith('/') ? '' : '/'}${bannerImg}`;
  const canonicalUrl = `${siteUrl}/blogs/${slug}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': blog.title,
    'description': blog.summary || blog.title,
    'image': [fullBannerUrl],
    'datePublished': blog.publishedAt || blog.date || '2026-09-01',
    'dateModified': blog.updatedAt || blog.publishedAt || blog.date || '2026-09-01',
    'author': {
      '@type': 'Organization',
      'name': blog.author || 'Medikart Health Team',
      'url': siteUrl,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Medikart',
      'url': siteUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/icon.png`,
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    'keywords': Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
    'articleSection': blog.categoryName || 'Health & Wellness',
    'inLanguage': 'en-PK',
  };

  // AEO: FAQPage schema for Google AI Overviews & rich snippet FAQ results
  const faqItems = blog.faqSchema || [];
  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  } : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Health & Wellness Blog',
        'item': `${siteUrl}/blogs`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': blog.title,
        'item': canonicalUrl,
      },
    ],
  };

  // Server-side parsing of ## headings and paragraphs
  const rawContent = blog.content || "";
  const lines = rawContent.split("\n");
  const parsedSections = [];
  let currentHeading = null;
  let currentParagraphs = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      if (currentHeading || currentParagraphs.length > 0) {
        parsedSections.push({
          heading: currentHeading,
          paragraphs: currentParagraphs,
        });
      }
      currentHeading = trimmed.replace(/^##\s+/, "");
      currentParagraphs = [];
    } else if (trimmed.length > 0) {
      currentParagraphs.push(trimmed);
    }
  });

  if (currentHeading || currentParagraphs.length > 0) {
    parsedSections.push({
      heading: currentHeading,
      paragraphs: currentParagraphs,
    });
  }

  const tocItems = parsedSections
    .filter((s) => Boolean(s.heading))
    .map((s, idx) => ({
      id: slugifyHeading(s.heading),
      text: s.heading,
      index: idx + 1,
    }));

  const wordCount = rawContent.split(/\s+/).filter(Boolean).length;

  return (
    <article className="max-w-4xl mx-auto flex flex-col gap-8 pb-16 text-left animate-fade-in-up">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* ─── Reading Progress Bar (Client Island) ─── */}
      <ReadingProgressBar />

      {/* ─── Top Breadcrumb Navigation ─── */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Health Articles</span>
        </Link>

        <span className="text-xs font-extrabold text-amber-950 bg-amber-100/90 px-3.5 py-1 rounded-full border border-amber-300 shadow-3xs">
          {blog.categoryName || blog.category}
        </span>
      </div>

      {/* ─── Article Header ─── */}
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-slate-900 leading-[1.16]">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs border border-amber-200">
              🏥
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">{blog.author || "Medikart Health Team"}</p>
              <p className="text-[11px] text-amber-700 font-semibold">Health &amp; Wellness Editorial</p>
            </div>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{blog.readTimeMinutes || 6} min read</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Published {new Date(blog.publishedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </header>

      {/* ─── Branded 1200x630 Hero Thumbnail Banner ─── */}
      <div className="group relative w-full aspect-[1.91/1] rounded-3xl overflow-hidden shadow-warm-card border border-amber-200/90 bg-slate-950">
        <img
          src={bannerImg}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
          loading="eager"
        />
        {/* Subtle overlay gradient & verified pill */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-amber-300 backdrop-blur-md text-[11px] font-black uppercase tracking-wider border border-amber-400/40 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Medikart Clinical Guide</span>
          </span>
        </div>
      </div>

      {/* ─── Clinical Summary Callout ─── */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white border-2 border-amber-300/80 shadow-warm-card overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-3xs flex-shrink-0 mt-0.5 border border-amber-300">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-950">
              Key Clinical Takeaway
            </span>
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
              {blog.summary}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Engagement & Share Bar (Client Island) ─── */}
      <BlogShareBar
        title={blog.title}
        slug={slug}
        wordCount={wordCount}
        readTimeMinutes={blog.readTimeMinutes || 6}
        siteUrl={siteUrl}
      />

      {/* ─── Table of Contents (Client Island) ─── */}
      <BlogTableOfContents tocItems={tocItems} />

      {/* ─── Server Rendered Structured Article Body ─── */}
      <div className="space-y-8 my-6">
        {parsedSections.map((section, sIdx) => {
          const headingId = section.heading
            ? slugifyHeading(section.heading)
            : `section-${sIdx}`;

          return (
            <section
              key={sIdx}
              id={headingId}
              className="scroll-mt-24 space-y-4 group/section"
            >
              {section.heading && (
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300/80 shadow-3xs">
                      Section {String(sIdx + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-amber-300/60 to-transparent" />
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black font-heading text-slate-900 tracking-tight leading-snug flex items-center justify-between group">
                    <span>{section.heading}</span>
                    <a
                      href={`#${headingId}`}
                      className="opacity-0 group-hover:opacity-100 text-amber-600 hover:text-amber-700 text-sm font-bold transition-opacity p-1.5"
                      title="Link to this section"
                      aria-label={`Link to section ${section.heading}`}
                    >
                      #
                    </a>
                  </h2>
                </div>
              )}

              {/* Render Section Paragraphs */}
              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px] sm:text-[16.5px]">
                {section.paragraphs.map((p, pIdx) => {
                  if (p.startsWith("- ") || p.startsWith("* ")) {
                    return (
                      <div
                        key={pIdx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 text-slate-800 shadow-3xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                        <div className="leading-snug">
                          {renderRichText(p.replace(/^[-*]\s+/, ""))}
                        </div>
                      </div>
                    );
                  }

                  const isLead = sIdx === 0 && pIdx === 0;

                  return (
                    <p
                      key={pIdx}
                      className={`leading-relaxed text-slate-700 ${
                        isLead
                          ? "text-base sm:text-lg font-medium text-slate-800 bg-gradient-to-r from-amber-50/60 via-white to-transparent p-4 rounded-2xl border-l-4 border-amber-400 shadow-3xs"
                          : ""
                      }`}
                    >
                      {renderRichText(p)}
                    </p>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* ─── DRAP Pharmacist Advisory Card ─── */}
      <div className="my-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50/40 to-white border-2 border-amber-300 shadow-warm-card relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                DRAP Clinical Standard
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Licensed Pharmacist Verification
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Need Help Choosing Authentic Medicines in Pakistan?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Always verify genuine DRAP registration codes (D-Reg), batch numbers,
              and temperature storage seals on all pharmaceutical products. Our
              licensed pharmacists are on standby to verify your prescription
              online.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/instant-order"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
              >
                <span>Upload Doctor Prescription</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-amber-50 text-slate-900 text-xs font-bold border border-slate-200 shadow-3xs transition-all"
              >
                <span>Consult Pharmacist</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive FAQ Accordion (Client Island) ─── */}
      <BlogFaqAccordion faqItems={blog.faqSchema || []} />

      {/* ─── E-E-A-T Author & Reviewer Card ─── */}
      <div className="my-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-3xs border border-amber-300">
            👨‍⚕️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 text-sm">
                {blog.author || "Medikart Health Team"}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                ✓ Verified Clinical Team
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {blog.authorTitle ||
                "Medikart Clinical Editorial — Reviewed by Licensed Pakistani Pharmacists & Clinicians"}
            </p>
          </div>
        </div>

        <Link
          href="/faqs"
          className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition-colors whitespace-nowrap"
        >
          View Editorial Guidelines &rarr;
        </Link>
      </div>

      {/* ─── Related Tags Pill Strip ─── */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Related Topics &amp; Search Tags</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blogs?q=${encodeURIComponent(tag)}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all hover:scale-105 shadow-3xs"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Instant Prescription Order Callout Banner ─── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-amber-glow">
        <div className="text-left space-y-1">
          <h3 className="text-lg sm:text-xl font-black font-heading">
            Need Authentic Medicines Delivered in 2 Hours?
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-900">
            Order 100% authentic prescription and OTC medicines with Cash on Delivery across Pakistan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/instant-order"
            className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap"
          >
            Upload Prescription &rarr;
          </Link>
          <Link
            href="/#store-catalog"
            className="px-4 py-2.5 rounded-full bg-white hover:bg-amber-50 text-slate-900 text-xs font-bold shadow-xs transition-all whitespace-nowrap"
          >
            Shop Catalog
          </Link>
        </div>
      </div>

      {/* ─── SECTION: RELATED CATEGORIES ─── */}
      {relatedCategories && relatedCategories.length > 0 && (
        <section className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-heading text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Related Categories</span>
            </h3>
            <Link href="/#store-catalog" className="text-xs font-bold text-amber-700 hover:text-amber-800">
              View All Categories &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedCategories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                href={`/?category=${encodeURIComponent(cat.slug || cat._id)}#store-catalog`}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/20 shadow-3xs transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 text-base font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  🏷️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                    {cat.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">Explore items &rarr;</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── SECTION: RELATED PRODUCTS (STORE TIE-IN) ─── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black font-heading text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <span>Related Medicines &amp; Healthcare Products</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Authentic treatments and supplements mentioned in this guide.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* ─── SECTION: RELATED HEALTH ARTICLES ─── */}
      {relatedBlogs && relatedBlogs.length > 0 && (
        <section className="pt-6 border-t border-slate-200 space-y-4">
          <h3 className="text-xl font-black font-heading text-slate-900">
            Related Health Articles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedBlogs.map((rel) => {
              const relImg = getFullUrl(rel.thumbnailUrl || rel.image || "/images/blogs/family-wellness.jpg");
              return (
                <Link
                  key={rel._id || rel.id || rel.slug}
                  href={`/blogs/${rel.slug}`}
                  className="group p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 shadow-3xs transition-all text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[1.91/1] w-full rounded-2xl overflow-hidden mb-3 bg-slate-950">
                      <img
                        src={relImg}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-800 line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 mt-2 flex items-center gap-1">
                    <span>Read Article</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
