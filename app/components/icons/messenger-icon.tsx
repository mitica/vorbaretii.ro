import React from "react";

type Props = {
  className?: string;
  w?: number | string;
  h?: number | string;
};

export default function MessengerIcon({ w, h, className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      width={w || "100%"}
      height={h || "100%"}
    >
      <path
        fill="currentColor"
        d="M 16 4 C 9.410156 4 4 9.136719 4 15.5 C 4 18.890625 5.570313 21.902344 8 24 L 8 28.625 L 12.4375 26.40625 C 13.566406 26.746094 14.746094 27 16 27 C 22.589844 27 28 21.863281 28 15.5 C 28 9.136719 22.589844 4 16 4 Z M 16 6 C 21.558594 6 26 10.265625 26 15.5 C 26 20.734375 21.558594 25 16 25 C 14.804688 25 13.664063 24.773438 12.59375 24.40625 L 12.1875 24.28125 L 10 25.375 L 10 23.125 L 9.625 22.8125 C 7.40625 21.0625 6 18.441406 6 15.5 C 6 10.265625 10.441406 6 16 6 Z M 14.875 12.34375 L 8.84375 18.71875 L 14.25 15.71875 L 17.125 18.8125 L 23.09375 12.34375 L 17.8125 15.3125 Z"
      />
    </svg>
  );
}
