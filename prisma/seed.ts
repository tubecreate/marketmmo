import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑  Clearing old data...');
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.chatLog.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash('123456', 10);

  // ─── USERS ────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');

  const admin = await prisma.user.create({ data: {
    username: 'admin', email: 'admin@marketmmo.com', passwordHash: pw,
    role: 'ADMIN', fullName: 'Admin MarketMMO', balance: 0, isActive: true,
  }});

  const [seller1, seller2, seller3, seller4] = await Promise.all([
    prisma.user.create({ data: {
      username: 'lenhattuan', email: 'lenhattuan@gmail.com', passwordHash: pw,
      role: 'SELLER', fullName: 'Lê Nhật Tuấn', balance: 450000,
      isActive: true, totalRevenue: 12500000, level: 2,
    }}),
    prisma.user.create({ data: {
      username: 'truongphuchl', email: 'truongphuc@gmail.com', passwordHash: pw,
      role: 'SELLER', fullName: 'Trường Phúc', balance: 320000,
      isActive: true, totalRevenue: 7800000, level: 1,
    }}),
    prisma.user.create({ data: {
      username: '1trieumail', email: '1trieumail@gmail.com', passwordHash: pw,
      role: 'SELLER', fullName: 'Một Triệu Mail', balance: 900000,
      isActive: true, totalRevenue: 55000000, level: 3,
    }}),
    prisma.user.create({ data: {
      username: 'bearmedia', email: 'bearmedia@gmail.com', passwordHash: pw,
      role: 'SELLER', fullName: 'Bear Media', balance: 220000,
      isActive: true, totalRevenue: 3200000, level: 1,
    }}),
  ]);

  const [buyer1, buyer2, buyer3, buyer4, buyer5] = await Promise.all([
    prisma.user.create({ data: {
      username: 'nguyenvan', email: 'nguyenvan@gmail.com', passwordHash: pw,
      role: 'BUYER', fullName: 'Nguyễn Văn A', balance: 250000, isActive: true,
    }}),
    prisma.user.create({ data: {
      username: 'tranthib', email: 'tranthib@gmail.com', passwordHash: pw,
      role: 'BUYER', fullName: 'Trần Thị B', balance: 80000, isActive: true,
    }}),
    prisma.user.create({ data: {
      username: 'hoangc', email: 'hoangc@gmail.com', passwordHash: pw,
      role: 'BUYER', fullName: 'Hoàng C', balance: 500000, isActive: true,
    }}),
    prisma.user.create({ data: {
      username: 'phamd', email: 'phamd@gmail.com', passwordHash: pw,
      role: 'BUYER', fullName: 'Phạm D', balance: 150000, isActive: true,
    }}),
    prisma.user.create({ data: {
      username: 'voe', email: 'voe@gmail.com', passwordHash: pw,
      role: 'BUYER', fullName: 'Võ E', balance: 20000, isActive: true,
    }}),
  ]);

  // ─── CATEGORIES ───────────────────────────────────────────────────────────
  console.log('📂 Creating categories...');

  const [catSanPham, catDichVu] = await Promise.all([
    prisma.category.create({ data: { name: 'Sản phẩm số', slug: 'san-pham-so' }}),
    prisma.category.create({ data: { name: 'Dịch vụ', slug: 'dich-vu' }}),
  ]);

  const [catFB, catGmail, catTikTok, catZalo, catKey, catCapCut] = await Promise.all([
    prisma.category.create({ data: { name: 'Tài khoản Facebook', slug: 'tai-khoan-fb', parentId: catSanPham.id }}),
    prisma.category.create({ data: { name: 'Gmail', slug: 'gmail', parentId: catSanPham.id }}),
    prisma.category.create({ data: { name: 'Tài khoản TikTok', slug: 'tai-khoan-tiktok', parentId: catSanPham.id }}),
    prisma.category.create({ data: { name: 'Tài khoản Zalo', slug: 'tai-khoan-zalo', parentId: catSanPham.id }}),
    prisma.category.create({ data: { name: 'Key phần mềm', slug: 'key-phan-mem', parentId: catSanPham.id }}),
    prisma.category.create({ data: { name: 'Tài khoản CapCut', slug: 'tai-khoan-capcut', parentId: catSanPham.id }}),
  ]);

  const [catMarketing, catTuongTac, catDesign] = await Promise.all([
    prisma.category.create({ data: { name: 'Marketing', slug: 'marketing', parentId: catDichVu.id }}),
    prisma.category.create({ data: { name: 'Tăng tương tác', slug: 'tang-tuong-tac', parentId: catDichVu.id }}),
    prisma.category.create({ data: { name: 'Thiết kế', slug: 'thiet-ke', parentId: catDichVu.id }}),
  ]);

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  console.log('📦 Creating products...');

  const products = await Promise.all([
    // Facebook
    prisma.product.create({ data: {
      sellerId: seller1.id, categoryId: catFB.id,
      title: 'Facebook có 1000-5000 bạn bè và có nhiều bài đăng 2023-2025',
      slug: 'facebook-1000-5000-ban', description: 'Nick FB người dùng thật, nhiều bạn bè, full backup. Bảo hành 24h đổi nick.',
      type: 'DIGITAL', price: 40000, priceMax: 280000, status: 'ACTIVE',
      isSponsored: true, isFeatured: true, viewCount: 4440, soldCount: 4460, rating: 4.8,
    }}),
    prisma.product.create({ data: {
      sellerId: seller3.id, categoryId: catFB.id,
      title: 'Clone FB - VIA Việt 200x - 2026 | 2FA - VER HOTMAIL | Chất lượng cao',
      slug: 'clone-fb-via-viet-200x', description: 'Clone FB chất lượng cao, verify bằng hotmail, bảo hành 7 ngày.',
      type: 'DIGITAL', price: 2300, priceMax: 16500, status: 'ACTIVE',
      isSponsored: true, viewCount: 12767, soldCount: 22, rating: 4.3,
    }}),
    // Gmail
    prisma.product.create({ data: {
      sellerId: seller2.id, categoryId: catGmail.id,
      title: 'Gmail tháng 8 2025 có 2FA+MKP hạn chế thư',
      slug: 'gmail-2025-2fa', description: 'Gmail cổ, full 2FA+MKP. Bao đăng nhập và đổi pass.',
      type: 'DIGITAL', price: 11999, status: 'ACTIVE',
      isSponsored: true, isFeatured: true, viewCount: 1770, soldCount: 2120, rating: 4.9,
    }}),
    prisma.product.create({ data: {
      sellerId: seller3.id, categoryId: catGmail.id,
      title: 'Tài khoản Gmail Cổ-New-Gmail domain | Cho thuê gmail edu chỉ từ 58đ',
      slug: 'gmail-co-new-domain', description: 'Gmail đa dạng từ gmail cổ đến gmail edu. Cho thuê giá rẻ.',
      type: 'DIGITAL', price: 58, priceMax: 27000, status: 'ACTIVE',
      isSponsored: true, viewCount: 64879, soldCount: 10499, rating: 4.7,
    }}),
    prisma.product.create({ data: {
      sellerId: seller3.id, categoryId: catGmail.id,
      title: 'Gmail Edu cho thuê giá rẻ 24H',
      slug: 'gmail-edu-thue-24h', description: 'Gmail Edu chính hãng, bảo hành 24h.',
      type: 'DIGITAL', price: 49, priceMax: 999, status: 'ACTIVE',
      viewCount: 1909, soldCount: 65664, rating: 4.6,
    }}),
    // TikTok
    prisma.product.create({ data: {
      sellerId: seller2.id, categoryId: catTikTok.id,
      title: 'Tài khoản TikTok cổ 2017-2022, nhiều follower',
      slug: 'tiktok-co-2017-2022', description: 'TikTok cổ từ 2017-2022, có follower thật, không bị limit.',
      type: 'DIGITAL', price: 15000, priceMax: 300000, status: 'ACTIVE',
      isSponsored: true, viewCount: 2340, soldCount: 187, rating: 4.5,
    }}),
    // Zalo
    prisma.product.create({ data: {
      sellerId: seller1.id, categoryId: catZalo.id,
      title: 'Tài khoản Zalo đăng ký SIM thật, full phone',
      slug: 'zalo-sim-that-full-phone', description: 'Zalo đăng ký bằng SIM thật, đủ thông tin, không ảo.',
      type: 'DIGITAL', price: 8000, priceMax: 25000, status: 'ACTIVE',
      viewCount: 3200, soldCount: 456, rating: 4.4,
    }}),
    // CapCut
    prisma.product.create({ data: {
      sellerId: seller4.id, categoryId: catCapCut.id,
      title: 'Tài khoản CapCut Pro cấp sẵn',
      slug: 'capcut-pro-cap-san', description: 'CapCut Pro bản quyền, full tính năng premium. Cấp nhanh 5 phút.',
      type: 'DIGITAL', price: 1000, priceMax: 280000, status: 'ACTIVE',
      isSponsored: true, viewCount: 3740, soldCount: 442, rating: 4.6,
    }}),
    // Key Software
    prisma.product.create({ data: {
      sellerId: seller1.id, categoryId: catKey.id,
      title: 'Key Windows 11 Pro OEM - Kích hoạt vĩnh viễn',
      slug: 'key-windows-11-pro-oem', description: 'Key Windows 11 Pro bản quyền, kích hoạt vĩnh viễn, không lo mất bản quyền.',
      type: 'DIGITAL', price: 50000, priceMax: 120000, status: 'ACTIVE',
      isFeatured: true, viewCount: 8900, soldCount: 1230, rating: 4.9,
    }}),
    prisma.product.create({ data: {
      sellerId: seller2.id, categoryId: catKey.id,
      title: 'Key Office 365 Business Premium - 1 năm',
      slug: 'key-office-365-1nam', description: 'Office 365 Business Premium kích hoạt 1 năm, dùng được 5 thiết bị.',
      type: 'DIGITAL', price: 120000, priceMax: 500000, status: 'ACTIVE',
      viewCount: 5600, soldCount: 890, rating: 4.8,
    }}),
    // Services
    prisma.product.create({ data: {
      sellerId: seller1.id, categoryId: catTuongTac.id,
      title: 'Tăng tương tác TikTok siêu nhanh - Hỗ trợ 24/7',
      slug: 'tang-tuong-tac-tiktok', description: 'Buff like, share, comment TikTok. Tốc độ nhanh, bảo hành 30 ngày.',
      type: 'SERVICE', price: 1000, priceMax: 6666, status: 'ACTIVE',
      isSponsored: true, viewCount: 1200, soldCount: 77, rating: 4.5,
    }}),
    prisma.product.create({ data: {
      sellerId: seller4.id, categoryId: catMarketing.id,
      title: 'Chạy ADS Facebook, Google, Tiktok... - Tư vấn miễn phí',
      slug: 'chay-ads-fb-google', description: 'Dịch vụ chạy quảng cáo đa nền tảng. Cam kết hiệu quả.',
      type: 'SERVICE', price: 1, priceMax: 100, status: 'ACTIVE',
      isSponsored: true, viewCount: 450, soldCount: 125, rating: 4.8,
    }}),
    prisma.product.create({ data: {
      sellerId: seller2.id, categoryId: catDesign.id,
      title: 'Thiết kế logo chuyên nghiệp - Giao hàng 24h',
      slug: 'thiet-ke-logo-chuyen-nghiep', description: 'Nhận thiết kế logo chuẩn theo yêu cầu. File gốc AI/PSD.',
      type: 'SERVICE', price: 50000, priceMax: 500000, status: 'ACTIVE',
      viewCount: 780, soldCount: 43, rating: 4.7,
    }}),
    prisma.product.create({ data: {
      sellerId: seller3.id, categoryId: catFB.id,
      title: 'Tài khoản Twitter cổ từ 2006-2022',
      slug: 'twitter-co-2006-2022', description: 'Twitter cổ, xác thực email, không bị suspended.',
      type: 'DIGITAL', price: 11000, priceMax: 30000, status: 'ACTIVE',
      viewCount: 4140, soldCount: 1, rating: 4.5,
    }}),
  ]);

  // ─── PRODUCT ITEMS (digital stock) ────────────────────────────────────────
  console.log('🗃  Adding product items...');
  // Thêm một vài items cho sản phẩm đầu tiên
  await prisma.productItem.createMany({ data: [
    { productId: products[0].id, content: 'acc:pass:email@gmail.com:emailpass' },
    { productId: products[0].id, content: 'fbuser2:securepass2:alt@mail.com:altpass' },
    { productId: products[2].id, content: 'gmail123@gmail.com:pass123' },
    { productId: products[8].id, content: 'XXXXX-XXXXX-YYYYY-ZZZZZ-AAAAA' },
    { productId: products[9].id, content: 'O365KEYXXX-YYYY-ZZZZ-AAAA' },
  ]});

  // ─── ORDERS ───────────────────────────────────────────────────────────────
  console.log('🛒 Creating orders...');
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() - days * 86400000);

  const orders = await Promise.all([
    prisma.order.create({ data: {
      buyerId: buyer1.id, sellerId: seller1.id, productId: products[0].id,
      amount: 40000, fee: 2000, status: 'COMPLETED',
      deliveredContent: 'fbuser:pass123:fb@gmail.com:fbmkp',
      warrantyExpire: d(-1), createdAt: d(5),
    }}),
    prisma.order.create({ data: {
      buyerId: buyer1.id, sellerId: seller2.id, productId: products[2].id,
      amount: 11999, fee: 600, status: 'HOLDING',
      deliveredContent: 'user@gmail.com:pass123',
      warrantyExpire: d(-3), createdAt: d(1),
    }}),
    prisma.order.create({ data: {
      buyerId: buyer2.id, sellerId: seller3.id, productId: products[3].id,
      amount: 58, fee: 3, status: 'COMPLETED',
      deliveredContent: 'gmail@old.com:pass',
      warrantyExpire: d(-5), createdAt: d(8),
    }}),
    prisma.order.create({ data: {
      buyerId: buyer3.id, sellerId: seller1.id, productId: products[8].id,
      amount: 50000, fee: 2500, status: 'COMPLETED',
      deliveredContent: 'WIN11-XXXXX-YYYYY-ZZZZZ-AAAAA',
      warrantyExpire: d(-10), createdAt: d(15),
    }}),
    prisma.order.create({ data: {
      buyerId: buyer1.id, sellerId: seller4.id, productId: products[7].id,
      amount: 1000, fee: 50, status: 'DISPUTED',
      deliveredContent: 'capcut@pro.com:pass',
      warrantyExpire: d(-2), createdAt: d(3),
    }}),
    prisma.order.create({ data: {
      buyerId: buyer4.id, sellerId: seller2.id, productId: products[1].id,
      amount: 2300, fee: 115, status: 'HOLDING',
      deliveredContent: 'clone:pass',
      warrantyExpire: d(-1), createdAt: d(0),
    }}),
  ]);

  // ─── REVIEWS ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.review.create({ data: {
      orderId: orders[0].id, productId: products[0].id, rating: 5,
      comment: 'Nick FB chất lượng tốt, đăng nhập ngay không cần verify thêm. Sẽ mua lại!',
    }}),
    prisma.review.create({ data: {
      orderId: orders[2].id, productId: products[3].id, rating: 4,
      comment: 'Gmail cổ ok, giá hợp lý. Giao nhanh.',
    }}),
    prisma.review.create({ data: {
      orderId: orders[3].id, productId: products[8].id, rating: 5,
      comment: 'Key Windows xịn, kích hoạt ngay lập tức. Uy tín!',
    }}),
  ]);

  // ─── TRANSACTIONS ─────────────────────────────────────────────────────────
  console.log('💳 Creating transactions...');
  await prisma.transaction.createMany({ data: [
    { userId: buyer1.id, amount: 100000, type: 'DEPOSIT', status: 'SUCCESS', description: 'Nạp tiền qua SePay', createdAt: d(10) },
    { userId: buyer1.id, amount: 40000, type: 'PURCHASE', status: 'SUCCESS', description: `Mua: ${products[0].title.slice(0,30)}`, createdAt: d(5) },
    { userId: buyer1.id, amount: 11999, type: 'PURCHASE', status: 'SUCCESS', description: `Mua: ${products[2].title.slice(0,30)}`, createdAt: d(1) },
    { userId: buyer1.id, amount: 200000, type: 'DEPOSIT', status: 'SUCCESS', description: 'Nạp tiền qua SePay', createdAt: d(20) },
    { userId: buyer3.id, amount: 500000, type: 'DEPOSIT', status: 'SUCCESS', description: 'Nạp tiền qua SePay', createdAt: d(30) },
    { userId: buyer3.id, amount: 50000, type: 'PURCHASE', status: 'SUCCESS', description: `Mua: ${products[8].title.slice(0,30)}`, createdAt: d(15) },
  ]});

  // ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────
  await Promise.all([
    prisma.announcement.create({ data: { message: '🔒 Sàn bảo vệ người mua với cơ chế Escrow – Tiền tạm giữ 03 ngày bảo hành', isActive: true, order: 1 }}),
    prisma.announcement.create({ data: { message: '🚀 Đăng ký bán hàng miễn phí – Tiếp cận hàng ngàn khách hàng ngay hôm nay!', isActive: true, order: 2 }}),
    prisma.announcement.create({ data: { message: '⚡ Nạp tiền tự động qua SePay – Cộng số dư trong vòng 30 giây', isActive: true, order: 3 }}),
    prisma.announcement.create({ data: { message: '💬 Hỗ trợ 24/7 qua AI Chatbot – Giải đáp mọi thắc mắc tức thì', isActive: true, order: 4 }}),
  ]);

  console.log('✅ Seeding finished successfully!');
  console.log(`   - Users: 10 (1 admin, 4 sellers, 5 buyers)`);
  console.log(`   - Categories: 12`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Orders: ${orders.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
