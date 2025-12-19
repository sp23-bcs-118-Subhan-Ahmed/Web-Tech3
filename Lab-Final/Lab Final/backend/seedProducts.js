import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
  {
    name: 'Professional Dental Kit',
    description: 'Complete dental care kit with premium toothbrush, dental floss, and antibacterial mouthwash. Perfect for maintaining oral hygiene.',
    price: 29.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767815.png',
    category: 'Dental Products',
    stock: 50,
    featured: true,
    isActive: true
  },
  {
    name: 'Electric Toothbrush Pro',
    description: 'Advanced sonic electric toothbrush with 3 cleaning modes, 2-minute timer, and long-lasting battery life.',
    price: 79.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2913/2913465.png',
    category: 'Oral Care',
    stock: 30,
    featured: true,
    isActive: true
  },
  {
    name: 'Teeth Whitening Kit',
    description: 'Professional grade teeth whitening strips for a brighter, whiter smile. Safe and effective results in 7 days.',
    price: 34.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767807.png',
    category: 'Whitening',
    stock: 100,
    featured: true,
    isActive: true
  },
  {
    name: 'Premium Dental Floss Pack',
    description: 'Mint flavored waxed dental floss - 3 pack. Glides easily between teeth for effective plaque removal.',
    price: 12.99,
    image: 'https://cdn-icons-png.flaticon.com/512/3588/3588614.png',
    category: 'Oral Care',
    stock: 200,
    featured: false,
    isActive: true
  },
  {
    name: 'Orthodontic Wax',
    description: 'Relief wax for braces and dental appliances. Provides comfort and protection against irritation.',
    price: 8.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767812.png',
    category: 'Accessories',
    stock: 150,
    featured: false,
    isActive: true
  },
  {
    name: 'Antibacterial Mouthwash',
    description: 'Premium antibacterial mouthwash for fresh breath and complete oral protection. Kills 99.9% of germs.',
    price: 14.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2553/2553627.png',
    category: 'Oral Care',
    stock: 80,
    featured: true,
    isActive: true
  },
  {
    name: 'Kids Dental Care Set',
    description: 'Fun and colorful dental care set designed for children. Includes soft toothbrush and fruity toothpaste.',
    price: 15.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767795.png',
    category: 'Dental Products',
    stock: 75,
    featured: false,
    isActive: true
  },
  {
    name: 'Tongue Scraper Set',
    description: 'Stainless steel tongue scraper set for fresh breath and improved oral hygiene. Pack of 2.',
    price: 9.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767802.png',
    category: 'Accessories',
    stock: 120,
    featured: false,
    isActive: true
  },
  {
    name: 'Professional Whitening Gel',
    description: 'Advanced carbamide peroxide whitening gel for professional-grade results at home.',
    price: 45.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767818.png',
    category: 'Whitening',
    stock: 60,
    featured: false,
    isActive: true
  },
  {
    name: 'Dental Mirror Set',
    description: 'Professional dental mirror set for self-examination. Includes LED light for better visibility.',
    price: 19.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767822.png',
    category: 'Accessories',
    stock: 40,
    featured: false,
    isActive: true
  },
  {
    name: 'Charcoal Toothpaste',
    description: 'Activated charcoal toothpaste for natural whitening and detoxification. Fresh mint flavor.',
    price: 11.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767831.png',
    category: 'Oral Care',
    stock: 90,
    featured: false,
    isActive: true
  },
  {
    name: 'Water Flosser Pro',
    description: 'Cordless water flosser with 4 pressure settings and 360° rotating nozzle for complete cleaning.',
    price: 59.99,
    image: 'https://cdn-icons-png.flaticon.com/512/2767/2767835.png',
    category: 'Dental Products',
    stock: 25,
    featured: false,
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const result = await Product.insertMany(sampleProducts);
    console.log(`Successfully added ${result.length} products`);

    // Display added products
    result.forEach(product => {
      console.log(`  - ${product.name} ($${product.price})`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

