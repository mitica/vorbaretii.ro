import "dotenv/config";
import sharp from "sharp";
import { extname, join } from "path";
import config from "../lib/config";
import { readdir } from "fs/promises";

type Props = { name: string; w?: number };

const generateIcon = async (props: Props) => {
  const format = extname(props.name);
  const name = `${props.name.substring(0, props.name.length - format.length)}${
    props.w ? `-${props.w}` : ""
  }${format}`;

  const output = join(__dirname, `../public/assets/images/${name}`);
  const input = join(__dirname, "../assets/images", props.name);
  console.log(`Generating ${input}`);

  const f = sharp(input);
  if (props.w) f.resize({ fit: "contain", width: props.w });

  await f
    .jpeg({ progressive: true, force: false })
    .png({ progressive: true, force: false })
    .toFile(output);
};

async function generate() {
  const sizes = config.imageSizes;

  const props: Props[] = [];

  const images = await readdir(join(__dirname, "../assets/images"));

  for (const size of sizes) {
    images.forEach((name) => props.push({ w: size, name }));
  }
  images.forEach((name) => props.push({ name }));

  for (const prop of props) {
    await generateIcon(prop);
  }
}

generate();
