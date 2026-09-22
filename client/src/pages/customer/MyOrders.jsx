import OrdersList from '../../components/OrdersList';

const MyOrders = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 sm:py-16">
      <h1 className="font-serif text-3xl text-primary-800 mb-8">My Orders</h1>
      <OrdersList />
    </div>
  );
};

export default MyOrders;