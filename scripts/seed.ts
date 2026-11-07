import { config } from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import sharp from "sharp";
import { User } from "../src/models/User";
import { OwnerProfile } from "../src/models/OwnerProfile";
import { Unit, type Amenity, type UnitType } from "../src/models/Unit";
import { Transaction } from "../src/models/Transaction";
import { PayoutMethod } from "../src/models/PayoutMethod";
import { PayoutRequest } from "../src/models/PayoutRequest";

// Same precedence as Next.js: .env.local wins over .env
config({ path: ".env.local" });
config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stayro_owner";
const PHOTO_CACHE_DIR = path.join(__dirname, ".seed-photos");

type SeedUnit = {
  type: UnitType;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  city: string;
  district: string;
  address: string;
  location: { lat: number; lng: number };
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaM2: number;
  amenities: Amenity[];
  houseRules: string;
  pricing: {
    nightly: number;
    weekend?: number;
    cleaningFee?: number;
    currency: "SAR";
    minNights: number;
  };
  tourismLicenseNumber?: string;
  status: "draft" | "pending_review" | "published" | "rejected" | "unlisted";
  rejectionReason?: string;
  blockedDates?: string[];
  /** Unsplash photo IDs (images.unsplash.com/photo-<id>) */
  photos: string[];
};

