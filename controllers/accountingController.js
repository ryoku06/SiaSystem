import { AccountingEntry } from "../models/AccountingEntry.js";
import { sequelize } from "../models/db.js";
import { Op } from "sequelize";

const base = (req, active) => ({
  userName: req.session.userName, userRole: req.session.userRole,
  userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
  isAccounting: active === "list", isReport: active === "report",
  isAdmin: req.session.userRole === "admin",
  isCashierOrAdmin: ["admin","cashier"].includes(req.session.userRole),
});

export const accountingList = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const entries = await AccountingEntry.findAll({ order: [["createdAt","DESC"]] });
    const creditRes = await AccountingEntry.findAll({ attributes: [[sequelize.fn("SUM", sequelize.col("amount")),"total"]], where: { entryType:"CREDIT" } });
    const debitRes  = await AccountingEntry.findAll({ attributes: [[sequelize.fn("SUM", sequelize.col("amount")),"total"]], where: { entryType:"DEBIT" } });
    const credit = parseFloat(creditRes[0]?.dataValues?.total || 0).toFixed(2);
    const debit  = parseFloat(debitRes[0]?.dataValues?.total  || 0).toFixed(2);
    const netIncome = (parseFloat(credit) - parseFloat(debit)).toFixed(2);
    const rows = entries.map(e => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">#${e.id}</td>
      <td class="p-3">${e.referenceType} #${e.referenceId}</td>
      <td class="p-3">₱${parseFloat(e.amount).toFixed(2)}</td>
      <td class="p-3"><span class="badge ${e.entryType==="CREDIT"?"badge-success":"badge-danger"}">${e.entryType}</span></td>
      <td class="p-3">${e.description}</td>
      <td class="p-3">${e.entryDate}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">No entries yet.</td></tr>`;
    res.render("accounting", { ...base(req,"list"), title:"Accounting", pageTitle:"Accounting", rows, totalCredit:credit, totalDebit:debit, netIncome });
  } catch (err) { res.send("Error: " + err.message); }
};

export const addExpense = async (req, res) => {
  try {
    const { description, amount } = req.body;
    await AccountingEntry.create({ referenceId:0, referenceType:"EXPENSE", amount:parseFloat(amount), entryType:"DEBIT", description, entryDate:new Date().toISOString().split("T")[0] });
    res.redirect("/accounting");
  } catch (err) { res.send("Error: " + err.message); }
};

export const reportPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const { from, to } = req.query;
    const where = {};
    if (from && to) where.entryDate = { [Op.between]: [from, to] };
    const entries = await AccountingEntry.findAll({ where, order: [["entryDate","ASC"]] });
    const totalCredit = entries.filter(e => e.entryType==="CREDIT").reduce((s,e) => s+parseFloat(e.amount),0);
    const totalDebit  = entries.filter(e => e.entryType==="DEBIT" ).reduce((s,e) => s+parseFloat(e.amount),0);
    const netIncome = (totalCredit - totalDebit).toFixed(2);
    const rows = entries.map(e => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">${e.entryDate}</td>
      <td class="p-3">${e.referenceType} #${e.referenceId}</td>
      <td class="p-3">${e.description}</td>
      <td class="p-3 text-green-600 font-medium">${e.entryType==="CREDIT" ? "₱"+parseFloat(e.amount).toFixed(2) : "—"}</td>
      <td class="p-3 text-red-500 font-medium">${e.entryType==="DEBIT"  ? "₱"+parseFloat(e.amount).toFixed(2) : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="5" class="p-4 text-center text-gray-400 text-sm">No entries for this period.</td></tr>`;
    res.render("report", {
      ...base(req,"report"), title:"Financial Report", pageTitle:"Financial Report",
      rows, totalCredit:totalCredit.toFixed(2), totalDebit:totalDebit.toFixed(2), netIncome,
      fromDate: from||"", toDate: to||"",
      dateRange: from&&to ? `(${from} to ${to})` : "(All Time)",
    });
  } catch (err) { res.send("Error: " + err.message); }
};
