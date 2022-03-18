import axios from "axios";
import Noty from "noty";

export function placeOrder(formObject) {
    axios
      .post("/orders", formObject)
      .then((res) => {
        new Noty({
          type: "success",
          timeout: 1000,
          text: res.data.success,
          progressBar: false,
        }).show();
      })
      .catch((err) => {
        new Noty({
          type: "error",
          timeout: 1500,
          text: "something went wrong",
          progressBar: false,
        }).show();
      });
    setTimeout(() => {
      window.location.href = "/customer/orders";
    }, 1200);
}