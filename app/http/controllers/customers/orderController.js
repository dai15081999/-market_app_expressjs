const Order = require("../../../models/order");
const moment = require("moment");

function orderController() {
  return {
    async delete(req, res) {
      const order = await Order.findById(req.params.id)

      if (req.user._id.toString() === order.customerId.toString()) {   
        await order.remove()
        return res.json({ redirect: '/customer/orders' });
      } else {
        req.flash('error', 'Xóa lỗi')
        return res.json({ redirect: '/customer/orders' });
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
      const { phone, address } = req.body;

      if (!phone || !address) {
        req.flash("error", "all fileds are required");
        return res.redirect("/cart");
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
            req.flash("success", "Đã đặt hàng thành công");
            delete req.session.cart;

            const eventEmitter = req.app.get("eventEmitter");
            eventEmitter.emit("orderPlaced", placedOrder);
            return res.redirect("/customer/orders");
          });
        })
        .catch((err) => {
          req.flash("error", "something went wrong");
          return res.redirect("/cart");
        });
    },
  };
}

module.exports = orderController;
