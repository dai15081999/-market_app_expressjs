const Order = require("../../../models/order");
const moment = require("moment");
const stripe = require("stripe")('pk_test_51JBaZZJRyMM48n1r5tphaB4mXjYL3su9sLZR6pGXgE1aouUizgOQ9s0pUhUosXVzUstgdKJBfsHU3jrVHCJ34m8j00Yz5XsKzO');

function orderController() {
  return {
    async delete(req, res) {
      const order = await Order.findById(req.params.id);

      if (req.user._id.toString() === order.customerId.toString()) {
        await order.remove();
        return res.json({ redirect: "/customer/orders" });
      } else {
        req.flash("error", "Xóa lỗi");
        return res.json({ redirect: "/customer/orders" });
      }
    },
    async show(req, res) {
      const order = await Order.findById(req.params.id);

      if (req.user._id.toString() === order.customerId.toString()) {
        return res.render("customers/singleOrder", { order: order });
      } else {
        return res.redirect("/");
      }
    },
    async index(req, res) {
      const orders = await Order.find({ customerId: req.user._id }, null, {
        sort: { createdAt: -1 },
      });
      res.header("Cache-Control", "no-store");
      res.render("customers/orders", { orders: orders, moment: moment });
    },
    store(req, res) {
      const { phone, address, stripeToken, paymentType } = req.body;

      if (!phone || !address) {
        return res
          .status(422)
          .json({ message: "tất cả các mục không được trống" });
      }

      const order = new Order({
        customerId: req.user._id,
        items: req.session.cart.items,
        phone,
        address,
      });

      order
        .save()
        .then((result) => {
          Order.populate(result, { path: "customerId" }, (err, placedOrder) => {
            // req.flash("success", "Đã đặt hàng thành công");

            // Stripe payment
            if (paymentType === "card") {
              stripe.charges
                .create({
                  amount: req.session.cart.totalPrice * 100,
                  source: stripeToken,
                  currency: "usd",
                  description: `product order: ${placedOrder._id}`,
                })
                .then(() => {
                  placedOrder.paymentStatus = true;
                  placedOrder.paymentType = paymentType;
                  placedOrder
                    .save()
                    .then((ord) => {
                      // Emit
                      const eventEmitter = req.app.get("eventEmitter");
                      eventEmitter.emit("orderPlaced", ord);
                      delete req.session.cart;
                      return res.json({ success: "Đã đặt hàng thành công" });
                    
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                })
                .catch((err) => {
                  delete req.session.cart;
                  return res.json({ success: "Đã có lỗi xảy ra" });
                });
            }

          });
        })
        .catch((err) => {
          // req.flash("error", "something went wrong");
          // return res.redirect("/cart");
          return res.status(500).json({ success: "Đã có lỗi xảy ra" });
        });
    },
  };
}

module.exports = orderController;
