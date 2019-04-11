const image2base64 = require("image-to-base64");
const fs = require("fs");
const pdf = require("html-pdf");
const QRCode = require("qrcode");
const request = require("request-promise");
const links = require("./airdrop-links.json");

const bitlyAccessToken = "";
const redirectParam = "&redirectId=portis-auctionity&w=portis";

main();

async function main() {
  const flyerUri = await getFlyerUri();
  createFolders();
  generate(flyerUri);
}

async function generate(flyerUri, idx = 0) {
  console.log(`processing file #${idx + 1} out of ${links.length}`);
  const link = links[idx];
  const url = link.Link + redirectParam;
  const shortUrl = await shortenUrl(url);
  const qrcode = await QRCode.toDataURL(shortUrl);
  createHTML(flyerUri, idx, shortUrl, qrcode);
  await toPDF(idx);

  if (idx == links.length - 1) {
    console.log("done");
  } else {
    generate(flyerUri, idx + 1);
  }
}

function createFolders() {
  fs.mkdirSync("./html");
  fs.mkdirSync("./pdf");
}

async function shortenUrl(longUrl) {
  const api = "https://api-ssl.bitly.com/v3/shorten";
  const domain = "bit.ly";
  const uri = `${api}?access_token=${bitlyAccessToken}&domain=${domain}&longUrl=${encodeURIComponent(
    longUrl
  )}`;
  const resp = await request({ uri, json: true });
  return resp.data.url.replace("http://", "https://");
}

async function getFlyerUri() {
  const base64 = await image2base64("./flyer.png");
  return "data:image/png;base64," + base64;
}

function createHTML(flyerUri, fileIndex, url, qrcode) {
  const html = `
    <html>
        <head>
        </head>
        <body style="margin: 0">
            <img style="position: relative; height: 445px; padding: 21px 20px;" src="${flyerUri}">
            <img style="position: absolute; top: 231px; left: 134px; width: 95px;" src="${qrcode}">
            <p style="position: absolute; top: 321px; left: 142px; font-family: monospace; font-size: 6px">${url}</p>
        </body>
    </html>
    `;

  fs.writeFileSync(`./html/${fileIndex}.html`, html, "utf8");
}

function toPDF(fileIndex) {
  const html = fs.readFileSync(`./html/${fileIndex}.html`, "utf8");
  const options = {
    height: "172mm",
    width: "128mm"
  };

  return new Promise((resolve, reject) => {
    pdf.create(html, options).toFile(`./pdf/${fileIndex}.pdf`, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
