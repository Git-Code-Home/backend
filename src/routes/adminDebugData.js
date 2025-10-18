import express from "express";

const router = express.Router();

/**
 * Debug route: GET /admin/public/data
 * Temporary: helps verify frontend -> backend connectivity and logs headers.
 * Remove or secure after debugging.
 */
router.get("/admin/public/data", (req, res) => {
  console.log("[server debug] GET /admin/public/data - headers:", {
    origin: req.headers.origin || null,
    authorization: req.headers.authorization || null,
  });

  res.json({
    clients: [{ id: "c1", name: "ACME Corp" }],
    applications: [
      {
        _id: "app1",
        client: { name: "ACME Corp" },
        type: "tourist",
        status: "Processing",
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

export default router;