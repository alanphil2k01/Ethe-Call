const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
    key: fs.readFileSync("./https-cert-key.pem"),
    cert: fs.readFileSync("./https-cert.pem")
};

app.prepare().then(() => {
    createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`ready - started server on url: https://${hostname}:${port}`);
    });
});

