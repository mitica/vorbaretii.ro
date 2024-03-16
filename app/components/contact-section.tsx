import MessengerIcon from "./icons/messenger-icon";
import ViberIcon from "./icons/viber-icon";
import WhatsappIcon from "./icons/whatsapp-icon";

export default function ContactSection() {
  return (
    <div className="bg-gradient-to-b from-white via-white to-pink-100 py-16 sm:py-24">
      <a id="contact" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 grid-cols-1">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Contact
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Contactează-ne pentru mai multe informații.
          </p>
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-x-10 gap-x-10 text-center">
            {/* Viber */}
            <a
              href="viber://chat?number=%2B40721234567"
              className="flex rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              <ViberIcon className="h-5 w-5" />
              <span className="ml-2 hidden md:inline">Viber</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/40721234567"
              className="flex rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              <WhatsappIcon className="h-5 w-5" />
              <span className="ml-2 hidden md:inline">WhatsApp</span>
            </a>

            {/* messenger */}
            <a
              href="https://m.me/vorbaretii"
              className="flex rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <MessengerIcon className="h-5 w-5" />
              <span className="ml-2 hidden md:inline">Messanger</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}