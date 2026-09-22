const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl text-primary-800 mb-6">Privacy Policy</h1>
      <div className="prose text-gray-600 space-y-4 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
        <p>
          Raj Griha ("we", "us") collects personal information you provide when booking a room, placing
          a food order, or contacting us — including your name, email address, phone number, and stay
          details. We use this information solely to manage your booking, process orders, communicate
          with you about your stay, and improve our services.
        </p>
        <p>
          We do not sell or share your personal information with third parties, except as required to
          process payments (via our payment partner) or where required by law.
        </p>
        <p>
          Your data is stored securely and retained only as long as necessary for booking records and
          legal/accounting requirements. You may request access to, correction of, or deletion of your
          personal data by contacting us at contact.rajgriha@gmail.com.
        </p>
        <p>
          Our website uses cookies solely to keep you logged in and remember your session — we do not
          use tracking or advertising cookies.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;