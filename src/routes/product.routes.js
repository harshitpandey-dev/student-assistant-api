import { Router } from "express";
import {
  addProduct,
  getAllProducts,
  getUserProduct,
  editProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, upload.array("images", 4), addProduct)
  .get(getAllProducts);

router.route("/:id").put(verifyJWT, editProduct).get(verifyJWT, getUserProduct);

export default router;
