import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailgenContent, ForgotPasswordMailgenContent, sendEmail } from "../utils/mail.js";
import Mailgen from "mailgen";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "Username already exist", [])
  }

  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false
  })

  const { unHashedToken, HashedToken, TokenExpiry } = user.generateTemporaryToken();

  user.emailVerificationToken = HashedToken
  user.emailVerificationExpiry = TokenExpiry

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `{$req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
    )
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering a user")
  }
  return res
    .status(201)
    .json(
      new ApiResponse(200,
        { user: createdUser },
        "user registered successfully and verification email has been send on your email"
      )
    )
})

const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!email) {
    throw new ApiError(400, " email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: ""
      }
    },
    {
      new: true
    }
  );
  const options = {
    httpOnly: true,
    secure: true
  }
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "user logged out")
    )
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200,
        req.user,
        "current user fetched successfully"
      )
    )
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params
  if (!verificationToken) {
    throw new ApiError(400, "email verification token is missing")
  }

  let HashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")

  const user = await User.findOne({
    emailVerificationToken: HashedToken,
    emailVerificationExpiry: { $gt: Date.now() }
  })

  if (!user) {
    throw new ApiError(200, "Token is invalid or expired");
  }

  user.emailVerificationToken = undefined
  user.emailVerificationExpiry = undefined

  user.isEmailVerified = true
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          isEmailVerified: true,
        },
        "email is verified"
      )
    )

});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "user does not exist")
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, "user is already verified")
  }

  const { unHashedToken, HashedToken, TokenExpiry } = user.generateTemporaryToken();

  user.emailVerificationToken = HashedToken;
  user.emailVerificationExpiry = TokenExpiry;

  await user.save({ validateBeforeSave: false })

  await sendEmail({
    email: user?.email,
    subject: "please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `{req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "email has been send to your email id"
      )
    )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!refreshAccessToken) {
    throw new ApiError(401, "Unauthorized access")
  }

  try {
    const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save()

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200,
          {
            accessToken, refreshToken: newRefreshToken
          },
          "Access token refreshed"
        )
      )

  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

});

const forgetPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "User does not exist")
  }

  const { unHashedToken, HashedToken, TokenExpiry } = user.generateTemporaryToken();

  user.forgotPasswordToken = HashedToken
  user.forgotPasswordExpiry = TokenExpiry

  await user.save({ validateBeforeSave: false })

  await sendEmail({
    email: user?.email,
    subject: "Password Reset request",
    mailgenContent: ForgotPasswordMailgenContentMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "password reset message has been send on your email id")
    )

});

const resetForgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params
  const { newPassword } = req.body

  let HashedToken = crypto
    .createHash("256sho")
    .update(resetToken)
    .digest("hex")

  const user = await User.findOne({
    forgotPasswordToken: HashedToken,
    forgotPasswordExpiry: { $gt: Date.now() }
  })

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.forgotPasswordExpiry = undefined
  user.forgotPasswordExpiry = undefined
  user.password = newPassword

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(200,
        {},
        "password data reset successfully"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await isPasswordCorrect(oldPassword)

  if (!isPasswordValid) {
    throw new ApiError(400, "invalid old password")
  }

  user.password = newPassword

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(200,
        {},
        "password changed successfully"
      ));
});



export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgetPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword
};