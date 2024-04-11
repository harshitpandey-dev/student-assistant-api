import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  // refreshAccessToken,
  changeCurrentPassword,
  requestPasswordReset,
  resetPassword,
  editUser,
  deleteUser,
  getUsers,
  getCurrentUser,
  addDeleteToWishlist,
  getWishlist,
} from "../controllers/user.controller.js";
import { verifyJWT, admin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(registerUser).get(verifyJWT, admin, getUsers);
router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJWT, logoutUser);
// router.route("/refresh-token").post(refreshAccessToken);
router.route("/changepassword").post(verifyJWT, changeCurrentPassword);
router.route("/requestpasswordreset").post(requestPasswordReset);
router.route("/passwordReset").post(resetPassword);
router
  .route("/:id")
  .put(verifyJWT, editUser)
  .delete(verifyJWT, deleteUser)
  .get(verifyJWT, getCurrentUser);

router
  .route("/wishlist")
  .post(verifyJWT, addDeleteToWishlist)
  .get(verifyJWT, getWishlist);

export default router;
