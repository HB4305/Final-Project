import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from './models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function updateCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[UPDATE] Connected to MongoDB');

    // Mapping old slugs to new Vietnamese data
    const updates = [
      { oldSlug: 'electronics', newName: 'Điện tử', newSlug: 'dien-tu' },
      { oldSlug: 'fashion', newName: 'Thời trang', newSlug: 'thoi-trang' },
      { oldSlug: 'home-garden', newName: 'Nhà cửa', newSlug: 'nha-cua' },
      { oldSlug: 'sports', newName: 'Thể thao', newSlug: 'the-thao' },
      { oldSlug: 'books', newName: 'Sách & Học tập', newSlug: 'sach-hoc-tap' }
    ];

    for (const update of updates) {
      const cat = await Category.findOne({ slug: update.oldSlug });
      if (cat) {
        console.log(`Updating ${update.oldSlug} -> ${update.newName}`);
        cat.name = update.newName;
        cat.slug = update.newSlug;
        await cat.save();
      } else {
        // If not found by old slug, check if new slug exists to avoid duplicates
        const existingNew = await Category.findOne({ slug: update.newSlug });
        if (!existingNew) {
             console.log(`Creating new category: ${update.newName}`);
             await Category.create({
                 name: update.newName,
                 slug: update.newSlug,
                 parentId: null,
                 level: 1,
                 path: []
             });
        }
      }
    }
    
    // Add new categories: Xe cộ, Bất động sản, Sưu tầm
    const newCategories = [
        { name: 'Xe cộ', slug: 'xe-co', subs: ['Xe máy', 'Ô tô'] },
        { name: 'Bất động sản', slug: 'bat-dong-san', subs: ['Căn hộ', 'Nhà đất'] },
        { name: 'Sưu tầm', slug: 'suu-tam', subs: ['Đồ cổ', 'Tem'] }
    ];

    for (const nc of newCategories) {
        let parent = await Category.findOne({ slug: nc.slug });
        if (!parent) {
            console.log(`Creating ${nc.name}`);
            parent = await Category.create({
                name: nc.name,
                slug: nc.slug,
                level: 1,
                parentId: null,
                path: []
            });
        }

        for (const subName of nc.subs) {
             const subSlug = subName.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9-]/g, "");
             
             const existingSub = await Category.findOne({ slug: subSlug });
             if (!existingSub) {
                 console.log(`Creating sub-category ${subName}`);
                 await Category.create({
                     name: subName,
                     slug: subSlug,
                     level: 2,
                     parentId: parent._id,
                     path: [parent._id]
                 });
             }
        }
    }

    console.log('[UPDATE] Categories updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('[UPDATE] Error:', error);
    process.exit(1);
  }
}

updateCategories();
