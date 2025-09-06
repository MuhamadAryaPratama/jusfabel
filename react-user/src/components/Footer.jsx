import Logo from "../assets/jusfabel-logo.png";
export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white p-10">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo & Deskripsi */}
        <div>
          <div className="flex items-center mb-4">
            <img src={Logo} className="w-16 h-16 mr-2" />
          </div>
          <p>Elevate Your Home with Jusfabel</p>
        </div>

        {/* Layanan */}
        {/*<div>
          <h3 className="font-semibold mb-4">Layanan</h3>
          <ul className="space-y-2">
            <li>Service Rutin</li>
            <li>Ganti Oli</li>
            <li>Tune Up</li>
            <li>Emergency Service</li>
          </ul>
        </div>*/}

        {/* Perusahaan */}
        <div>
          <h3 className="font-semibold mb-4">Perusahaan</h3>
          <ul className="space-y-2">
            <li>
              <a className="underline">Tentang Kami</a>
            </li>
            <li>
              <a className="underline">Kontak</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm pt-8 font-bold">
        © 2025 Jusfabel. All rights reserved.
      </div>
    </footer>
  );
}
