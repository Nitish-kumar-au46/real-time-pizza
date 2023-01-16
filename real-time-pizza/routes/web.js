// coustomer routers for cart or order controller

const homeController = require("../app/http/controllers/homeController");
const authController = require("../app/http/controllers/authController");
const cartController = require("../app/http/controllers/customers/cartController");
const orderController = require("../app/http/controllers/customers/orderController");

// admin controler routes

const adminOrderController = require("../app/http/controllers/admin/adminOrderController");
const statusController = require("../app/http/controllers/admin/statusController");

// middlewares

const guest = require("../app/http/middlerware/guest");
const authCustomer = require("../app/http/middlerware/authCustomer");
const admin = require("../app/http/middlerware/admin");

function initRoutes(app) {
  // homepage route
  app.get("/", homeController().index);

  // customer login routes
  app.get("/login", guest, authController().login);
  app.post("/login", authController().postLogin);

  // customer register routes
  app.get("/register", guest, authController().register);
  app.post("/register", authController().postRegister);

  //  logout routes
  app.post("/logout", authController().logout);

  // cart controller routes
  app.get("/cart", cartController().index);
  app.post("/update-cart", cartController().update);

  // customer routes
  app.post("/orders", authCustomer, orderController().storeOrder);
  app.get("/customer/orders", authCustomer, orderController().customerOrder);
  app.get("/customer/orders/:id", authCustomer, orderController().showOrder);

  // Admin routes
  app.get("/admin/orders", admin, adminOrderController().adminOrder);
  app.post("/admin/order/status", admin, statusController().updateOrderStatus);
}

module.exports = initRoutes;
