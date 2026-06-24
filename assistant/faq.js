import { business, services } from "../assets/js/site-data.js";

const serviceNames = services.map((service) => service.title).join(", ");

const FAQ_ENTRIES = [
  {
    key: "hours",
    patterns: [/jam buka/i, /buka hari apa/i, /operasional/i],
    answer: `${business.hours}. ${business.closed}.`,
  },
  {
    key: "service_area",
    patterns: [/melayani daerah/i, /area layanan/i, /luar makassar/i],
    answer:
      "HIJAOE melayani Makassar, Gowa, Maros, dan sekitarnya. Pengiriman atau pengerjaan ke wilayah lain di Sulawesi Selatan dapat dibicarakan sesuai kebutuhan, jarak, dan kesepakatan, Kak.",
  },
  {
    key: "services",
    patterns: [/layanan apa/i, /bisa bikin apa/i, /kerja apa saja/i],
    answer: `Layanan utama HIJAOE: ${serviceNames}.`,
  },
  {
    key: "workshop_location",
    patterns: [/alamat bengkel/i, /lokasi bengkel/i, /google maps/i],
    answer: `Bengkel HIJAOE berada di ${business.city}. Lokasinya bisa dibuka di ${business.mapUrl}`,
  },
];

const HANDOFF_PATTERNS = [
  /\b(?:saya\s+)?(?:mau|ingin|pengen|pengin|perlu)\s+(?:ke\s+)?(?:admin(?:nya)?|cs)\b/i,
  /\b(?:saya\s+)?(?:mau|ingin|pengen|pengin|perlu)\s+(?:bicara|chat|ngobrol|kontak)(?:\s+langsung)?\s+(?:dengan|sama|ke)\s+(?:admin(?:nya)?|cs|manusia|orangnya|orang)\b/i,
  /\b(?:tolong\s+)?(?:hubungkan|sambungkan|kontak)\s+(?:saya\s+)?(?:dengan|sama|ke)\s+(?:admin(?:nya)?|cs|manusia|orangnya|orang)\b/i,
  /\b(?:bicara|chat|ngobrol)\s+(?:langsung\s+)?(?:dengan|sama|ke)\s+(?:admin(?:nya)?|cs|manusia|orangnya|orang)\b/i,
  /\b(?:minta|panggil)\s+(?:admin(?:nya)?|cs)\b/i,
  /\b(?:admin(?:nya)?|cs)\s+(?:dong|tolong)\b/i,
];

const PRICE_PATTERNS = [
  /berapa.*harga/i,
  /harga.*berapa/i,
  /berapa.*biaya/i,
  /biaya(?:nya)?.*berapa/i,
  /kisaran.*harga/i,
  /kisaran.*biaya/i,
  /perkiraan.*biaya/i,
  /ongkos.*berapa/i,
];

const SCHEDULE_GUARANTEE_PATTERNS = [
  /bisa dipastikan.*selesai/i,
  /pasti.*selesai/i,
  /jamin.*selesai/i,
  /kepastian.*jadwal/i,
];

export function findFaq(message) {
  return (
    FAQ_ENTRIES.find((entry) =>
      entry.patterns.some((pattern) => pattern.test(message)),
    ) || null
  );
}

export function detectHandoffRequest(message) {
  return HANDOFF_PATTERNS.some((pattern) => pattern.test(message));
}

export function detectPriceIntent(message) {
  if (PRICE_PATTERNS.some((pattern) => pattern.test(message))) {
    return "Pelanggan menanyakan harga";
  }

  return null;
}

export function detectScheduleGuaranteeIntent(message) {
  if (
    SCHEDULE_GUARANTEE_PATTERNS.some((pattern) => pattern.test(message))
  ) {
    return "Pelanggan meminta kepastian jadwal";
  }

  return null;
}

export function detectRestrictedIntent(message) {
  return detectPriceIntent(message) || detectScheduleGuaranteeIntent(message);
}
