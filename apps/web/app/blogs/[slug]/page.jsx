import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Calendar,
  UserCheck,
  ShieldCheck,
  Share2,
  Sparkles,
  Pill,
  ArrowRight,
} from "lucide-react";
import { BLOGS_DATA, getBlogBySlug } from "../../../data/blogsData";

export async function generateStaticParams() {
  return BLOGS_DATA.map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const blog = getBlogBySlug(resolvedParams?.slug);
  if (!blog) {
    return { title: "Article Not Found | Medikart Blogs" };
  }
  return {
    title: `${blog.title} | Medikart Health Blogs`,
    description: blog.summary,
  };
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const blog = getBlogBySlug(resolvedParams?.slug);

  if (!blog) {
    notFound();
  }

  // 3 Related articles in same category
  const relatedBlogs = BLOGS_DATA.filter(
    (b) => b.categorySlug === blog.categorySlug && b.slug !== blog.slug
  ).slice(0, 3);

  return (
    <article className="max-w-4xl mx-auto flex flex-col gap-8 pb-16 text-left animate-fade-in-up">
      {/* ─── Top Breadcrumb Navigation ─── */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Health Articles</span>
        </Link>

        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {blog.category}
        </span>
      </div>

      {/* ─── Article Header ─── */}
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-slate-900 leading-[1.18]">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
              👨‍⚕️
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">{blog.author}</p>
              <p className="text-[11px] text-emerald-700 font-semibold">Clinically Reviewed &amp; Verified</p>
            </div>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{blog.readTime}</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Published {blog.date}</span>
          </div>
        </div>
      </header>

      {/* ─── Hero Cover Photography ─── */}
      <div className="relative h-64 sm:h-96 w-full rounded-3xl overflow-hidden shadow-warm-card border border-[#F3EFE6] bg-slate-100">
        <Image
          src={blog.image}
          alt={blog.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-cover"
        />
      </div>

      {/* ─── Clinical Summary Callout ─── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 mb-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Key Clinical Takeaway</span>
        </div>
        <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
          {blog.summary}
        </p>
      </div>

      {/* ─── Article Body ─── */}
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-5">
        <p>{blog.content}</p>

        <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 pt-4">
          Doctor &amp; Pharmacist Guidance for Pakistani Families
        </h2>

        <p>
          Healthcare management in Pakistan requires balancing cultural lifestyle habits with
          modern evidence-based clinical protocols. Whether preparing meals, administering pediatric
          formulations, or taking chronic daily prescription therapies, consistency and patient education
          are the most effective tools for preventing acute complications.
        </p>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 my-4">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Licensed Pharmacist Advisory</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            Always inspect medicine packaging for DRAP registration numbers (D-Reg), lot numbers,
            and intact tamper seals. If symptoms persist beyond 48 hours or you observe high fever,
            dyspnea, or severe pain, consult your physician immediately.
          </p>
        </div>

        <h3 className="text-lg font-black text-slate-900 pt-2">Tags &amp; Clinical Topics</h3>
        <div className="flex flex-wrap gap-2 pt-1 not-prose">
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

      {/* ─── Need Medicines or Consultation Banner ─── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-amber-glow">
        <div className="text-left space-y-1">
          <h3 className="text-lg sm:text-xl font-black font-heading">
            Need Prescriptions or Health Essentials?
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-900">
            Order 100% genuine medicines delivered directly to your doorstep with Cash on Delivery.
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
            Browse Products
          </Link>
        </div>
      </div>

      {/* ─── Related Articles ─── */}
      {relatedBlogs.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-xl font-black font-heading text-slate-900">
            Related Health Articles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedBlogs.map((rel) => (
              <Link
                key={rel.id}
                href={`/blogs/${rel.slug}`}
                className="group p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-3xs transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 sm:h-44 w-full rounded-2xl overflow-hidden mb-3 bg-slate-100">
                    <Image
                      src={rel.image}
                      alt={rel.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                    {rel.title}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                  <span>Read Article</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
