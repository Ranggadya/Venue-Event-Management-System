# Venue & Event Management Dashboard

Dashboard administrasi untuk mengelola venue, jadwal event, kapasitas peserta,
biaya sewa, pembayaran, dan laporan statistik.

Project ini dibangun menggunakan NestJS, Prisma ORM, MySQL, EJS, dan Tailwind
CSS. Aplikasi menyediakan halaman Server-Side Rendering (SSR) untuk admin serta
JSON API untuk kebutuhan integrasi.

## Daftar Isi

- [Gambaran Project](#gambaran-project)
- [Studi Kasus](#studi-kasus)
- [Aktor dan Use Case](#aktor-dan-use-case)
- [Fitur Utama](#fitur-utama)
- [Aturan Bisnis](#aturan-bisnis)
- [Alur Penggunaan](#alur-penggunaan)
- [Screenshot](#screenshot)
- [Arsitektur](#arsitektur)
- [Database dan Relasi](#database-dan-relasi)
- [Logika Harga](#logika-harga)
- [Keamanan dan Session](#keamanan-dan-session)
- [Teknologi](#teknologi)
- [Struktur Project](#struktur-project)
- [Instalasi dan Menjalankan Project](#instalasi-dan-menjalankan-project)
- [Akun Admin Development](#akun-admin-development)
- [Route SSR](#route-ssr)
- [JSON API](#json-api)
- [Testing dan Quality Check](#testing-dan-quality-check)
- [Troubleshooting](#troubleshooting)
- [Catatan Production](#catatan-production)
- [Pengembangan Lanjutan](#pengembangan-lanjutan)
- [License](#license)

## Gambaran Project

Venue & Event Management Dashboard membantu administrator mengelola operasional
penyewaan venue dan penyelenggaraan event dari satu dashboard.

Masalah yang diselesaikan project ini:

- Menyimpan data venue beserta lokasi, kapasitas, harga, dan status operasional.
- Mencegah event menggunakan venue yang tidak aktif atau sedang maintenance.
- Mencegah jadwal event bertabrakan pada venue yang sama.
- Mencegah jumlah peserta melebihi kapasitas venue.
- Menghitung harga sewa otomatis berdasarkan durasi dan harga venue.
- Mengelola diskon, biaya tambahan, serta status pembayaran.
- Menampilkan statistik venue, event, dan pendapatan.

Project ini cocok digunakan sebagai:

- Studi kasus backend NestJS dan Prisma.
- Dashboard internal perusahaan event organizer.
- Sistem administrasi gedung, ballroom, meeting room, atau convention center.
- Dasar pengembangan aplikasi booking venue yang lebih besar.

## Studi Kasus

Sebuah perusahaan mengelola beberapa venue di berbagai kota. Setiap venue
memiliki kapasitas, harga per jam, harga per hari, dan status operasional.

Ketika admin menerima permintaan event, admin perlu:

1. Memilih venue yang aktif.
2. Memastikan jumlah peserta tidak melebihi kapasitas venue.
3. Memastikan jadwal tidak bertabrakan dengan event lain.
4. Menentukan waktu mulai dan selesai.
5. Menghitung pilihan sewa per jam atau per hari yang paling ekonomis.
6. Menambahkan diskon atau biaya tambahan jika diperlukan.
7. Memantau apakah event sudah dibayar.

Contoh:

```text
Venue          : Grand Ballroom Jakarta
Kapasitas      : 500 orang
Harga per jam  : Rp2.000.000
Harga per hari : Rp15.000.000

Event          : Technology Conference
Peserta        : 400 orang
Durasi         : 10 jam
```

Biaya per jam adalah Rp20.000.000, sedangkan biaya harian adalah Rp15.000.000.
Sistem memilih tipe sewa harian karena lebih murah.

## Aktor dan Use Case

### Aktor Utama

Saat ini aplikasi memiliki satu aktor utama:

| Aktor | Tanggung jawab |
|---|---|
| Admin | Login, mengelola venue, mengelola event, pembayaran, dan statistik |

### Use Case Admin

```mermaid
flowchart LR
    Admin["Admin"]
    Admin --> Login["Login dan Logout"]
    Admin --> Dashboard["Melihat Dashboard"]
    Admin --> Venue["Mengelola Venue"]
    Admin --> Event["Mengelola Event"]
    Admin --> Payment["Mengubah Status Pembayaran"]
    Admin --> Report["Melihat Statistik dan Pendapatan"]

    Venue --> VenueCreate["Tambah Venue"]
    Venue --> VenueUpdate["Ubah Venue"]
    Venue --> VenueDelete["Hapus Venue"]

    Event --> EventCreate["Tambah Event"]
    Event --> EventUpdate["Ubah Event"]
    Event --> EventDelete["Hapus Event"]
    Event --> Availability["Cek Jadwal dan Kapasitas"]
```

## Fitur Utama

### Authentication

- Login admin menggunakan email dan password.
- Password disimpan sebagai bcrypt hash.
- Logout menghancurkan session aktif.
- Session normal berlaku 7 hari.
- Session dengan Remember Me berlaku 30 hari.
- SSR route dan JSON API menggunakan guard yang berbeda.

### Dashboard

- Ringkasan jumlah venue dan event.
- Statistik status event.
- Daftar venue dan event terbaru.
- Informasi operasional untuk admin.

### Venue Management

- Tambah, lihat, ubah, dan hapus venue.
- Filter, pencarian, sorting, dan pagination.
- Menyimpan kapasitas dan lokasi venue.
- Menyimpan harga per jam dan per hari.
- Status venue: `ACTIVE`, `MAINTENANCE`, dan `INACTIVE`.
- Statistik venue berdasarkan status, kota, dan kapasitas.

### Event Management

- Tambah, lihat, ubah, dan hapus event.
- Menentukan venue, peserta, waktu, status, dan pembayaran.
- Validasi kapasitas peserta pada browser dan service backend.
- Validasi event tidak berada di masa lalu.
- Validasi waktu selesai harus setelah waktu mulai.
- Validasi minimal durasi event satu jam.
- Validasi maksimal durasi event 30 hari.
- Validasi jadwal tidak bertabrakan.
- Hanya venue berstatus `ACTIVE` yang dapat digunakan.

### Pricing dan Payment

- Memilih tipe sewa `HOURLY` atau `DAILY`.
- Otomatis memilih tipe sewa termurah jika tidak ditentukan.
- Menghitung base price.
- Mendukung diskon persentase.
- Mendukung additional fees.
- Menghitung final price otomatis.
- Menandai event sebagai paid atau unpaid.
- Menyimpan tanggal pembayaran ketika status menjadi paid.

### Reporting

- Statistik jumlah event berdasarkan status.
- Statistik venue berdasarkan status dan kota.
- Ringkasan pendapatan paid dan unpaid.
- Pendapatan per venue.
- Pendapatan berdasarkan rentang tanggal.

## Aturan Bisnis

Business rules utama dijalankan di service layer agar tetap berlaku untuk SSR
dan JSON API.

| Area | Aturan |
|---|---|
| Venue | Nama venue tidak boleh duplikat pada kota yang sama |
| Venue | Venue dengan event aktif atau upcoming tidak dapat dihapus |
| Booking | Venue harus ada dan berstatus `ACTIVE` |
| Booking | Venue tidak boleh memiliki event yang waktunya bertabrakan |
| Capacity | Jumlah peserta maksimal sama dengan kapasitas venue |
| Capacity | Jumlah peserta yang lebih besar dari kapasitas ditolak |
| Schedule | Waktu mulai tidak boleh berada di masa lalu |
| Schedule | Waktu selesai harus setelah waktu mulai |
| Schedule | Durasi minimal satu jam dan maksimal 30 hari |
| Pricing | Harga dihitung berdasarkan durasi dan tipe rental |
| Pricing | Jika tipe rental kosong, sistem memilih biaya termurah |
| Payment | Status paid menyimpan payment date |
| Deletion | Foreign key event ke venue menggunakan `onDelete: Restrict` |

## Alur Penggunaan

### 1. Login Admin

1. Buka `/auth/login`.
2. Masukkan email dan password admin.
3. Centang Remember Me jika ingin session bertahan 30 hari.
4. Setelah login berhasil, admin diarahkan ke `/dashboard`.

### 2. Membuat Venue

1. Buka menu Venues.
2. Klik Create Venue.
3. Isi nama, alamat, kota, kapasitas, harga, dan status.
4. Simpan venue.

Venue harus berstatus `ACTIVE` agar dapat dipilih saat membuat event.

### 3. Membuat Event

1. Buka menu Events.
2. Klik Create Event.
3. Pilih venue aktif.
4. Isi jumlah peserta.
5. Tentukan waktu mulai dan selesai.
6. Tambahkan diskon atau biaya tambahan jika diperlukan.
7. Simpan event.

Sebelum event dibuat, sistem akan mengecek:

- Kapasitas peserta.
- Status venue.
- Jadwal bentrok.
- Rentang waktu.
- Harga rental.

### 4. Mengelola Pembayaran

Admin dapat membuka detail event dan mengubah status pembayaran menjadi paid
atau unpaid. Statistik pendapatan akan mengikuti status pembayaran tersebut.

## Screenshot

### Login

![Login page](screenshots/login-page.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Venue

![Venue list](screenshots/venue-list.png)

![Venue form](screenshots/venue-form.png)

![Venue statistics](screenshots/venue-statistics.png)

### Event

![Event list](screenshots/event-list.png)

![Event form](screenshots/event-form.png)

![Event detail](screenshots/event-detail.png)

![Event statistics](screenshots/event-statistics.png)

## Arsitektur

Project menggunakan modular layered architecture.

```mermaid
flowchart TD
    Browser["Browser / Client"]
    Controller["Controller Layer"]
    DTO["DTO Validation"]
    Service["Business Logic / Service Layer"]
    Prisma["Prisma ORM"]
    MySQL["MySQL Database"]
    EJS["EJS Views"]

    Browser --> Controller
    Controller --> DTO
    DTO --> Service
    Service --> Prisma
    Prisma --> MySQL
    Controller --> EJS
    EJS --> Browser
```

### Pembagian Tanggung Jawab

| Layer | Tanggung jawab |
|---|---|
| Controller | Menangani HTTP request, redirect, render, dan response |
| DTO | Transformasi dan validasi input |
| Service | Business rules, pricing, availability, dan database workflow |
| Prisma | Query dan mapping data ke MySQL |
| EJS View | Tampilan SSR dan interaksi form |
| Guard | Memastikan user sudah login |
| Filter | Menstandarkan penanganan exception |

## Database dan Relasi

### Entity Relationship

```mermaid
erDiagram
    ADMIN {
        string id PK
        string name
        string email UK
        string password_hash
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    VENUE {
        string id PK
        string name
        string address
        string city
        int capacity
        decimal price_per_hour
        decimal price_per_day
        string currency
        enum status
    }

    EVENT {
        string id PK
        string venue_id FK
        string name
        int attendee_count
        datetime start_datetime
        datetime end_datetime
        enum status
        enum rental_type
        decimal base_price
        decimal discount
        decimal additional_fees
        decimal final_price
        boolean is_paid
        datetime payment_date
    }

    VENUE ||--o{ EVENT : hosts
```

### Relasi One-to-Many

Relasi utama project:

```text
Satu Venue dapat memiliki banyak Event.
Satu Event hanya dimiliki oleh satu Venue.
```

Foreign key disimpan pada `events.venue_id`.

### Status

Venue status:

- `ACTIVE`: venue dapat digunakan untuk event.
- `MAINTENANCE`: venue sedang dalam perawatan dan tidak dapat dibooking.
- `INACTIVE`: venue tidak digunakan dan tidak dapat dibooking.

Event status:

- `UPCOMING`
- `ONGOING`
- `COMPLETED`
- `CANCELLED`

## Logika Harga

### Duration

```text
durationHours = ceil(endDatetime - startDatetime)
```

### Hourly Price

```text
hourlyTotal = pricePerHour * durationHours
```

### Daily Price

```text
days = ceil(durationHours / 24)
dailyTotal = pricePerDay * days
```

Jika tipe rental tidak diberikan, sistem membandingkan `hourlyTotal` dan
`dailyTotal`, kemudian memilih biaya yang lebih murah.

### Final Price

```text
discountAmount = basePrice * discountPercent / 100
finalPrice = basePrice - discountAmount + additionalFees
```

Kolom nominal uang menggunakan `Decimal(15,2)` agar mendukung nilai IDR untuk
event berdurasi panjang.

## Keamanan dan Session

- Password admin di-hash menggunakan bcrypt.
- Input divalidasi menggunakan `class-validator`.
- Global validation menggunakan whitelist dan menolak field tidak dikenal.
- Helmet digunakan untuk security headers dan Content Security Policy.
- Rate limiting tersedia melalui `@nestjs/throttler`.
- Cookie session menggunakan `httpOnly` dan `sameSite=lax`.
- Cookie `secure` aktif pada environment production.
- Session route SSR dilindungi `AuthGuard`.
- Session JSON API dilindungi `ApiAuthGuard`.

Default session:

```text
Login normal : 7 hari
Remember Me  : 30 hari
Rolling      : aktif, masa session diperpanjang saat user aktif
```

## Teknologi

### Backend

- Node.js
- NestJS 11
- TypeScript
- Prisma ORM
- MySQL

### Frontend

- EJS Server-Side Rendering
- Tailwind CSS
- Alpine.js

### Validation dan Security

- class-validator
- class-transformer
- bcrypt
- express-session
- Helmet
- NestJS Throttler

### Testing dan Tooling

- Jest
- Supertest
- ESLint
- Prettier

## Struktur Project

```text
admin-dashboard/
|-- prisma/
|   |-- migrations/              # Riwayat perubahan database
|   |-- schema.prisma            # Model dan relasi database
|   `-- seed.ts                  # Data awal development
|-- public/
|   |-- css/                     # Tailwind input dan hasil build
|   `-- js/                      # JavaScript global browser
|-- src/
|   |-- auth/                    # Login, session, guards, auth API
|   |-- common/                  # Filter, middleware, utility, dan type
|   |-- event/                   # Event controller, service, DTO, pricing
|   |-- prisma/                  # Prisma service dan module
|   |-- venue/                   # Venue controller, service, dan DTO
|   |-- app.controller.ts        # Root dan dashboard
|   |-- app.module.ts            # Root NestJS module
|   `-- main.ts                  # Bootstrap aplikasi
|-- test/                        # End-to-end test
|-- views/
|   |-- auth/                    # Login page
|   |-- events/                  # Event pages
|   |-- layout/                  # Main EJS layout
|   |-- partials/                # Sidebar, topbar, alert, footer
|   `-- venues/                  # Venue pages
|-- package.json
`-- README.md
```

## Instalasi dan Menjalankan Project

### Prasyarat

- Node.js 18 atau lebih baru.
- npm.
- MySQL Server.
- Database dan user MySQL yang dapat digunakan aplikasi.

### 1. Install Dependencies

```bash
npm install
```

### 2. Siapkan Database MySQL

Contoh:

```sql
CREATE DATABASE venue_event_db;
CREATE USER 'venue_event'@'localhost' IDENTIFIED BY 'change-this-password';
GRANT ALL PRIVILEGES ON venue_event_db.* TO 'venue_event'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Siapkan Environment Variables

Buat atau sesuaikan `.env`:

```env
DATABASE_URL="mysql://venue_event:change-this-password@localhost:3306/venue_event_db"
SESSION_SECRET="replace-with-a-long-random-secret"
SESSION_MAX_AGE_MS=604800000
REMEMBER_ME_MAX_AGE_MS=2592000000
PORT=3001
NODE_ENV=development
```

Jangan gunakan secret dan password development pada production.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply Database Migration

Development:

```bash
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

### 6. Seed Data Development

```bash
npx prisma db seed
```

### 7. Build Tailwind CSS

```bash
npm run tailwind:build
```

### 8. Jalankan Aplikasi

NestJS dan Tailwind watch mode:

```bash
npm run dev
```

Hanya NestJS development server:

```bash
npm run start:dev
```

Aplikasi berjalan pada:

```text
http://localhost:3001
```

### Production Build

```bash
npm run build
npm run start:prod
```

## Akun Admin Development

Seed development membuat akun:

```text
Email    : admin@eventmanager.com
Password : admin123
```

Akun ini hanya untuk development. Ubah atau hapus akun seed sebelum deployment
production.

Password admin yang sudah tersimpan di database berbentuk bcrypt hash dan tidak
dapat dibaca kembali sebagai plaintext.

## Route SSR

Semua route venue dan event membutuhkan session admin.

### Authentication dan Dashboard

| Method | Route | Fungsi |
|---|---|---|
| GET | `/` | Redirect ke dashboard atau login |
| GET | `/auth/login` | Menampilkan halaman login |
| POST | `/auth/login` | Memproses login |
| GET | `/auth/logout` | Logout admin |
| GET | `/auth/me` | Data admin yang sedang login |
| GET | `/dashboard` | Dashboard utama |

### Venue

| Method | Route | Fungsi |
|---|---|---|
| GET | `/venues` | Daftar venue |
| GET | `/venues/create` | Form tambah venue |
| POST | `/venues` | Membuat venue |
| GET | `/venues/statistics/overview` | Statistik venue |
| GET | `/venues/:id` | Detail venue |
| GET | `/venues/:id/edit` | Form edit venue |
| POST | `/venues/:id` | Memperbarui venue |
| POST | `/venues/:id/delete` | Menghapus venue |

### Event

| Method | Route | Fungsi |
|---|---|---|
| GET | `/events` | Daftar event |
| GET | `/events/create` | Form tambah event |
| GET | `/events/check-availability` | Cek ketersediaan venue |
| POST | `/events` | Membuat event |
| GET | `/events/statistics/overview` | Statistik event |
| GET | `/events/financial/overview` | Statistik finansial |
| GET | `/events/:id` | Detail event |
| GET | `/events/:id/edit` | Form edit event |
| POST | `/events/:id` | Memperbarui event |
| POST | `/events/:id/delete` | Menghapus event |
| POST | `/events/:id/toggle-payment` | Mengubah status pembayaran |

## JSON API

API menggunakan session cookie. Login terlebih dahulu melalui `/api/auth/login`
atau SSR login.

### Authentication API

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/login` | Login dan membuat session |
| POST | `/api/auth/logout` | Logout API |
| GET | `/api/auth/me` | Admin yang sedang login |

### Venue API

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/venues` | Membuat venue |
| GET | `/api/venues` | Daftar venue dengan query/filter |
| GET | `/api/venues/statistics` | Statistik venue |
| GET | `/api/venues/:id` | Detail venue |
| PATCH | `/api/venues/:id` | Memperbarui venue |
| DELETE | `/api/venues/:id` | Menghapus venue |

### Event API

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/events` | Membuat event |
| GET | `/api/events` | Daftar event dengan query/filter |
| GET | `/api/events/statistics` | Statistik event |
| GET | `/api/events/financial/statistics` | Statistik finansial |
| GET | `/api/events/financial/revenue` | Revenue berdasarkan tanggal |
| GET | `/api/events/venue/:venueId` | Event berdasarkan venue |
| GET | `/api/events/:id` | Detail event |
| PATCH | `/api/events/:id` | Memperbarui event |
| DELETE | `/api/events/:id` | Menghapus event |

## Testing dan Quality Check

### Unit Test

```bash
npm test
```

### End-to-End Test

```bash
npm run test:e2e
```

E2E test membutuhkan database MySQL yang dapat diakses.

### Test Coverage

```bash
npm run test:cov
```

### TypeScript Build Check

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

Sebelum membuat pull request atau deployment, jalankan:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Troubleshooting

### Tidak Bisa Login

- Pastikan database berjalan.
- Pastikan data admin tersedia.
- Jalankan seed jika database masih kosong.
- Pastikan admin memiliki `isActive = true`.
- Hapus cookie `sessionId` jika session browser bermasalah.

### Session Cepat Habis

Pastikan nilai environment berikut benar:

```env
SESSION_MAX_AGE_MS=604800000
REMEMBER_ME_MAX_AGE_MS=2592000000
```

Restart aplikasi setelah mengubah environment variables.

### Event Tidak Bisa Dibuat

Periksa hal berikut:

- Venue harus berstatus `ACTIVE`.
- Jumlah peserta tidak boleh melebihi kapasitas venue.
- Waktu mulai tidak boleh berada di masa lalu.
- Waktu selesai harus setelah waktu mulai.
- Jadwal venue tidak boleh bertabrakan dengan event lain.
- Venue harus memiliki harga per jam atau per hari.
- Migration database terbaru harus sudah diterapkan.

Jalankan:

```bash
npx prisma migrate deploy
```

### Error Harga Event Out of Range

Migration terbaru memperbesar kolom uang ke `Decimal(15,2)`. Apply migration:

```bash
npx prisma migrate deploy
```

### Prisma Client Tidak Sesuai Schema

```bash
npx prisma generate
```

### CSS Tidak Berubah

```bash
npm run tailwind:build
```

atau gunakan watch mode:

```bash
npm run tailwind:watch
```

### Port Sudah Digunakan

Ubah nilai `PORT` pada `.env`, lalu restart aplikasi.

## Catatan Production

Sebelum digunakan pada production:

- Ganti `SESSION_SECRET` dengan nilai acak yang panjang.
- Ganti kredensial database development.
- Jangan gunakan akun admin seed.
- Gunakan HTTPS agar secure cookie aktif.
- Gunakan persistent session store seperti Redis atau database.
- Jangan mengandalkan default in-memory session store Express.
- Jalankan migration menggunakan `prisma migrate deploy`.
- Tambahkan backup database dan monitoring.
- Tambahkan test untuk setiap business rule penting.
- Pertimbangkan audit log untuk perubahan venue, event, dan pembayaran.
- Pertimbangkan role-based access control jika admin memiliki level akses berbeda.

## Pengembangan Lanjutan

Fitur yang dapat ditambahkan:

- Multi-role admin dan staff.
- Customer atau organizer management.
- Invoice dan bukti pembayaran.
- Notification dan reminder event.
- Kalender event interaktif.
- Upload dokumen dan gambar venue.
- Audit trail.
- Export laporan PDF atau spreadsheet.
- Approval workflow untuk booking.
- Integrasi payment gateway.

## License

Project saat ini bersifat private dan menggunakan status license `UNLICENSED`
sesuai `package.json`.
