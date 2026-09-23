const Terms = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl text-primary-800 mb-6">Terms & Conditions</h1>
      <div className="prose text-gray-600 space-y-4 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
        <p><b>Bookings:</b> Submitting a booking request through our website reserves your room pending confirmation by our team. We will contact you to confirm availability and finalize payment.</p>
        <p><b>Check-in / Check-out:</b> Standard check-in is from 12:00 PM and check-out is by 12:00 PM, unless otherwise agreed with our staff.</p>
        <p><b>Cancellations:</b> Bookings may be cancelled from your account prior to check-in. See our <a href="/legal/cancellation-policy" className="text-primary-600 underline">Cancellation & Refund Policy</a> for full details on refund eligibility.</p>
        <p><b>Meal Plans:</b> EP, CP, and MAP plans determine which meals are included with your room rate, as described at the time of booking. Additional à la carte food orders are billed separately.</p>
        <p><b>Room Pricing & Occupancy:</b> Rooms with more beds than the standard 2-guest rate (e.g. 3-bed or 4-bed rooms) are offered at a discounted rate when booked below full occupancy. The listed price applies for up to one guest fewer than the room's full bed capacity. When a booking reaches full occupancy (guests equal to the number of beds), the full-occupancy rate applies instead, as shown at the time of booking. This is clearly indicated on each room's page before you book.</p>
        <p><b>Conduct:</b> Guests are expected to treat hotel property, staff, and other guests respectfully. Raj Griha reserves the right to refuse or discontinue service for conduct that violates this expectation.</p>
        <p>For any questions about these terms, contact us at contact.rajgriha@gmail.com.</p>
      </div>
    </div>
  );
};

export default Terms;