const SAMPLE_UNITS: SeedUnit[] = [
  {
    type: "apartment",
    title: {
      ar: "شقة فاخرة في حي النرجس",
      en: "Luxury apartment in Al Narjis",
    },
    description: {
      ar: "شقة مفروشة بالكامل مع إطلالة رائعة، مناسبة للعائلات والمسافرين. قريبة من الخدمات والمولات مع موقف خاص وتكييف مركزي.",
      en: "Fully furnished apartment with a great view, ideal for families and travelers. Close to malls and services, with private parking and central A/C.",
    },
    city: "Riyadh",
    district: "Al Narjis",
    address: "Al Narjis district, Riyadh",
    location: { lat: 24.825, lng: 46.64 },
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    areaM2: 120,
    amenities: ["wifi", "parking", "ac", "kitchen", "tv", "washer", "elevator"],
    houseRules: "No parties. No smoking indoors. Quiet hours after 10 PM.",
    pricing: { nightly: 350, weekend: 450, cleaningFee: 50, currency: "SAR", minNights: 1 },
    tourismLicenseNumber: "73104535",
    status: "published",
    blockedDates: [],
    photos: ["1502672260266-1c1ef2d93688", "1484154218962-a197022b5858", "1505693416388-ac5ce068fe85"],
  },
  {
    type: "villa",
    title: {
      ar: "فيلا عصرية مع مسبح في الملقا",
      en: "Modern villa with pool in Al Malqa",
    },
    description: {
      ar: "فيلا واسعة بحديقة ومسبح خاص، مثالية للعائلات الكبيرة والتجمعات. مطبخ مجهز ونادي رياضي صغير.",
      en: "Spacious villa with a private garden and pool — perfect for large families. Fully equipped kitchen and a small gym.",
    },
    city: "Riyadh",
    district: "Al Malqa",
    address: "Al Malqa, North Riyadh",
    location: { lat: 24.798, lng: 46.61 },
    guests: 10,
    bedrooms: 5,
    beds: 6,
    bathrooms: 4,
    areaM2: 420,
    amenities: ["wifi", "parking", "ac", "kitchen", "pool", "bbq", "garden", "gym", "tv", "washer"],
    houseRules: "Max 10 guests. Pool use at own risk. No events without prior approval.",
    pricing: { nightly: 1800, weekend: 2200, cleaningFee: 250, currency: "SAR", minNights: 2 },
    tourismLicenseNumber: "73104535",
    status: "published",
    photos: ["1613490493576-7fde63acd811", "1600596542815-ffad4c1539a9", "1600607687939-ce8a6c25118c"],
  },
  {
    type: "chalet",
    title: {
      ar: "شاليه مطل على البحر في أبحر",
      en: "Seaview chalet in Obhur",
    },
    description: {
      ar: "شاليه أنيق على كورنيش أبحر مع شرفة واسعة وإطلالة بحرية. مناسب للعائلات والاستجمام في عطلة نهاية الأسبوع.",
      en: "Elegant Obhur chalet with a wide terrace and sea view. Ideal for weekend getaways with family.",
    },
    city: "Jeddah",
    district: "Obhur",
    address: "North Obhur Corniche, Jeddah",
    location: { lat: 21.74, lng: 39.1 },
    guests: 8,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    areaM2: 220,
    amenities: ["wifi", "parking", "ac", "kitchen", "bbq", "tv", "washer", "pool"],
    houseRules: "No loud music outdoors after midnight. Pets on request.",
    pricing: { nightly: 950, weekend: 1200, cleaningFee: 150, currency: "SAR", minNights: 2 },
    tourismLicenseNumber: "73104535",
    status: "published",
    photos: ["1564013799919-ab600027ffc6", "1571003123894-1f0594d2b5d9", "1520250497591-112f2f40a3f4"],
  },
  {
    type: "studio",
    title: {
      ar: "استوديو أنيق قرب برج المملكة",
      en: "Stylish studio near Kingdom Tower",
    },
    description: {
      ar: "استوديو حديث في موقع مركزي، مثالي للمسافرين من رجال الأعمال. واي فاي سريع ومساحة عمل مريحة.",
      en: "Modern studio in a central location — ideal for business travelers. Fast Wi‑Fi and a comfortable workspace.",
    },
    city: "Riyadh",
    district: "Olaya",
    address: "Olaya Street, Riyadh",
    location: { lat: 24.711, lng: 46.674 },
    guests: 2,
    bedrooms: 0,
    beds: 1,
    bathrooms: 1,
    areaM2: 45,
    amenities: ["wifi", "ac", "kitchen", "tv", "workspace", "elevator", "parking"],
    houseRules: "No smoking. Self check-in via smart lock.",
    pricing: { nightly: 220, weekend: 260, cleaningFee: 40, currency: "SAR", minNights: 1 },
    tourismLicenseNumber: "73104535",
    status: "published",
    photos: ["1586023492125-27b2c045efd7", "1522708323590-d24dbb6b0267", "1631049307264-da0ec9d70304"],
  },
  {
    type: "farm",
    title: {
      ar: "مزرعة ترفيهية في الخرج",
      en: "Leisure farm in Al Kharj",
    },
    description: {
      ar: "مزرعة واسعة مع جلسات خارجية ومنطقة شواء وحديقة. تجربة هادئة بعيداً عن المدينة.",
      en: "Spacious farm with outdoor seating, BBQ area, and garden. A quiet escape from the city.",
    },
    city: "Al Kharj",
    district: "Al Yamamah",
    address: "Al Kharj road, Al Yamamah",
    location: { lat: 24.15, lng: 47.3 },
    guests: 16,
    bedrooms: 4,
    beds: 8,
    bathrooms: 3,
    areaM2: 800,
    amenities: ["wifi", "parking", "ac", "kitchen", "bbq", "garden", "pets_allowed", "tv"],
    houseRules: "Respect neighbors. No fireworks. Pets welcome outdoors.",
    pricing: { nightly: 1400, weekend: 1700, cleaningFee: 200, currency: "SAR", minNights: 1 },
    tourismLicenseNumber: "73104535",
    status: "pending_review",
    photos: ["1500382017468-9049fed747ef", "1600585154340-be6161a56a0c", "1580587771525-78b9dba3b914"],
  },
  {
    type: "room",
    title: {
      ar: "غرفة خاصة في حي العليا",
      en: "Private room in Olaya",
    },
    description: {
      ar: "غرفة نوم خاصة مع حمام مشترك في شقة هادئة. مناسبة للإقامة القصيرة.",
      en: "Private bedroom with shared bathroom in a quiet apartment. Great for short stays.",
    },
    city: "Riyadh",
    district: "Olaya",
    address: "Olaya, Riyadh",
    location: { lat: 24.7, lng: 46.68 },
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    areaM2: 18,
    amenities: ["wifi", "ac", "tv", "workspace"],
    houseRules: "Shared spaces. Keep quiet after 11 PM.",
    pricing: { nightly: 120, cleaningFee: 20, currency: "SAR", minNights: 1 },
    status: "draft",
    photos: ["1512918728675-ed5a9ecdebfd", "1493809842364-78817add7ffb"],
  },
  {
    type: "camp",
    title: {
      ar: "مخيم صحراوي فاخر قرب الثمامة",
      en: "Luxury desert camp near Thumamah",
    },
    description: {
      ar: "تجربة مخيم فاخر تحت النجوم مع جلسات تراثية وخدمات ضيافة. مثالي للمجموعات الصغيرة.",
      en: "Luxury desert camp under the stars with heritage seating and hospitality service. Ideal for small groups.",
    },
    city: "Riyadh",
    district: "Thumamah",
    address: "Thumamah National Park road",
    location: { lat: 25.16, lng: 46.65 },
    guests: 12,
    bedrooms: 4,
    beds: 6,
    bathrooms: 2,
    areaM2: 300,
    amenities: ["parking", "bbq", "kitchen", "pets_allowed"],
    houseRules: "Bring warm clothes in winter. No off-road driving outside trails.",
    pricing: { nightly: 1100, weekend: 1400, cleaningFee: 180, currency: "SAR", minNights: 1 },
    tourismLicenseNumber: "73104535",
    status: "rejected",
    rejectionReason: "Please add clearer photos of bathrooms and safety equipment.",
    photos: ["1509316785289-025f5b846b35", "1504280390367-361c6d9f38f4"],
  },
  {
    type: "apartment",
    title: {
      ar: "شقة بإطلالة على البحر الأحمر - أبحر الجنوبية",
      en: "Red Sea view apartment — South Obhur",
    },
    description: {
      ar: "شقة راقية بطابق مرتفع وإطلالة بانورامية على البحر. مصعد وموقف وحراسة على مدار الساعة.",
      en: "Upscale high-floor apartment with panoramic Red Sea views. Elevator, parking, and 24/7 security.",
    },
    city: "Jeddah",
    district: "South Obhur",
    address: "South Obhur, Jeddah",
    location: { lat: 21.68, lng: 39.12 },
    guests: 5,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    areaM2: 160,
    amenities: ["wifi", "parking", "ac", "kitchen", "tv", "washer", "elevator", "security", "gym"],
    houseRules: "Building quiet hours apply. No smoking on balcony.",
    pricing: { nightly: 520, weekend: 640, cleaningFee: 80, currency: "SAR", minNights: 2 },
    tourismLicenseNumber: "73104535",
    status: "unlisted",
    photos: ["1560448204-e02f11c3d0e2", "1540518614846-7eded433c457", "1499793983690-e29da59ef1c2"],
  },
];

