import { Router } from "express";
import { testDatabaseConnection } from "../controllers/test.controller";

const router = Router();

router.get("/", testDatabaseConnection);

export default router;