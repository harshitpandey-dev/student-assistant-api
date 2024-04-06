import { Router } from "express";
import {
  addProduct,
  getAllProducts,
  getUserProduct,
  editProduct,
  deleteProduct,
  getProductById,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, upload.array("images", 4), addProduct)
  .get(getAllProducts);

router.route("/product").get(verifyJWT, getUserProduct);

router
  .route("/:id")
  .put(verifyJWT, editProduct)
  .delete(verifyJWT, deleteProduct)
  .get(verifyJWT, getProductById);

export default router;
