import "dotenv/config";
import sharp from "sharp";
import { join } from "path";
import { renderToStaticMarkup } from "react-dom/server";
import config from "../lib/config";
import VIcon, { VIconProps } from "../app/components/v-icon";

type Props = VIconProps & { name: string };

const generateIcon = async (props: Props, format: "png") => {
  const name = `${props.name}-${props.w}.${format}`;
  const input = renderToStaticMarkup(VIcon(props));
  const output = join(__dirname, `../public/assets/icons/${name}`);

  console.log(`Generating ${name}...`);

  await sharp(Buffer.from(input)).toFormat(format).toFile(output);
};

async function generate() {
  const sizes = config.iconSizes;
  const colors: Pick<Props, "bgColor" | "lineColor" | "name">[] = [
    {
      name: "icon",
      bgColor: "transparent",
      lineColor: "#be185d"
    },
    // {
    //   name: "icon-dark",
    //   bgColor: "#0e131f",
    //   lineColor: "#4f46e5"
    // },
    // {
    //   name: "icon-white",
    //   bgColor: "#ffffff",
    //   lineColor: "#4f46e5"
    // },
    // {
    //   name: "icon-accent",
    //   bgColor: "#4f46e5",
    //   lineColor: "#ffffff"
    // }
  ];
  const props: Props[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      props.push({ ...color, w: size, h: size });
    }
  }

  for (const prop of props) {
    await generateIcon(prop, "png");
  }
}

generate();
