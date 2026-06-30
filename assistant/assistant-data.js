export const OPENING_MESSAGE =
  "Halo Kak, bisa. Mau bikin atau kerjakan apa?";

export const HANDOFF_MESSAGE =
  "Siap Kak, saya teruskan ke admin HIJAOE biar dicek lanjut.";

export const COMPLETION_MESSAGE =
  "Siap Kak, sudah saya catat. Admin nanti cek detailnya dulu ya.";

export const FIELD_DEFINITIONS = [
  {
    state: "service",
    key: "service",
    label: "Pekerjaan",
    prompt: "Mau bikin atau kerjakan apa, Kak?",
    required: true,
  },
  {
    state: "location",
    key: "location",
    label: "Lokasi",
    prompt: "Lokasinya di daerah mana, Kak?",
    required: true,
  },
  {
    state: "dimensions",
    key: "dimensions",
    label: "Ukuran",
    prompt:
      "Kalau sudah ada, berapa ukuran perkiraannya? Kalau belum tahu, tidak apa-apa.",
    required: false,
  },
  {
    state: "material",
    key: "material",
    label: "Bahan atau model",
    prompt: "Ada bahan, model, atau contoh yang diinginkan?",
    required: false,
  },
  {
    state: "target_time",
    key: "targetTime",
    label: "Target waktu",
    prompt: "Rencananya mau dikerjakan sekitar kapan?",
    required: false,
  },
  {
    state: "photo",
    key: "photoReferences",
    label: "Foto referensi",
    prompt:
      "Kalau ada foto lokasi atau contoh model, boleh dikirim. Kalau belum ada, ketik lewati.",
    required: false,
  },
  {
    state: "name",
    key: "name",
    label: "Nama",
    prompt: "Boleh tahu nama Kakak untuk catatan admin?",
    required: true,
  },
  {
    state: "email",
    key: "email",
    label: "Email",
    prompt:
      "Kalau berkenan, boleh kirim email untuk katalog atau penawaran. Kalau tidak, ketik lewati.",
    required: false,
  },
  {
    state: "marketing_consent",
    key: "emailMarketingConsent",
    label: "Izin email promosi",
    prompt:
      "Kakak bersedia menerima info dan penawaran HIJAOE lewat email? Jawab ya atau tidak.",
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
