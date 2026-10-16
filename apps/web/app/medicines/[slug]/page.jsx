import { redirect, RedirectType } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    alternates: {
      canonical: `https://medikart.pk/brands/${slug}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function MedicineSlugRedirect({ params }) {
  const { slug } = await params;
  redirect(`/brands/${slug}`, RedirectType.permanent);
}
