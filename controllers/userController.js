import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";

const base = (req) => ({
  userName: req.session.userName, userRole: req.session.userRole,
  userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
  isUsers: true,
  isAdmin: req.session.userRole === "admin",
  isCashierOrAdmin: ["admin","cashier"].includes(req.session.userRole),
});

export const userList = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const users = await User.findAll({ order: [["createdAt","DESC"]] });
    const rows = users.map(u => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">${u.id}</td>
      <td class="p-3 font-semibold">${u.name}</td>
      <td class="p-3">${u.email}</td>
      <td class="p-3"><span class="badge badge-${u.role}">${u.role}</span></td>
      <td class="p-3"><span class="badge ${u.isActive?"badge-success":"badge-danger"}">${u.isActive?"Active":"Inactive"}</span></td>
      <td class="p-3">
        <a href="/users/edit/${u.id}" class="text-blue-500 hover:underline text-xs mr-2">Edit</a>
        ${u.id !== req.session.userId ? `<a href="/users/delete/${u.id}" class="text-red-500 hover:underline text-xs" onclick="return confirm('Delete user ${u.name}?')">Delete</a>` : `<span class="text-gray-300 text-xs">You</span>`}
      </td>
    </tr>`).join("") || `<tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">No users.</td></tr>`;
    res.render("users", { ...base(req), title:"Users", pageTitle:"Users", rows });
  } catch (err) { res.send("Error: " + err.message); }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, address } = req.body;
    await User.create({ name, email, password: await bcrypt.hash(password,10), role, address });
    res.redirect("/users");
  } catch (err) { res.send("Error: " + err.message); }
};

export const editUserPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.redirect("/users");
    const roleOptions = ["admin","cashier","customer"].map(r => `<option value="${r}" ${r===user.role?"selected":""}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join("");
    res.render("user-edit", { ...base(req), title:"Edit User", pageTitle:`Edit User — ${user.name}`, userId:user.id, userName2:user.name, userEmail:user.email, userAddress:user.address||"", isActiveChecked:user.isActive?"checked":"", roleOptions });
  } catch (err) { res.send("Error: " + err.message); }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, address, isActive, password } = req.body;
    const data = { name, email, role, address, isActive: isActive==="on" };
    if (password && password.trim()) data.password = await bcrypt.hash(password,10);
    await User.update(data, { where: { id: req.params.id } });
    res.redirect("/users");
  } catch (err) { res.send("Error: " + err.message); }
};

export const deleteUser = async (req, res) => {
  try { await User.destroy({ where: { id: req.params.id } }); res.redirect("/users"); }
  catch (err) { res.send("Error: " + err.message); }
};
