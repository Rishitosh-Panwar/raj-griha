const CancellationPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl text-primary-800 mb-6">Cancellation & Refund Policy</h1>
      <div className="prose text-gray-600 space-y-4 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
        <p>
          If you need to cancel a paid booking, the following applies based on how far ahead of your
          check-in date you cancel:
        </p>
        <div className="bg-primary-50 rounded-2xl p-5 space-y-3">
          <p><b>More than 10 days before check-in:</b> 50% of the amount you've paid is refunded to your
          original payment method (processed within 5–7 business days once approved). The remaining 50%
          is held as credit toward a future stay — just get in touch with us with proof of your original
          booking when you're ready to rebook.</p>
          <p><b>10 days or fewer before check-in:</b> Cancellations within this window are not eligible
          for a refund or credit.</p>
        </div>
        <p>
          Bookings can be cancelled from your account under "My Bookings." Once cancelled, you'll receive
          an email confirming the outcome for your specific booking.
        </p>
        <p>
          For group bookings, this policy applies individually to each room in the group.
        </p>
        <p>
          For any questions about a specific cancellation, contact us at contact.rajgriha@gmail.com.
        </p>
      </div>
    </div>
  );
};

export default CancellationPolicy;