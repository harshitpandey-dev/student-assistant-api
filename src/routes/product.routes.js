import { Router } from "express";
import {
  addProduct,
  getAllProducts,
  getUserProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add-Product").post(
  verifyJWT,
  upload.fields([
    {
      name: "pImage",
      maxCount: 1,
    },
  ]),
  addProduct
);

router.route("/getAllProduct").get(verifyJWT, getAllProducts);

router.route("/getUserProduct").get(verifyJWT, getUserProduct);

export default router;
