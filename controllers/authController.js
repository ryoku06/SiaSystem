import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";

export const loginPage = (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.render("login", { title: "Login", error_msg: "" });
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.render("login", { title: "Login", error_msg: "Email not found." });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render("login", { title: "Login", error_msg: "Incorrect password." });
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    res.redirect("/dashboard");
  } catch (err) {
    res.render("login", { title: "Login", error_msg: "Server error. Try again." });
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};
