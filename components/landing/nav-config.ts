export const mainNav = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const

/**
 * Footer destinations are placeholders until those routes exist — they stay as
 * in-page anchors so `<Link>` prefetching never chases a 404.
 */
export const footerNav = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { href: "#", label: "Start a shop" },
      { href: "#", label: "Migrate to Vendly" },
      { href: "#", label: "Seller handbook" },
      { href: "#", label: "Payout schedule" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Careers" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Acceptable use" },
      { href: "#", label: "Security" },
    ],
  },
] as const
