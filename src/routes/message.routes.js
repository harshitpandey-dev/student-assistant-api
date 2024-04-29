import { Router } from "express";
import {
  getAllMessages,
  sendMessage,
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { sendMessageValidator } from "../validators/message.validators.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";
import { validate } from "../validators/validate.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getAllMessages)
  .post(
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    mongoIdPathVariableValidator("chatId"),
    sendMessage
  );

export default router;
