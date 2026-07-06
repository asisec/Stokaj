<div align="center">
  <img src="logo.png" alt="Stokaj Logo" width="300"/>
  <br />
  <br />
  <img src="https://skillicons.dev/icons?i=nextjs,react,tailwind,go,postgres,docker" alt="Tech Stack" />
</div>

# Stokaj - Motosiklet ERP & CRM Sistemi

Stokaj, motosiklet galerileri ve servisleri için özel olarak geliştirilmiş, modern bir envanter, müşteri ve satış yönetimi (POS) sistemidir.

## Temel Özellikler

* **Müşteri Yönetimi:** Müşterilerinizi sisteme kaydedin ve satışlarınızı müşterilerinizle ilişkilendirin.
* **Motosiklet & Yedek Parça Envanteri:** Motosikletlerinizi (alış/satış fiyatı, marka, şasi no) ve yedek parçalarınızı stok adetleriyle birlikte takip edin.
* **Gelişmiş POS (Satış) Ekranı:** Nakit, Havale ve Kredi Kartı (Tek Çekim & Taksit) seçenekleriyle kolayca çoklu ödeme alarak sepetinizdeki ürünleri satın.
* **Dashboard:** Net kâr, toplam satış hacmi, bekleyen işlemler ve envanter durumunuzu tek bir ekranda, güncel istatistiklerle görüntüleyin.
* **Otomatik Yedekleme & Güvenlik:** Belirlediğiniz SMTP ayarları üzerinden sistem veritabanı yedeğini tek tıkla e-posta adresinize gönderin. Güvenli ayarlar sayfası.

## Kullanılan Teknolojiler

* **Frontend:** Next.js (React), Tailwind CSS, Shadcn/UI
* **Backend:** Go, Gin Framework, GORM
* **Veritabanı:** PostgreSQL
* **Altyapı:** Docker & Docker Compose

## Kurulum ve Çalıştırma

Proje Docker ile konteynerize edilmiştir. Çalıştırmak için bilgisayarınızda **Docker** ve **Docker Compose** kurulu olması yeterlidir.

1. **Projeyi indirin:**
   ```bash
   git clone https://github.com/asisec/Stokaj.git
   cd Stokaj
   ```

2. **Çevre Değişkenlerini (Env) Ayarlayın:**
   Ana dizinde bulunan `.env.example` dosyasının adını `.env` olarak değiştirin (Eğer ekstra bir ayar gereksiniminiz yoksa varsayılan değerleri kullanabilirsiniz).

3. **Sistemi Başlatın:**
   ```bash
   docker-compose up -d --build
   ```

4. **Uygulamaya Erişin:**
   Tarayıcınızdan `http://localhost:3000` adresine giderek uygulamayı kullanmaya başlayabilirsiniz.
   *(Backend API `http://localhost:8080` üzerinde çalışmaktadır.)*

---
*Bu proje modern işletmelerin dijitalleşme süreçlerine katkı sağlamak amacıyla geliştirilmiştir.*
