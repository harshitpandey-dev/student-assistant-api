import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
  {
    images: [
      {
        type: String,
        required: true,
      },
    ],
    keywords: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Explain details of the product"],
    },
    cost: {
      price: {
        type: Number,
        required: true,
        default: 0,
      },
      negotiable: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    sold: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
