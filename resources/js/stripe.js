
import { loadStripe } from "@stripe/stripe-js";
import { placeOrder } from './apiService'
import {CardWidget} from './CardWidget'


export async function initStripe() {
  const paymentType = document.querySelector("#paymentType");
  const stripe = await loadStripe('sk_test_51JBaZZJRyMM48n1rrieovlit5nDKj7pnX8EGrCCqauYQvqBDocxC8lzI4Pb83RTab0KlOC24IshZ2LvH6hBGGHUN00S12bH05I');
  let card = null

  if (paymentType) {
    paymentType.addEventListener("change", (e) => {
      if (e.target.value === "card") {
        card = new CardWidget(stripe)
        card.mount()
      } else {
        card = new CardWidget(stripe)
        card.destroy()
      }
    });
  }

  //Ajax call
const paymentForm = document.querySelector("#payment-form");
if (paymentForm) {
  paymentForm.addEventListener("submit",async (e) => {
    e.preventDefault();
    let formData = new FormData(paymentForm);
    let formObject = {};

    for (let [key, value] of formData.entries()) {
      formObject[key] = value;
    }

    if(!card) {
        placeOrder(formObject)
        return
    }
    // verify token stripe
     const token = await new CardWidget(stripe).createToken()
     formObject.stripeToken = token.id
     placeOrder(formObject)
    
  });
}
}

