const User = require("../../models/user");
const bcrypt = require("bcrypt");
const passport = require("passport");

function authController() {
  const _getRedirectUrl = (req) => {
    return req.user.role === "admin" ? "/admin/orders" : "/customer/orders";
  };

  return {
    login(req, res) {
      res.render("auth/login");
    },

    postLogin(req, res, next) {
      const { email, password } = req.body;
      // validation for request
      if (!email || !password) {
        req.flash("error", "All fields are required");
        return res.redirect("/login");
      }

      passport.authenticate("local", (err, user, info) => {
        if (err) {
          req.flash("error", info.messages);
          return next(err);
        }
        if (!user) {
          req.flash("error", info.messages);
          return res.redirect("/login");
        }
        req.logIn(user, (err) => {
          if (err) {
            req.flash("error", info.messages);
            return next(err);
          }

          return res.redirect(_getRedirectUrl(req));
        });
      })(req, res, next);
    },

    register(req, res) {
      res.render("auth/register");
    },

    async postRegister(req, res) {
      const { name, email, password } = req.body;
      // validation for request
      if (!name || !email || !password) {
        req.flash("error", "All fields are required");
        req.flash("name", name);
        req.flash("email", email);
        return res.redirect("/register");
      }

      User.exists({ email: email }, (err, result) => {
        if (result) {
          req.flash("error", "Email already exist");
          req.flash("name", name);
          req.flash("email", email);
          return res.redirect("/register");
        }
      });

      // hasing the password

      const hassedPassword = await bcrypt.hash(password, 10);

      // create a user

      const user = new User({
        name,
        email,
        password: hassedPassword,
      });

      user
        .save()
        .then((user) => {
          return res.redirect("/");
        })
        .catch((err) => {
          req.flash("error", "Something went wrong");
          return res.redirect("/register");
        });
    },

    logout(req, res, next) {
      req.logout((err) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/login");
      });
    },
  };
}

module.exports = authController;
