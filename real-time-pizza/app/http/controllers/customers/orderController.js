const Order = require("../../../models/order");
const moment = require("moment");
function orderController() {
  return {
    storeOrder(req, res) {
      // request validation code is here
      const { phone, address } = req.body;

      if (!phone || !address) {
        req.flesh("error", "All fields are required for order");
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
          Order.populate(
            result,
            { path: "customerId" },
            (err, placedOrder) => {}
          );
          req.flash("Success", "Order placed successfully");
          delete req.session.cart;

          // emit event
          const eventEmitter = req.app.get("eventEmitter");
          eventEmitter.emit("orderPlaced", placedOrder);

          return res.redirect("/customer/orders");
        })
        .catch((err) => {
          req.flash("error", "Something went wrong");
          return res.redirect("/cart");
        });
    },

    async customerOrder(req, res) {
      const orders = await Order.find({ customerId: req.user._id }, null, {
        sort: { createdAt: -1 },
      });

      res.header(
        "Cache-Control",
        "no-cache,private, no-store,must-revalidate, max-scale=0,post-check=0,pre-check=0"
      );
      res.render("customers/orders", { orders: orders, moment: moment });
    },
    async showOrder(req, res) {
      const order = await Order.findById(req.params.id);

      if (req.user._id.toString() === order.customerId.toString()) {
        return res.render("customers/singleOrder", { order });
      }
      return res.redirect("/");
    },
  };
}

module.exports = orderController;