async function clearGridFS(db: mongoose.mongo.Db) {
  const files = db.collection("unitPhotos.files");
  const chunks = db.collection("unitPhotos.chunks");
  await Promise.all([files.deleteMany({}), chunks.deleteMany({})]);
}

async function writeBuffer(
  bucket: GridFSBucket,
  buffer: Buffer,
  filename: string,
  metadata: Record<string, unknown>
): Promise<ObjectId> {
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      contentType: "image/webp",
      metadata,
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id as ObjectId));
    stream.end(buffer);
  });
}

async function loadPhoto(unsplashId: string, label: string): Promise<Buffer> {
  const cached = path.join(PHOTO_CACHE_DIR, `${unsplashId}.jpg`);
  if (fs.existsSync(cached)) return fs.readFileSync(cached);

  try {
    const res = await fetch(
      `https://images.unsplash.com/photo-${unsplashId}?w=1600&q=80&fit=crop&auto=format&fm=jpg`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(PHOTO_CACHE_DIR, { recursive: true });
    fs.writeFileSync(cached, buffer);
    return buffer;
  } catch (err) {
    console.warn(`  ! Could not download ${unsplashId} (${(err as Error).message}); using placeholder`);
    return Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1066">
        <rect width="1600" height="1066" fill="#FF5A3D"/>
        <text x="120" y="960" font-family="Arial, sans-serif" font-size="56" fill="white">${label}</text>
      </svg>
    `);
  }
}

async function createSeedPhotos(
  bucket: GridFSBucket,
  label: string,
  unsplashIds: string[],
  ownerId: string,
  unitIndex: number
) {
  const photos = [];
  for (let i = 0; i < unsplashIds.length; i++) {
    const source = await loadPhoto(unsplashIds[i], label);
    const full = await sharp(source)
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const thumb = await sharp(source)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();

    const fileId = await writeBuffer(bucket, full, `seed-${unitIndex}-${i}.webp`, {
      kind: "full",
      ownerId,
      seeded: true,
    });
    const thumbId = await writeBuffer(bucket, thumb, `seed-${unitIndex}-${i}-thumb.webp`, {
      kind: "thumb",
      parentId: fileId.toString(),
      ownerId,
      seeded: true,
    });

    photos.push({
      fileId,
      thumbId,
      order: i,
      isCover: i === 0,
    });
  }
  return photos;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to", MONGODB_URI.replace(/\/\/[^@]+@/, "//***@"));

  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB");

  await Promise.all([
    User.deleteMany({}),
    OwnerProfile.deleteMany({}),
    Unit.deleteMany({}),
    Transaction.deleteMany({}),
    PayoutMethod.deleteMany({}),
    PayoutRequest.deleteMany({}),
  ]);
  await clearGridFS(db);

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await User.create({
    name: "Stayro Admin",
    email: "admin@stayro.com",
    passwordHash,
    role: "admin",
    locale: "ar",
    emailVerified: new Date(),
  });

  const owner = await User.create({
    name: "Rakan Owner",
    email: "owner@stayro.com",
    phone: "+966551234471",
    passwordHash,
    role: "owner",
    locale: "ar",
    emailVerified: new Date(),
  });

  const owner2 = await User.create({
    name: "Abdulrahman Host",
    email: "host@stayro.com",
    phone: "+966546546480",
    passwordHash,
    role: "owner",
    locale: "en",
    emailVerified: new Date(),
  });

  await OwnerProfile.create([
    {
      userId: owner._id,
      idType: "national_id",
      idNumber: "1234567890",
      verificationStatus: "verified",
    },
    {
      userId: owner2._id,
      idType: "iqama",
      idNumber: "2345678901",
      verificationStatus: "pending",
    },
  ]);

  const bucket = new GridFSBucket(db, { bucketName: "unitPhotos" });
  const createdUnits = [];

  for (let i = 0; i < SAMPLE_UNITS.length; i++) {
    const sample = SAMPLE_UNITS[i];
    const ownerId = i % 3 === 2 ? owner2._id : owner._id;
    const photos = await createSeedPhotos(
      bucket,
      sample.title.en,
      sample.photos,
      ownerId.toString(),
      i
    );

    const unit = await Unit.create({
      ownerId,
      type: sample.type,
      title: sample.title,
      description: sample.description,
      city: sample.city,
      district: sample.district,
      address: sample.address,
      location: sample.location,
      guests: sample.guests,
      bedrooms: sample.bedrooms,
      beds: sample.beds,
      bathrooms: sample.bathrooms,
      areaM2: sample.areaM2,
      amenities: sample.amenities,
      houseRules: sample.houseRules,
      checkInTime: "15:00",
      checkOutTime: "12:00",
      photos,
      pricing: sample.pricing,
      blockedDates: sample.blockedDates || [],
      tourismLicenseNumber: sample.tourismLicenseNumber,
      status: sample.status,
      rejectionReason: sample.rejectionReason,
    });
    createdUnits.push(unit);
    console.log(`  ✓ ${sample.status.padEnd(15)} ${sample.title.en}`);
  }

  await PayoutMethod.create([
    {
      ownerId: owner._id,
      bankName: "Al Rajhi Bank",
      accountHolder: "Rakan Owner",
      iban: "SA0380000000608010167519",
      ibanMasked: "SA03 •••• •••• 7519",
      isDefault: true,
    },
    {
      ownerId: owner2._id,
      bankName: "Saudi National Bank",
      accountHolder: "Abdulrahman Host",
      iban: "SA4420000001234567891234",
      ibanMasked: "SA44 •••• •••• 1234",
      isDefault: true,
    },
  ]);

  const published = createdUnits.filter((u) => u.status === "published");
  await Transaction.create([
    {
      ownerId: owner._id,
      unitId: published[0]?._id,
      type: "booking_earning",
      amount: 1400,
      status: "completed",
      description: "Weekend booking — Al Narjis apartment",
      reference: "seed_booking_1",
    },
    {
      ownerId: owner._id,
      unitId: published[0]?._id,
      type: "fee",
      amount: -140,
      status: "completed",
      description: "Platform fee 10%",
      reference: "seed_fee_1",
    },
    {
      ownerId: owner._id,
      unitId: published[1]?._id,
      type: "booking_earning",
      amount: 3600,
      status: "completed",
      description: "3-night villa stay — Al Malqa",
      reference: "seed_booking_2",
    },
    {
      ownerId: owner._id,
      unitId: published[1]?._id,
      type: "fee",
      amount: -360,
      status: "completed",
      description: "Platform fee 10%",
      reference: "seed_fee_2",
    },
    {
      ownerId: owner2._id,
      unitId: published[2]?._id,
      type: "booking_earning",
      amount: 2400,
      status: "completed",
      description: "Obhur chalet booking",
      reference: "seed_booking_3",
    },
    {
      ownerId: owner._id,
      type: "adjustment",
      amount: 200,
      status: "completed",
      description: "Goodwill credit",
      reference: "seed_adj_1",
    },
  ]);

  console.log("\nSeed complete.");
  console.log(`Units created: ${createdUnits.length}`);
  console.log("Accounts:");
  console.log("  Admin : admin@stayro.com / Password123!");
  console.log("  Owner : owner@stayro.com / Password123!");
  console.log("  Host  : host@stayro.com  / Password123!");
  console.log("Admin id:", admin._id.toString());
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
