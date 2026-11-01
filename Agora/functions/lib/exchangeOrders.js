// VirtuaMakers Exchange 💱 checkout, part one: free ($0.00) items only
// (Chris, 2026-10-30/11-01). Every item goes through a real checkout, free
// ones too - each order is recorded and gets an emailed receipt. Paid items
// wait on the payment processor (Stripe: cards + Cash App Pay), which waits
// on Chris's bank account.
//
// Accounts, the pizza-shop way: a guest checks out with just a name, an
// email and what kind of member they are; that becomes a lightweight
// customer record (exchangeCustomers/{emailKey}); the page then offers to
// save it as a real Agora 🌐 account. A signed-in member's order is tied
// to their uid instead.
//
// Prices are never taken from the browser: the server's own FREE_ITEMS
// list decides what can be ordered and for how much.

const crypto = require("crypto");
const admin = require("firebase-admin");
const { sendEmailSafe } = require("./resend");

const SITE = "https://www.virtuamakers.com";

// id → what the receipt says and where to get it. Keep the ids in step
// with the data-cart-id attributes on the Exchange pages.
const FREE_ITEMS = {
  "dimonds": { name: "Dimonds ♦️", getUrl: "https://virtuamakers.github.io/Dimonds/", getLabel: "Play or install" },
  "si-email": { name: "SI Email ✉️", getUrl: SITE + "/si-email.html", getLabel: "Set up a mailbox" },
  "si-memory": { name: "SI Memory 🧾", getUrl: SITE + "/si-memory.html", getLabel: "Open a vault" },
  "si-apartment": { name: "SI Apartment 🏢", getUrl: SITE + "/si-apartment.html", getLabel: "Download the app" },
  "calendar": { name: "VirtuaMakers Calendar 🗓️", getUrl: SITE + "/Agora/member.html", getLabel: "Open it on your profile" },
};

const KINDS = ["Human", "Cyborg", "AI"]; // stored value; shown as "SI"
const MAX_QTY = 10;

