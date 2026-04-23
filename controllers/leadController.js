const LeadRequest = require("../models/LeadRequest");
const { generateLeads } = require("../services/leadService");
const XLSX = require("xlsx");

/* ================= CREATE LEADS ================= */
exports.createLeads = async (req, res) => {
  try {
    const { location, businessType, count } = req.body;

    // Basic validation
    if (!location || !businessType || !count) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (count > 50) {
      return res.status(400).json({ message: "Maximum 50 leads allowed per request" });
    }

    // 🔥 Generate leads (your service)
    const rawLeads = await generateLeads(location, businessType, count);

    const formattedLeads = rawLeads.map((lead) => ({
      Name: lead.name || "",
      Phone: lead.phone || "",
      Address: lead.address || ""
    }));

    // 🔥 Save without user
    const saved = await LeadRequest.create({
      location,
      businessType,
      count,
      leads: formattedLeads
    });

    // ✅ Send clean response
    res.json({
      requestId: saved._id,
      totalLeads: formattedLeads.length,
      monthlyUsed: 0,       // dummy
      monthlyLimit: 999999, // unlimited
      leads: formattedLeads
    });

  } catch (error) {
    console.error("CREATE LEADS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


/* ================= DOWNLOAD EXCEL ================= */
exports.downloadExcel = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 Removed userId filter
    const request = await LeadRequest.findById(id).lean();

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!request.leads || request.leads.length === 0) {
      return res.status(400).json({ message: "No leads found" });
    }

    const plainLeads = request.leads.map(lead => ({
      Name: lead.Name,
      Phone: lead.Phone,
      Address: lead.Address
    }));

    const worksheet = XLSX.utils.json_to_sheet(plainLeads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${request.location}-leads.xlsx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};