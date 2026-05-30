import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold sm:text-5xl">
          Booking sederhana, tanpa drama timezone.
        </h1>
        <p className="text-lg text-gray-400">
          Setel jam kerjamu sekali. Bagikan link unik. Biarkan tamu memilih slot
          dari zona waktu mereka, dengan konversi waktu yang benar dan tanpa
          double-booking.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200"
        >
          Mulai gratis
        </Link>
        <Link
          href="/login"
          className="rounded border border-gray-500 px-6 py-3 font-semibold hover:bg-gray-900"
        >
          Sudah punya akun
        </Link>
      </div>

      <div className="mt-12 grid w-full gap-6 sm:grid-cols-3">
        <Feature
          title="Timezone aman"
          body="Konversi waktu DST-safe pakai Luxon. 09:00 Jakarta tetap 09:00 Jakarta, kapan pun tamumu di mana pun."
        />
        <Feature
          title="Anti double-booking"
          body="Constraint database memastikan dua tamu tidak bisa ambil slot yang sama, walau klik bersamaan."
        />
        <Feature
          title="Public link"
          body="Bagikan link unik kamu. Tamu tidak perlu daftar, cukup pilih slot dan isi email."
        />
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded border border-gray-800 p-4 text-left">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{body}</p>
    </div>
  );
}