/* eslint-disable */
import axios from 'axios';

const stripe = Stripe(
  'pk_test_51SAuDMGbRXt2eNIemaIeVw2J1lj4FsJ16ZI2ggMM8qge2rfUz8i4aAGltyz2HVgj9yr4VvT8LiTRPhMuqa0E03Kj00BQbrO1os'
);

export const bookTour = async tourId => {
  try {
    // 1) Get Checkout session from API
    const session = await axios.get(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    console.log('Checkout session:', session);

    // 2) Redirect to Checkout form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.error('Error booking tour:', err);
    alert('Something went wrong with booking. Please try again!');
  }
};
