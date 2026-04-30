export interface LandingSocialProofItem {
  id: string;
  number: string;
  label: string;
  iconEmbed?: string;
}

export interface LandingHeroConfig {
  badge?: string;
  title: string;
  subtitle: string;
  button1Text: string;
  button1Color?: string;
  button2Text: string;
  button2Color?: string;
  showBadge: boolean;
  showCTAs: boolean;
  showSocialProof: boolean;
  socialProofItems: LandingSocialProofItem[];
}

export interface LandingFeatureItem {
  id: string;
  iconEmbed: string;
  title: string;
  description: string;
}

export interface LandingFeatureConfig {
  sectionTitle: string;
  items: LandingFeatureItem[];
}

export interface LandingTestimonialItem {
  id: string;
  name: string;
  role: string;
  content: string;
  stars: number;
  initial: string;
}

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LandingNavbarConfig {
  logoText: string;
  logoIconEmbed: string;
  showProducts: boolean;
  showRedeem: boolean;
  links: { label: string; href: string }[];
}

export interface LandingFooterConfig {
  address: string;
  email: string;
  whatsapp?: string;
  socialLinks: { platform: string; url: string; iconEmbed?: string }[];
  docLinks: { label: string; href: string }[];
}
