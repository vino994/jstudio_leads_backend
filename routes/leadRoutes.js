const router = require("express").Router();
const { createLeads, downloadExcel } = require("../controllers/leadController");

// ✅ No auth
router.post("/generate", createLeads);
router.get("/download/excel/:id", downloadExcel);

module.exports = router;