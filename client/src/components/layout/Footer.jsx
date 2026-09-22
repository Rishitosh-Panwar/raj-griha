import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-primary-900 text-primary-50 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 grid sm:grid-cols-3 gap-8 sm:gap-10">
        <div>
          <h3 className="font-serif text-2xl mb-3">Raj Griha</h3>
          <p className="text-primary-100/80 text-sm leading-relaxed">
            Your comfortable stop on the Char Dham route — open year-round in Uttarkashi, Uttarakhand.
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-primary-100">Contact</h4>
          <div className="space-y-2 text-sm text-primary-100/80">
            <p className="flex items-center gap-2">
              <MapPin size={16} /> Bypass Road, Barethi, Gangotri National Highway, Uttarkashi - 249193, Uttarakhand
            </p>
            <p className="flex items-center gap-2"><Phone size={16} /> +91 7668434826</p>
            <a href="mailto:contact.rajgriha@gmail.com" className="flex items-center gap-2 hover:text-white">
              <Mail size={16} /> contact.rajgriha@gmail.com
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-primary-100">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-primary-100/80">
            <a href="/rooms" className="hover:text-white">Rooms</a>
            <a href="/gallery" className="hover:text-white">Gallery</a>
            <a href="/about" className="hover:text-white">About Us</a>
            <a href="/contact" className="hover:text-white">Contact</a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-700/50 py-4 text-center text-xs text-primary-100/60">
        © {new Date().getFullYear()} Raj Griha. All rights reserved.
        {' · '}
        <a href="/legal/privacy" className="hover:text-white underline">Privacy Policy</a>
        {' · '}
        <a href="/terms" className="hover:text-white underline">Terms</a>
        {' · '}
        <a href="/legal/cancellation-policy" className="hover:text-white underline">Cancellation Policy</a>
      </div>
    </footer>
  );
};

export default Footer;