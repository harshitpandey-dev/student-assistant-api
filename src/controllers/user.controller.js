import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/email/sendEmail.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);
  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);

  if (email === "" || fullname === "" || username === "" || password === "") {
    throw new ApiError(400, "required field is not filled");
  }

  const existedUser = await User.findOne({
    $or: [{ email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const user = await User.create({
    fullname,
    email,
    username,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "user not registered, register yourself!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
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
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken: nAccessToken, refreshToken: nRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", nAccessToken, options)
      .cookie("refreshToken", nRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: nAccessToken, refreshToken: nRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "Email does not exist");

  const resetToken = await user.generateResetToken();

  if (!resetToken) {
    throw new ApiError(500, "Internal Error while generating Reset Token");
  }

  user.resetToken = resetToken;
  await user.save();

  const link = `localhost:8000/api/v1/users/passwordReset?token=${resetToken}&email=${email}`;

  const result = await sendEmail(
    user.email,
    "Password Reset Request",
    {
      name: user.fullname,
      link: link,
    },
    "./template/requestResetPassword.handlebars"
  );

  if (!result.success) {
    console.log("Email sending failed:", result.error);
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { link },
        "Password change request send successfully"
      )
    );
};

const resetPassword = async (req, res) => {
  //const {Id, token, password} = req.body
  //send data as params not as request body
  const { email, token, password } = req.query;

  const newuser = await User.findOne({ email });
  let passwordResetToken = newuser.resetToken;

  if (!passwordResetToken) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  const isValid = token === passwordResetToken;

  if (!isValid) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  //updating password in database
  newuser.password = password;
  await newuser.save({ validateBeforeSave: false });

  const user = await User.findById({ _id: newuser._id });

  await sendEmail(
    newuser.email,
    "Password Reset Successfully",
    {
      name: newuser.name,
    },
    "./template/resetPassword.handlebars"
  );

  user.resetToken = undefined;
  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(200, user, "passwordResetSuccessfully"));
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  resetPassword,
  requestPasswordReset,
};
