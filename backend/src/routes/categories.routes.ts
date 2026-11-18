import { Router } from "express";
import { pool } from "../config/database";
const router = Router();
router.get("/", async (_req,res) => {
  try {
    const result = await pool.query("SELECT id,name,description FROM public.categories ORDER BY name");
    return res.json({ categories: result.rows });
  } catch (error) {
    console.error("Categories error:",error);
    return res.status(500).json({message:"Unable to load categories"});
  }
});
export default router;