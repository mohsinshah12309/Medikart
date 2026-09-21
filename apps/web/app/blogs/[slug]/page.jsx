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
  HelpCircle,
  Table as TableIcon,
  Tag,
  ShoppingBag,
  Layers,
} from "lucide-react";
import { BLOGS_DATA, getBlogBySlug } from "../../../data/blogsData";
import ProductCard from "../../../components/ProductCard";

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
        contentBlocks: [
          { type: "paragraph", text: staticBlog.content },
          { type: "heading", level: 2, text: "Doctor & Pharmacist Guidance for Pakistani Families" },
          {
            type: "paragraph",
            text: "Healthcare management in Pakistan requires balancing cultural lifestyle habits with modern evidence-based clinical protocols. Whether preparing meals, administering pediatric formulations, or taking chronic daily prescription therapies, consistency and patient education are the most effective tools for preventing acute complications.",
          },
          {
            type: "callout",
            text: "Licensed Pharmacist Advisory: Always inspect medicine packaging for DRAP registration numbers (D-Reg), lot numbers, and intact tamper seals. If symptoms persist beyond 48 hours or you observe high fever, dyspnea, or severe pain, consult your physician immediately.",
          },
          {
            type: "disclaimer",
            text: "Medical Disclaimer: The information provided in this article is for educational purposes only and does not substitute for professional medical advice, clinical diagnosis, or treatment. Always seek the advice of a qualified healthcare provider or licensed pharmacist regarding any medical condition or prescription regimen in Pakistan.",
          },
        ],
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
      description: "Read doctor-verified health guides and medicine safety articles on Medikart.",
    };
  }

  const title = `${blog.title} | Medikart Health Guide`;
  const description = blog.summary || (blog.content ? blog.content.slice(0, 150) + '...' : `Read ${blog.title} on Medikart Pakistan.`);
  const canonicalUrl = `${siteUrl}/blogs/${slug}`;
  const bannerImg = blog.thumbnailUrl || blog.image || `${siteUrl}/og-image.png`;
  const fullBannerUrl = bannerImg.startsWith('http') ? bannerImg : `${siteUrl}${bannerImg.startsWith('/') ? '' : '/'}${bannerImg}`;

  return {
    title,
    description,
    keywords: [
      blog.categoryName || blog.category || 'Health Guide',
      'health tips Pakistan',
      'medicine guide Pakistan',
      'doctor advice Lahore',
      'Medikart blog',
    ],
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
      authors: [blog.author || 'Dr. Ayesha Siddiqui (FCPS)'],
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
    'dateModified': blog.publishedAt || blog.date || '2026-09-01',
    'author': {
      '@type': 'Person',
      'name': blog.author || 'Dr. Ayesha Siddiqui (FCPS)',
      'jobTitle': 'Pediatrician & Medical Reviewer',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Medikart',
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/icon.png`,
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

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
              👨‍⚕️
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">{blog.author || "Dr. Ayesha Siddiqui (FCPS)"}</p>
              <p className="text-[11px] text-amber-700 font-semibold">Clinically Reviewed &amp; Verified</p>
            </div>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{blog.readTimeMinutes || 4} min read</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Published {new Date(blog.publishedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </header>

      {/* ─── Branded 1200x630 Hero Thumbnail Banner ─── */}
      <div className="relative w-full aspect-[1.91/1] rounded-3xl overflow-hidden shadow-warm-card border border-amber-200/80 bg-slate-950">
        <img
          src={bannerImg}
          alt={blog.title}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* ─── Clinical Summary Callout ─── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white border border-amber-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Key Clinical Takeaway</span>
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
          {blog.summary}
        </p>
      </div>

      {/* ─── Structured Article Body (contentBlocks) ─── */}
      <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
        {blog.contentBlocks && blog.contentBlocks.length > 0 ? (
          blog.contentBlocks.map((block, idx) => {
            if (block.type === "heading") {
              const HeadingTag = block.level === 3 ? "h3" : "h2";
              return (
                <HeadingTag
                  key={idx}
                  className={`${
                    block.level === 3 ? "text-lg sm:text-xl font-extrabold" : "text-xl sm:text-2xl font-black"
                  } font-heading text-slate-900 pt-3 flex items-center gap-2`}
                >
                  <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block flex-shrink-0" />
                  <span>{block.text}</span>
                </HeadingTag>
              );
            }

            if (block.type === "paragraph") {
              return (
                <p key={idx} className="leading-relaxed text-slate-700">
                  {block.text}
                </p>
              );
            }

            if (block.type === "table" && block.tableData) {
              const { headers = [], rows = [] } = block.tableData;
              return (
                <div key={idx} className="my-6">
                  {block.text && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      <TableIcon className="w-4 h-4 text-amber-600" />
                      <span>{block.text}</span>
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-3xs bg-white">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      {headers.length > 0 && (
                        <thead className="bg-amber-100/80 text-amber-950 font-extrabold uppercase tracking-wider text-[11px] border-b border-amber-200">
                          <tr>
                            {headers.map((h, hIdx) => (
                              <th key={hIdx} className="py-3 px-3 sm:px-4">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 0 ? "bg-white hover:bg-amber-50/40" : "bg-amber-50/20 hover:bg-amber-50/50"}
                          >
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-3 sm:px-4 font-medium">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            if (block.type === "callout") {
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-slate-800 my-5 shadow-2xs flex items-start gap-3"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {block.text}
                  </div>
                </div>
              );
            }

            if (block.type === "faq" && block.faqItems && block.faqItems.length > 0) {
              return (
                <div key={idx} className="my-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 mb-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>Frequently Asked Questions</span>
                  </div>
                  {block.faqItems.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-3xs space-y-1.5"
                    >
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="text-amber-600 font-black">Q:</span>
                        <span>{faq.question}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              );
            }

            if (block.type === "disclaimer") {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs my-4 leading-relaxed italic"
                >
                  {block.text}
                </div>
              );
            }

            return null;
          })
        ) : (
          <p>{blog.content}</p>
        )}

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="pt-3">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Related Topics &amp; Tags</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Instant Prescription Order Callout Banner ─── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-amber-glow">
        <div className="text-left space-y-1">
          <h3 className="text-lg sm:text-xl font-black font-heading">
            Need Authentic Medicines Delivered in 2 Hours?
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-900">
            Order 100% genuine DRAP-approved medicines with Cash on Delivery across Pakistan.
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
