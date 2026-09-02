import classNames from "classnames";
import { btn } from "./ui";

type Props = {
  className?: string;
};

export default function ContactButton({ className }: Props) {
  return (
    <a
      href="/#contact"
      className={classNames(
        btn("primary", "sm"),
        className
      )}
    >
      Contactează-ne
    </a>
  );
}
