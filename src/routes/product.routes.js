import { Router } from "express";
import { addProduct } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/add-Product").post(
  upload.fields([
    {
      name: "pImage",
      maxCount: 1,
    },
  ]),
  addProduct
);

export default router;
