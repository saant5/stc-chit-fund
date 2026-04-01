const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const {
  getMyInstallments,
  payInstallment,
  getPaymentHistory,
  adminRecordPayment,
  getDefaulters,
} = require("../controllers/paymentController");

router.get("/my-installments",  auth,        getMyInstallments);
router.post("/pay",             auth,        payInstallment);
router.get("/history",          auth,        getPaymentHistory);
router.post("/admin/record",    auth, admin, adminRecordPayment);
router.get("/admin/defaulters", auth, admin, getDefaulters);

module.exports = router;