import {createServer } from "https";
import {parse } from "url";
import next from "next";
import fs from "fs";

const port = 443;
const app = next({ dev: false });
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
        console.log("ready - started server on url: https://localhost:" + port);
    });
});

