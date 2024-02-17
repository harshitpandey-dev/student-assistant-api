import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addProduct = asyncHandler(async (req, res) => {
  const { title, description, price } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "title and description is required");
  }

  if (!price) {
    throw new ApiError(400, "price is required");
  }

  let productFilePath = req.files?.pImage?.[0]?.path;

  const productimage = await uploadOnCloudinary(productFilePath);

  if (!productimage) {
    throw new ApiError(400, "product image is required");
  }

  const product = await Product.create({
    title,
    description,
    pImage: productimage.url,
    price,
    owner: req.user._id,
  });

  const createdProduct = await Product.findById(product._id).select(
    "-description"
  );

  if (!createdProduct) {
    throw new ApiError(400, "something went wrong while adding product");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdProduct, "product Added Successfully"));
});

const getUserProduct = asyncHandler(async (req, res) => {
  try {
    const userProducts = await Product.find({ owner: req.user._id }).populate(
      "owner",
      "username"
    );

    if (userProducts === "") {
      throw new ApiError(400, `No product is listed by ${req.user.fullname} `);
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { userProducts },
          `Products listed by ${req.user.fullname} fetched successfully`
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Internal Server Error while fetching user product"
    );
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({ isPublished: true }).populate(
      "owner",
      "username"
    );

    if (products === "") {
      throw new ApiError(400, "No product exits");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, { products }, "product fetched successfully"));
  } catch (error) {
    console.error(error);
    return ApiError(400, "Error while fetching products");
  }
});

export { addProduct, getAllProducts, getUserProduct };
