import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-bold text-[#121915]">404 &mdash; Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-[#4A564F] mt-2 mb-6">
        Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="px-4 py-2.5 rounded-[12px] bg-[#135E3F] text-white text-sm font-semibold hover:bg-[#0E4931]"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
