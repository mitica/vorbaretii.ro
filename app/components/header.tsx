import VIcon from "./icons/v-icon";

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav
        className="flex items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Vorbăreții</span>
            <span className="flex gap-0 items-end text-xl font-semibold">
              <VIcon className="h-8 w-8 text-pink-700" />
              <span className="text-gray-700 tracking-tight">orbăreții.ro</span>
            </span>
          </a>
        </div>
        <div className="lg:flex lg:flex-1 lg:justify-end">
          <a
            href="/#despre-curs"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Despre curs <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
