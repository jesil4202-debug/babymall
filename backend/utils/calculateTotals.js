exports.calculateTotals = (items) => {
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity, 0
  );

  const deliveryTotal = items.reduce(
    (acc, item) => acc + item.deliveryCharge * item.quantity, 0
  );

  return {
    subtotal,
    deliveryTotal,
    totalAmount: subtotal + deliveryTotal
  };
};
