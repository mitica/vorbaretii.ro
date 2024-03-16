import React from "react";

export type VIconProps = {
  className?: string;
  w?: number | string;
  h?: number | string;
  lineColor?: string;
  bgColor?: string;
};

export default function VIcon({ w, h, className, lineColor }: VIconProps) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1069 1280"
      preserveAspectRatio="xMidYMid meet"
      width={w || "100%"}
      height={h || "100%"}
      className={className}
    >
      <g
        transform="translate(0,1280) scale(0.1,-0.1)"
        fill={lineColor || "currentColor"}
        stroke="none"
      >
        <path
          d="M1570 12619 c-850 -98 -1551 -178 -1557 -178 -10 -1 -13 -29 -13
-105 l0 -105 226 -553 c124 -304 275 -672 334 -818 59 -146 189 -463 288 -705
384 -941 788 -1930 872 -2135 48 -118 182 -447 298 -730 357 -873 916 -2242
1967 -4817 l1010 -2473 126 0 125 0 16 33 c9 19 543 1219 1188 2668 645 1449
1455 3269 1800 4044 345 776 1035 2326 1534 3446 l906 2037 0 106 c0 58 -2
106 -4 106 -2 0 -467 54 -1033 120 -565 66 -1260 148 -1543 181 -297 34 -545
58 -585 57 l-70 -3 -240 -655 c-133 -360 -623 -1696 -1090 -2967 -467 -1272
-852 -2313 -855 -2313 -3 0 -184 543 -403 1208 -219 664 -537 1628 -707 2142
-170 514 -431 1307 -581 1763 l-273 827 -96 -1 c-52 -1 -790 -82 -1640 -180z"
        />
      </g>
    </svg>
  );
}
