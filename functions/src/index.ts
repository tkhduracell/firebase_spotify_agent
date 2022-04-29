import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import * as cookieParser from "cookie-parser";
import fetch from "node-fetch";
import * as crypto from "crypto";

require("firebase-functions/lib/logger/compat");

const client_id = process.env.CLIENT_ID ?? "";
const client_secret = process.env.CLIENT_SECRET ?? "";
const redirect_self_uri = process.env.REDIRECT_SELF_URL ?? "";
const redirect_uri = process.env.REDIRECT_URL ?? "";
const cors_origin = process.env.CORS_ORIGIN ?? "";
const state_key = "spotify_auth_state";
const page_key = "page"

const app = express()
    .use(cors({ origin: [ cors_origin ] }))
    .use(cookieParser());


function random(length: number) {
    return crypto.randomBytes(Math.round(length / 2)).toString("hex");
}

function stringify(data: Record<string, string>): string {
    return new URLSearchParams(data).toString();
}

function b64(data: string): string {
    return Buffer.from(data, "utf8").toString("base64");
}

app.get("/", async function(req, res) {
    res.redirect(redirect_self_uri + "/login");
});

app.get("/login", async function(req, res) {
    const state = random(32);
    const { page } = req.query
    res.cookie(state_key, state, { maxAge: 1000 * 60 * 10, httpOnly: true, secure: true, sameSite: 'strict' });
    res.cookie(page_key, page, { maxAge: 1000 * 60 * 10, httpOnly: true, secure: true, sameSite: 'strict' });

    const scope = [
        "user-read-private",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-read-recently-played",
        "playlist-read-collaborative",
        "playlist-read-private",
        "playlist-modify-private",
        "streaming",
    ].join(" ");

    res.redirect("https://accounts.spotify.com/authorize?" + stringify({
        response_type: "code",
        client_id,
        scope,
        redirect_uri: redirect_self_uri + "/callback",
        state,
    }));
});

app.get("/callback", async function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    const {code, state} = req.query;
    const storedState = req.cookies ? req.cookies[state_key] : null;
    const page = req.cookies ? req.cookies[page_key] : null;

    console.warn({ actual: state, expected: storedState })
    if (state === null || state !== storedState) {
        res.redirect(redirect_uri + "?" + stringify({error: "state_mismatch"}));
    } else {
        res.clearCookie(state_key);

        const token = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            body: stringify({
                code: code as unknown as string ?? "",
                redirect_uri: redirect_self_uri + "/callback",
                grant_type: "authorization_code",
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + b64(client_id + ":" + client_secret),
            },
        });

        if (token.ok) {
            const resp = await token.json();
            res.redirect(redirect_uri + "?" + stringify({ ...resp, page }));
        } else {
            res.redirect(redirect_uri + "?" + stringify({error: "invalid_token"}));
        }
    }
});

app.get("/refresh_token", async function(req, res) {
    const {refresh_token} = req.query;

    const resp = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        body: stringify({
            grant_type: "refresh_token",
            refresh_token: refresh_token as unknown as string,
        }),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + b64(client_id + ":" + client_secret),
        },
    });

    if (resp.ok) {
        const all = await resp.json() as { access_token: string };
        res.send(all);
    } else {
        res.send({error: "invalid_token"});
    }
});


// Expose Express API as a single Cloud Function:
export const spotify_agent_auth = functions
    .region("europe-west1")
    .https
    .onRequest(app);
