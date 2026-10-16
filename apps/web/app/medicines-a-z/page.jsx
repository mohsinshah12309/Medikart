import { redirect, RedirectType } from 'next/navigation';

export const metadata = {
  title: 'Medicines A-Z Index | Medikart Online Pharmacy Pakistan',
  description: 'Complete directory of authentic prescription and OTC medicines available across Pakistan on Medikart.',
  alternates: {
    canonical: 'https://medikart.pk/medicines-a-z/a',
  },
};

export default function MedicinesAZLandingPage() {
  redirect('/medicines-a-z/a', RedirectType.permanent);
}
