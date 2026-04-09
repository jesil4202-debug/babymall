import Link from 'next/link';
import Image from 'next/image';
import { Heart, Mail, Phone, MapPin, Globe, Send, Rss, Video } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'New Arrivals', href: '/products?sort=-createdAt' },
    { name: 'Featured', href: '/products?featured=true' },
    { name: 'Clothing', href: '/products?category=clothing' },
    { name: 'Toys & Play', href: '/products?category=toys' },
    { name: 'Nursery', href: '/products?category=nursery' },
  ],
  account: [
    { name: 'My Account', href: '/account' },
    { name: 'My Orders', href: '/account/orders' },
    { name: 'Wishlist', href: '/wishlist' },
    { name: 'Cart', href: '/cart' },
    { name: 'Login', href: '/auth/login' },
  ],
  help: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Shipping Policy', href: '/shipping' },
    { name: 'Return Policy', href: '/returns' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 mt-20">
      {/* Top section */}
      <div className="container-main py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="relative transition-opacity duration-300 group-hover:opacity-90 bg-transparent">
                <Image src="/logo.png" width={120} height={120} alt="Logo" />
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5 font-500">
              Premium baby products for every milestone. Trusted by thousands of happy parents across India.
            </p>
            <div className="flex gap-3">
            {[Globe, Send, Rss, Video].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-500 hover:text-white transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-800 text-white mb-4 text-sm uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-primary-400 transition-colors font-500">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-800 text-white mb-4 text-sm uppercase tracking-wider">My Account</h3>
            <ul className="space-y-2.5">
              {footerLinks.account.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-primary-400 transition-colors font-500">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-800 text-white mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400 font-500">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                Baby Mall , kozhinjampara palakkad, kerala , India
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400 font-500">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                +91 85908 55175
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400 font-500">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                support@babymall.in
              </li>
            </ul>

            {/* Newsletter CTA */}
            <div className="mt-6">
              <p className="text-xs font-700 text-white mb-2 uppercase tracking-wider">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary-500 transition-colors"
                />
                <button className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-700 hover:bg-primary-600 transition-colors">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-t border-gray-900 py-6">
        <div className="container-main">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 font-600">
            <span className="flex items-center gap-1.5">Secure Payments</span>
            
            <span className="flex items-center gap-1.5">Easy Returns</span>
            <span className="flex items-center gap-1.5">Quality Assured</span>
            <span className="flex items-center gap-1.5">24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-900 py-4">
        <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 font-500">
          <p>Copyright {new Date().getFullYear()} Baby Mall. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary-500 fill-primary-500" /> for little ones
          </p>
        </div>
      </div>
    </footer>
  );
}
