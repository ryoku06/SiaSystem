import express from "express";
const router = express.Router();

// ─── Auth ────────────────────────────────────────────────────────────────────
import { loginPage, loginUser, logoutUser } from "../controllers/authController.js";
router.get("/", (req, res) => res.redirect(req.session.userId ? "/dashboard" : "/login"));
router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

// ─── Dashboard ───────────────────────────────────────────────────────────────
import { dashboardPage } from "../controllers/dashboardController.js";
router.get("/dashboard", dashboardPage);

// ─── Shop ────────────────────────────────────────────────────────────────────
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
router.get("/shop", async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      include: [{ model: Category, as: "category" }],
      order: [["name","ASC"]],
    });
    const productsJson = JSON.stringify(products.map(p => ({
      id: p.id, name: p.name, price: parseFloat(p.price).toFixed(2),
      stock: p.stockQty, category: p.category?.name || "Uncategorized",
      description: p.description,
    })));
    const role = req.session.userRole || "customer";
    res.render("shop", {
      title: "Online Shop", pageTitle: "Online Shop",
      userName: req.session.userName || "Guest",
      userRole: role,
      userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "G",
      isShop: true,
      isAdmin: role === "admin",
      isCashierOrAdmin: ["admin","cashier"].includes(role),
      productsJson,
      isLoggedIn: req.session.userId ? "true" : "false",
    });
  } catch (err) { res.send("Error: " + err.message); }
});

// ─── Products ────────────────────────────────────────────────────────────────
import { productList, createProduct, editProductPage, updateProduct, deleteProduct } from "../controllers/productController.js";
router.get("/products", productList);
router.post("/products/create", createProduct);
router.get("/products/edit/:id", editProductPage);
router.post("/products/edit/:id", updateProduct);
router.get("/products/delete/:id", deleteProduct);

// ─── Categories ──────────────────────────────────────────────────────────────
import { categoryList, createCategory, editCategoryPage, updateCategory, deleteCategory } from "../controllers/categoryController.js";
router.get("/categories", categoryList);
router.post("/categories/create", createCategory);
router.get("/categories/edit/:id", editCategoryPage);
router.post("/categories/edit/:id", updateCategory);
router.get("/categories/delete/:id", deleteCategory);

// ─── Orders ──────────────────────────────────────────────────────────────────
import { orderList, orderDetail, updateOrderStatus, placeOrder } from "../controllers/orderController.js";
router.get("/orders", orderList);
router.post("/orders/place", placeOrder);
router.get("/orders/:id", orderDetail);
router.get("/orders/:id/:action", updateOrderStatus);

// ─── POS ─────────────────────────────────────────────────────────────────────
import { posPage, processTransaction, voidTransaction, posHistory } from "../controllers/posController.js";
router.get("/pos", posPage);
router.post("/pos/transaction", processTransaction);
router.get("/pos/void/:id", voidTransaction);
router.get("/pos/history", posHistory);

// ─── Accounting ──────────────────────────────────────────────────────────────
import { accountingList, addExpense, reportPage } from "../controllers/accountingController.js";
router.get("/accounting", accountingList);
router.post("/accounting/expense", addExpense);
router.get("/accounting/report", reportPage);

// ─── Users ───────────────────────────────────────────────────────────────────
import { userList, createUser, editUserPage, updateUser, deleteUser } from "../controllers/userController.js";
router.get("/users", userList);
router.post("/users/create", createUser);
router.get("/users/edit/:id", editUserPage);
router.post("/users/edit/:id", updateUser);
router.get("/users/delete/:id", deleteUser);

export default router;
