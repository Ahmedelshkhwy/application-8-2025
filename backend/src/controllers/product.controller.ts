import { Request, Response } from 'express';
import Product from '../models/product.model';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, isActive, limit } = req.query;
    let filter: any = {};

    // فلترة حسب الفئة
    if (category) {
      filter.category = category;
    }

    // فلترة حسب البحث
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // فلترة حسب الحالة النشطة
    if (isActive === 'true') {
      filter.isActive = true;
    }

    console.log('🔍 Product Filter:', filter); // للتحقق من الفلتر

    let query = Product.find(filter);

    // تحديد عدد النتائج
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    const products = await query;
    console.log('✅ Products found:', products.length); // للتحقق من النتائج
    res.json(products);
  } catch (error) {
    console.error('❌ Error in getAllProducts:', error); // تفاصيل الخطأ
    res.status(500).json({ 
      message: 'حدث خطأ أثناء جلب المنتجات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المنتج' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params['productId']);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتج' });
  }
};