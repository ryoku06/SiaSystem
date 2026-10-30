import { Category } from "../models/Category.js";

const base = (req) => ({
  userName: req.session.userName, userRole: req.session.userRole,
  userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
  isCategories: true,
  isAdmin: req.session.userRole === "admin",
  isCashierOrAdmin: ["admin","cashier"].includes(req.session.userRole),
});

export const categoryList = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const categories = await Category.findAll({ order: [["createdAt","DESC"]] });
    const rows = categories.map(c => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">${c.id}</td>
      <td class="p-3 font-semibold">${c.name}</td>
      <td class="p-3">${c.description || "—"}</td>
      <td class="p-3">
        <a href="/categories/edit/${c.id}" class="text-blue-500 hover:underline text-xs mr-2">Edit</a>
        <a href="/categories/delete/${c.id}" class="text-red-500 hover:underline text-xs" onclick="return confirm('Delete this category?')">Delete</a>
      </td>
    </tr>`).join("") || `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-sm">No categories yet.</td></tr>`;
    res.render("categories", { ...base(req), title: "Categories", pageTitle: "Categories", rows });
  } catch (err) { res.send("Error: " + err.message); }
};

export const createCategory = async (req, res) => {
  try { await Category.create({ name: req.body.name, description: req.body.description }); res.redirect("/categories"); }
  catch (err) { res.send("Error: " + err.message); }
};

export const editCategoryPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.redirect("/categories");
    res.render("category-edit", { ...base(req), title: "Edit Category", pageTitle: "Edit Category", catId: cat.id, catName: cat.name, catDesc: cat.description || "" });
  } catch (err) { res.send("Error: " + err.message); }
};

export const updateCategory = async (req, res) => {
  try { await Category.update({ name: req.body.name, description: req.body.description }, { where: { id: req.params.id } }); res.redirect("/categories"); }
  catch (err) { res.send("Error: " + err.message); }
};

export const deleteCategory = async (req, res) => {
  try { await Category.destroy({ where: { id: req.params.id } }); res.redirect("/categories"); }
  catch (err) { res.send("Error: " + err.message); }
};
