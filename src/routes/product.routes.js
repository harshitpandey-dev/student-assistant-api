import { Router } from "express";
import {
  addProduct,
  getAllProducts,
  getUserProduct,
  editProduct,
  deleteProduct,
  getProductById,
  AddProductImage,
  deleteProductImage,
  getUnsoldProducts,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, upload.array("images", 4), addProduct)
  .get(verifyJWT, getAllProducts);

router.route("/product").get(verifyJWT, getUserProduct);

router.route("/unsoldproduct").get(getUnsoldProducts);

router
  .route("/image")
  .post(verifyJWT, upload.array("images", 4), AddProductImage)
  .delete(deleteProductImage);

router
  .route("/:id")
  .put(verifyJWT, editProduct)
  .delete(verifyJWT, deleteProduct)
  .get(verifyJWT, getProductById);

export default router;
