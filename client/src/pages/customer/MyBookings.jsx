import BookingsList from '../../components/BookingsList';

const MyBookings = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 sm:py-16">
      <h1 className="font-serif text-3xl text-primary-800 mb-8">My Bookings</h1>
      <BookingsList />
    </div>
  );
};

export default MyBookings;