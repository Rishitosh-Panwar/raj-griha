import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '917668434826';

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about Raj Griha.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
    >
      <MessageCircle size={28} fill="white" strokeWidth={0} />
    </a>
  );
};

export default WhatsAppButton;