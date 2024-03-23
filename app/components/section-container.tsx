import classNames from "classnames";
import SectionTopBgEffect from "./section-top-bg-effect";
import SectionBottomBgEffect from "./section-bottom-bg-effect";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionContainer({ children, className }: Props) {
  return (
    <div className={classNames("relative isolate px-8 pt-14", className)}>
      <SectionTopBgEffect />
      {children}
      <SectionBottomBgEffect />
    </div>
  );
}
