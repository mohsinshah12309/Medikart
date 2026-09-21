export const metadata = {
  title: "Order Confirmation & Invoice | Medikart",
  description: "View your Medikart pharmacy order summary, estimated delivery time, and official medicine invoice.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Order Confirmation & Invoice | Medikart",
    description: "View your Medikart pharmacy order summary, estimated delivery time, and official medicine invoice.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Order Confirmation & Invoice | Medikart",
    description: "View your Medikart pharmacy order summary, estimated delivery time, and official medicine invoice.",
  },
};

export default function RouteLayout({ children }) {
  return children;
}
