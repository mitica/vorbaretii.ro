import classNames from "classnames";

type Props = {
  className?: string;
};

export default function ContactButton({ className }: Props) {
  return (
    <a
      href="/#contact"
      className={classNames(
        "rounded-md bg-pink-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        className
      )}
    >
      Contactează-ne
    </a>
  );
}
