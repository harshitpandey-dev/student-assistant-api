import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addProduct = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "title and description is required");
  }

  let productFilePath = req.files?.pImage[0]?.path;

  const productimage = await uploadOnCloudinary(productFilePath);

  if (!productimage) {
    throw new ApiError(400, "product image is required");
  }

  const product = await Product.create({
    title,
    description,
    pImage: productimage.url,
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

export { addProduct };
