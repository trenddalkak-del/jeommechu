import { batchGetPhotos } from "./src/lib/google-places";

async function main() {
  const res = await batchGetPhotos([
    { place_name: "홍뎀", address_name: "서울" },
    { place_name: "맥앤치즈", address_name: "서울" },
  ]);
  console.log(res);
}
main();
