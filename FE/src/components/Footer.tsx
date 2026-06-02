import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  company: {
    title: 'Company',
    links: [
      { label: 'Explore', href: '/explore' },
      { label: 'Agents', href: '/agents' },
      { label: 'News', href: '/news' },
      { label: 'Listings', href: '/listings' },
    ],
  },
  services: {
    title: 'Services',
    links: [
      { label: 'Buy', href: '/listings?type=sale' },
      { label: 'Rent', href: '/listings?type=rent' },
      { label: 'Prediction', href: '/prediction' },
      { label: 'Sell Property', href: '/add-property' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Profile', href: '/profile' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Admin', href: '/admin-dashboard' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
      { label: 'Dispute Resolution', href: '/terms#disputes' },
    ],
  },
};

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: Facebook },
  { label: 'YouTube', href: 'https://www.youtube.com/', icon: Youtube },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: Instagram },
];

export const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      {/* Main Footer */}
      <div className="max-w-content mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-3xl font-bold text-white tracking-widest">BLUE - SKY</span>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-sm">
              Connecting you with the best real estate values. Trusted - Transparent - Effective.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-white/70">
                <Phone className="w-5 h-5 text-accent" />
                <span>1900 1234 56</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="w-5 h-5 text-accent" />
                <span>support@BlueSky.vn</span>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
                <span>10th Floor, ABC Building, 123 Nguyen Van Linh, Dist.7, HCMC</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, column]) => (
            <div key={key}>
                <h3 className="font-semibold text-foreground mb-4">{column.title}</h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
            </div>
          ))}
        </div>

        {/* App Download */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white/70 mb-2">Download Blue Sky App</p>
              <div className="flex gap-3">
                <Link to="/listings" className="bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-white/60">Open</p>
                    <p className="text-sm font-medium">Listings</p>
                  </div>
                </Link>
                <Link to="/prediction" className="bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.991l-2.302 2.302-8.634-8.635z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-white/60">Open</p>
                    <p className="text-sm font-medium">Prediction</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Certificates */}
            <div className="flex items-center gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                <p className="text-[10px] text-white/60 mb-1">Registered with</p>
                <p className="text-sm font-medium">Ministry of Industry and Trade</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-content mx-auto px-4 md:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Blue Sky. All rights reserved.</p>
            <ul className="flex items-center gap-8">
                <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy#cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
