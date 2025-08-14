// backend/models/product.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  category: string; // تغيير من ObjectId إلى string
  brand?: string; // إضافة العلامة التجارية
  image?: string;
  stock: number;
  isActive?: boolean;
  isFeatured?: boolean; // إضافة المنتجات المميزة
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // تغيير من ObjectId إلى String
    brand: { type: String, trim: true }, // العلامة التجارية
    image: { type: String },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }, // المنتجات المميزة
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProduct>('Product', ProductSchema);