function emailKey(email) {
  return crypto.createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 40);
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Checks the order and returns { error } or { lines, name, email, kind }.
function readOrder(body, user) {
  const clip = (value, n) => (typeof value === "string" ? value.trim().slice(0, n) : "");
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const lines = [];
  for (const raw of rawItems) {
    const id = clip(raw && raw.id, 60);
    const item = FREE_ITEMS[id];
    if (!item) {
      return { error: "Only free items can be checked out for now – paid checkout opens soon." };
    }
    const qty = Math.max(1, Math.min(MAX_QTY, parseInt(raw.qty, 10) || 1));
    const existing = lines.find((l) => l.id === id);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else lines.push({ id, name: item.name, qty, priceUsd: 0 });
  }
  if (lines.length === 0) return { error: "Your Bag has nothing to check out." };

  const name = clip(body.name, 80);
  const email = user && user.email ? user.email : clip(body.email, 200);
  const kind = KINDS.indexOf(body.kind) !== -1 ? body.kind : "";
  if (!name) return { error: "Add the name the receipt should go to." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn't look right." };
  if (!kind) return { error: "Choose Human, Cyborg or SI." };
  return { lines, name, email, kind };
}

// Receipts go to an address the visitor typed, so throttle hard enough
// that the form can't be used to spam strangers: per IP, per address and
// for the whole Exchange each day.
async function allowOrder(db, ip, email) {
  const day = new Date().toISOString().slice(0, 10);
  const hour = new Date().toISOString().slice(0, 13);
  const ipRef = db.collection("exchangeOrderThrottle").doc("ip-" + crypto.createHash("sha256").update("exchange:" + ip).digest("hex").slice(0, 32));
  const emailRef = db.collection("exchangeOrderThrottle").doc("email-" + emailKey(email));
  const dayRef = db.collection("exchangeOrderThrottle").doc("day-" + day);
  return db.runTransaction(async (tx) => {
    const [ipSnap, emailSnap, daySnap] = await Promise.all([tx.get(ipRef), tx.get(emailRef), tx.get(dayRef)]);
    const ipCount = ipSnap.exists && ipSnap.data().hour === hour ? ipSnap.data().count : 0;
    const emailCount = emailSnap.exists && emailSnap.data().day === day ? emailSnap.data().count : 0;
    const dayCount = daySnap.exists ? daySnap.data().count : 0;
    if (ipCount >= 5 || emailCount >= 5 || dayCount >= 300) return false;
    tx.set(ipRef, { hour, count: ipCount + 1 });
    tx.set(emailRef, { day, count: emailCount + 1 });
    tx.set(dayRef, { count: dayCount + 1 });
    return true;
  });
}

function receiptHtml(orderId, order, when) {
  const rows = order.lines.map((l) => {
    const item = FREE_ITEMS[l.id];
    return `<tr>
      <td style="padding:8px 12px 8px 0;border-bottom:1px solid #e3ecef;">${esc(l.name)}${l.qty > 1 ? " × " + l.qty : ""}<br />
        <a href="${esc(item.getUrl)}" style="color:#1f6fd1;font-size:13px;">${esc(item.getLabel)} →</a></td>
      <td style="padding:8px 0;border-bottom:1px solid #e3ecef;text-align:right;white-space:nowrap;">$0.00</td>
    </tr>`;
  }).join("");
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f8fa;font-family:Arial,Helvetica,sans-serif;color:#1d2b30;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;">
    <p style="margin:0 0 4px;font-size:13px;color:#5f7178;">VirtuaMakers Exchange 💱</p>
    <h1 style="margin:0 0 16px;font-size:22px;">Your receipt</h1>
    <p style="margin:0 0 16px;">Thank you, ${esc(order.name)}! Everything below is yours – each one links to where you get it.</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">${rows}
      <tr><td style="padding:10px 12px 0 0;font-weight:bold;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:bold;">$0.00</td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#5f7178;">Order ${esc(orderId)} · ${esc(when)}<br />
      Questions? Just reply, or write to <a href="mailto:Admin@virtuamakers.com" style="color:#1f6fd1;">Admin@virtuamakers.com</a>.</p>
    <p style="margin:12px 0 0;font-size:13px;color:#5f7178;"><a href="${SITE}/Agora/exchange.html" style="color:#1f6fd1;">Back to the Exchange</a></p>
  </div></body></html>`;
}

// The HTTP handler (wrapped in withCors by index.js).
async function placeOrder(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only." });
    return;
  }
  const body = req.body || {};

  // A signed-in member sends their Firebase ID token; a guest sends none.
  let user = null;
  const auth = String(req.headers.authorization || "");
  if (auth.startsWith("Bearer ")) {
    try {
      const decoded = await admin.auth().verifyIdToken(auth.slice(7));
      user = { uid: decoded.uid, email: decoded.email || "" };
    } catch (err) {
      res.status(401).json({ error: "Your sign-in has expired – sign in again, or check out as a guest." });
      return;
    }
  }

  const order = readOrder(body, user);
  if (order.error) {
    res.status(400).json({ error: order.error });
    return;
  }

  const db = admin.firestore();
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
  if (!(await allowOrder(db, ip, order.email))) {
    res.status(429).json({ error: "Too many orders just now – please try again later, or write to Admin@virtuamakers.com." });
    return;
  }

  const key = emailKey(order.email);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const orderRef = db.collection("exchangeOrders").doc();
  const customerRef = db.collection("exchangeCustomers").doc(key);
  await db.runTransaction(async (tx) => {
    const customer = await tx.get(customerRef);
    tx.set(orderRef, {
      lines: order.lines,
      totalUsd: 0,
      name: order.name,
      email: order.email,
      emailKey: key,
      kind: order.kind,
      uid: user ? user.uid : null,
      status: "complete",
      createdAt: now,
    });
    tx.set(customerRef, {
      name: order.name,
      email: order.email,
      kind: order.kind,
      uid: user ? user.uid : (customer.exists ? customer.data().uid || null : null),
      orderCount: (customer.exists ? customer.data().orderCount || 0 : 0) + 1,
      firstOrderAt: customer.exists ? customer.data().firstOrderAt || now : now,
      lastOrderAt: now,
    }, { merge: true });
  });

  const when = new Date().toUTCString().replace("GMT", "UTC");
  await sendEmailSafe({
    from: "VirtuaMakers Exchange <exchange@virtuamakers.com>",
    replyTo: "Admin@virtuamakers.com",
    to: order.email,
    subject: "Your VirtuaMakers Exchange 💱 receipt ($0.00)",
    html: receiptHtml(orderRef.id, order, when),
  });

  res.status(200).json({ success: true, orderId: orderRef.id, signedIn: !!user });
}

module.exports = { FREE_ITEMS, placeOrder, readOrder };
