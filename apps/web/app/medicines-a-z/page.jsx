import { redirect, RedirectType } from 'next/navigation';

export const metadata = {
  title: { absolute: 'Medicines A-Z Directory | Authentic Pharmaceutical Index | Medikart Pakistan' },
  description: 'Complete directory of authentic prescription and OTC medicines available across Pakistan on Medikart.',
  alternates: {
    canonical: 'https://medikart.pk/medicines-a-z/a',
  },
};

export default function MedicinesAZLandingPage() {
  redirect('/medicines-a-z/a', RedirectType.permanent);
}
