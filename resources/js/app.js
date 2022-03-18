import moment from "moment";
import axios from "axios";
import Noty from "noty";
import initAdmin from "./admin";
import {initStripe} from './stripe'


let addToCart = document.querySelectorAll(".add-to-cart");
let cartCounter = document.querySelector("#cartCounter");

function updateCart(product) {
  axios
    .post("/update-cart", product)
    .then((res) => {
      cartCounter.innerHTML = res.data.totalQty;
      new Noty({
        type: "success",
        timeout: 1500,
        text: "Thêm vào giỏ thành công1",
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
}


addToCart.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    let product = JSON.parse(btn.dataset.product);
    updateCart(product);
  });
});

const alertMsg = document.getElementById("success-alert");

if (alertMsg) {
  setTimeout(() => {
    alertMsg.remove();
  }, 1500);
}



let statuses = document.querySelectorAll(".status_line");
let hiddenInput = document.querySelector("#hiddenInput");
let order = hiddenInput ? hiddenInput.value : null;
order = JSON.parse(order);
let time = document.createElement("small");

function updateStatus(order) {
  statuses.forEach(status => {
    status.classList.remove('step-completed')
    status.classList.remove('current')
  })
  let stepCompleted = true;
  statuses.forEach((status) => {
    let dataProp = status.dataset.status;
    if (stepCompleted) {
      status.classList.add("step-completed");
    }
    if (dataProp === order.status) {
      stepCompleted = false;
      time.innerText = moment(order.updatedAt).format("hh:mm A");
      status.appendChild(time);
      if (status.nextElementSibling) {
        status.nextElementSibling.classList.add("current");
      }
    }
  });
}



updateStatus(order);
// stripe
initStripe()



let socket = io();
initAdmin(socket);

if(order) {
    socket.emit("join", `order_${order._id}`);
}

let adminAreaPath = window.location.pathname
if(adminAreaPath.includes('admin')) {
  socket.emit('join', 'adminRoom')
}

socket.on('orderUpdated', (data) => {
  const updatedOrder = {...order}
  updatedOrder.updatedAt = moment().format()
  updatedOrder.status = data.status
  updateStatus(updatedOrder)
  new Noty({
    type: "success",
    timeout: 1000,
    text: "Order updated",
    progressBar: false,
  }).show();
})

