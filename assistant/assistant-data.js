export const OPENING_MESSAGE =
  "Halo, Kak. Saya Asisten HIJAOE. Saya bantu catat kebutuhan awalnya dulu, lalu admin kami akan lanjutkan.";

export const HANDOFF_MESSAGE =
  "Baik, Kak. Saya teruskan ke admin HIJAOE. Admin membalas Senin-Sabtu pukul 08.00-17.00.";

export const COMPLETION_MESSAGE =
  "Siap, Kak. Sudah saya catat. Admin HIJAOE akan cek kebutuhan dan fotonya dulu sebelum membahas harga serta jadwal.";

export const FIELD_DEFINITIONS = [
  {
    state: "name",
    key: "name",
    label: "Nama",
    prompt: "Boleh tahu namanya, Kak?",
    required: true,
  },
  {
    state: "service",
    key: "service",
    label: "Pekerjaan",
    prompt: "Kakak mau buat atau kerjakan apa? Ceritakan singkat saja.",
    required: true,
  },
  {
    state: "location",
    key: "location",
    label: "Lokasi",
    prompt: "Lokasi pengerjaan atau pengirimannya di daerah mana, Kak?",
    required: true,
  },
  {
    state: "dimensions",
    key: "dimensions",
    label: "Ukuran",
    prompt:
      "Kalau sudah ada, berapa ukuran perkiraannya? Kalau belum tahu, bilang belum tahu juga tidak apa-apa.",
    required: false,
  },
  {
    state: "material",
    key: "material",
    label: "Bahan atau model",
    prompt: "Ada bahan, model, atau contoh yang diinginkan, Kak?",
    required: false,
  },
  {
    state: "target_time",
    key: "targetTime",
    label: "Target waktu",
    prompt: "Rencananya ingin dikerjakan atau selesai sekitar kapan?",
    required: false,
  },
  {
    state: "photo",
    key: "photoReferences",
    label: "Foto referensi",
    prompt: "Bisa kirim foto lokasi atau contoh modelnya. Kalau belum ada, tulis lewati.",
    required: false,
  },
  {
    state: "email",
    key: "email",
    label: "Email",
    prompt:
      "Kalau berkenan, boleh kirim email untuk menerima katalog atau penawaran. Kalau tidak, tulis lewati.",
    required: false,
  },
  {
    state: "marketing_consent",
    key: "emailMarketingConsent",
    label: "Izin email promosi",
    prompt:
      "Apakah Kakak bersedia menerima informasi dan penawaran HIJAOE melalui email? Jawab ya atau tidak.",
    required: false,
  },
];

export const FIELD_BY_STATE = new Map(
  FIELD_DEFINITIONS.map((field) => [field.state, field]),
);

export const EMPTY_CUSTOMER_DATA = Object.freeze({
  name: "",
  service: "",
  location: "",
  dimensions: "",
  material: "",
  targetTime: "",
  photoReferences: "",
  email: "",
  emailMarketingConsent: "Tidak",
});
