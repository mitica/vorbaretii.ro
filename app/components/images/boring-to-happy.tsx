/* eslint-disable @next/next/no-img-element */
"use client";

import classNames from "classnames";
import { useRef, useState, useEffect } from "react";

export type ChildGender = "boy" | "girl";

type Props = {
  child?: ChildGender;
};

const getImages = (child: ChildGender, wsize: number) => {
  const size = wsize > 1000 ? 512 : 256;
  const boy = [
    "boy-smartphone-boring.jpg",
    "boy-experimenting-happy.jpg",
    "boy-boxing-happy.jpg",
    "boy-reading-happy.jpg",
    "boy-football-happy.jpg",
    "boy-dancing-happy.jpg",
    "boy-painting-happy.jpg"
  ].map((image) => image.replace(".jpg", `-${size}.jpg`));

  const girl = [
    "girl-smartphone-boring.jpg",
    "girl-experimenting-happy.jpg",
    "girl-swimming-happy.jpg",
    "girl-reading-happy.jpg",
    "girl-tenis-happy.jpg",
    "girl-dancing-happy.jpg",
    "girl-painting-happy.jpg"
  ].map((image) => image.replace(".jpg", `-${size}.jpg`));

  return child === "girl" ? girl : boy;
};

export default function BoringToHappy({ child = "boy" }: Props) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const { offsetWidth, offsetHeight } = ref.current;
    setWidth(offsetWidth);
    setHeight(offsetHeight);
  }, []);

  const imageClassName =
    "absolute object-cover object-center rounded-full overflow-hidden m-auto left-0 right-0 top-0 bottom-0 shadow-lg";

  const images = getImages(child, Math.min(width, height)).map((image, i) => {
    // first image in the center, 1/3 of min height/wight:
    if (i === 0) {
      return (
        <img
          key={i}
          className={classNames(imageClassName, "grayscale h-1/4 max-w-1/4")}
          src={`/assets/images/${image}`}
          alt={image}
        />
      );
    }
    // the rest 6 images are positioned in a cercle around the first image:
    const angle = (i * Math.PI) / 3;
    const x = Math.cos(angle) * 100 * 1.1;
    const y = Math.sin(angle) * 100 * 1.1;
    return (
      <img
        key={i}
        className={classNames(imageClassName, "h-2/6 max-w-2/6")}
        src={`/assets/images/${image}`}
        alt={image}
        style={{ transform: `translate(${x}%, ${y}%)` }}
      />
    );
  });

  return (
    <div ref={ref} className="w-full h-full relative">
      {images}
    </div>
  );
}
