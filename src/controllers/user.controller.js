import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/email/sendEmail.js";
import { Product } from "../models/product.model.js";
import { deleteUserProduct } from "./product.controller.js";
import { deleteUserChat } from "./chat.controller.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.token = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, contact, password } = req.body;
  console.log("email: ", email);

  if (
    email === "" ||
    fullname === "" ||
    username === "" ||
    password === "" ||
    contact == ""
  ) {
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
    contact,
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

  if (user.refreshToken) {
    throw new ApiError(400, "Already logged In");
  }

  await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
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
        token: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged Out successfully"));
});

// const refreshAccessToken = asyncHandler(async (req, res) => {
//   const incomingRefreshToken =
//     req.cookies.refreshToken || req.body.refreshToken;

//   if (!incomingRefreshToken) {
//     throw new ApiError(401, "unauthorized request");
//   }

//   try {
//     const decodedToken = jwt.verify(
//       incomingRefreshToken,
//       process.env.REFRESH_TOKEN_SECRET
//     );

//     const user = await User.findById(decodedToken?._id);

//     if (!user) {
//       throw new ApiError(401, "Invalid refresh token");
//     }

//     if (incomingRefreshToken !== user?.refreshToken) {
//       throw new ApiError(401, "Refresh token is expired or used");
//     }

//     const options = {
//       httpOnly: true,
//       secure: true,
//     };

//     const { accessToken: nAccessToken, refreshToken: nRefreshToken } =
//       await generateAccessAndRefreshToken(user._id);

//     return res
//       .status(200)
//       .cookie("accessToken", nAccessToken, options)
//       .cookie("refreshToken", nRefreshToken, options)
//       .json(
//         new ApiResponse(
//           200,
//           { accessToken: nAccessToken, refreshToken: nRefreshToken },
//           "Access token refreshed"
//         )
//       );
//   } catch (error) {
//     throw new ApiError(401, error?.message || "Invalid refresh token");
//   }
// });

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

  const link = `https://studentassistant.vercel.app/passwordReset?token=${resetToken}&email=${email}`;

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
  const { email, token, password } = req.body;

  console.log(password);

  const newuser = await User.findOne({ email });
  let passwordResetToken = newuser.resetToken;

  if (!passwordResetToken) {
    return res.status(401).json(new ApiResponse(400, {}, "Session expired"));
  }

  const isValid = token === passwordResetToken;

  if (!isValid) {
    return res.status(401).json(new ApiResponse(400, {}, "Session not Valid "));
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

const editUser = asyncHandler(async (req, res) => {
  try {
    const { username, fullname, contact } = req.body;

    if (!username && !fullname) {
      throw new ApiError(400, "username or fullname is required");
    }
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { username: username, fullname: fullname, contact: contact } },
      { new: true }
    );

    const updatedUser = await User.findById(req.params.id);

    return res
      .status(201)
      .json(new ApiResponse(200, { updatedUser }, "user updated successfully"));
  } catch (error) {
    console.log("error in editUser", error);
    return new ApiError(500, "Internal server error in editUser");
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  deleteUserProduct(id);
  deleteUserChat(id);
  await User.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Account Deleted Successfully"));
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res
    .status(200)
    .json(new ApiResponse(200, users, "User Fetched Successfully"));
});

const addDeleteToWishlist = asyncHandler(async (req, res) => {
  const { productid } = req.body;
  const userid = req.user._id;

  const product = await Product.findById(productid);

  if (!product) {
    throw new ApiError(400, "Product not found");
  }

  const user = await User.findById(userid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const alreadyAdded = user.wishlist.some(
    (id) => id.toString() === productid.toString()
  );

  if (alreadyAdded) {
    const updatedUser = await User.findByIdAndUpdate(
      userid,
      { $pull: { wishlist: productid } },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Product removed from wishlist"));
  } else {
    const updatedUser = await User.findByIdAndUpdate(
      userid,
      { $addToSet: { wishlist: productid } },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Product added to wishlist"));
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, null, "User not found");
  }

  const productIds = user.wishlist;

  if (productIds.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Wishlist Products Fetched"));
  }

  const productPromises = productIds.map(async (id) => {
    try {
      const product = await Product.findById(id);
      return product;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      return null;
    }
  });

  const products = await Promise.all(productPromises);

  const validProducts = products.filter((product) => product !== null);

  return res
    .status(200)
    .json(new ApiResponse(200, validProducts, "Wishlist Products Fetched"));
});

const addEditProfileImage = asyncHandler(async (req, res) => {
  const file = req.file;
  const userProfileImage = await uploadOnCloudinary(file.path);

  const user = await User.findById(req.user._id);

  if (user) {
    user.profile = userProfileImage.url;
  } else {
    throw new ApiError(404, "User not found.");
  }

  const updatedUser = await user.save();

  if (!updatedUser) {
    throw new ApiError(400, "Error in updating profile image pls retry");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "User profile image added successfully")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  // refreshAccessToken,
  getWishlist,
  addDeleteToWishlist,
  changeCurrentPassword,
  getCurrentUser,
  resetPassword,
  requestPasswordReset,
  editUser,
  deleteUser,
  getUsers,
  addEditProfileImage,
};
