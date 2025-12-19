import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
  name: String,
  description: String,
  slug: String,
  image: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;

