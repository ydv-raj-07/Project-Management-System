import {Router} from "express"
import { login, registerUser, logoutUser, verifyEmail, refreshAccessToken, forgetPasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resendEmailVerification } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {userRegistrationValidator,userLoginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router();

// unsecured
router.route("/register").post(userRegistrationValidator(),validate,registerUser);
router.route("/login").post(userLoginValidator(),validate,login);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-aceess-token").post(refreshAccessToken);
router.route("/forgot-Password").post(userForgotPasswordValidator(),validate,forgetPasswordRequest);
router.route("/reset-forgot-password/:resetToken").post(userResetForgotPasswordValidator,validate,resetForgotPassword);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT,getCurrentUser);
router.route("/change-password").post(verifyJWT,userChangeCurrentPasswordValidator,validate,changeCurrentPassword);
router.route("/resend-email-verification").post(verifyJWT,resendEmailVerification);


export default router;