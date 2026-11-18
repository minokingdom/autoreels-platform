'use strict';

const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');
const { parseCookies } = require('./session');

const COOKIE = 'ar_admin_session';
const TTL = 3600;

function adminKey() {
  return String(process.env.ADMIN_TOKEN || '').trim();
}

function equalSecret(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

function sign(value, key) {
  return createHmac('sha256', key).update('admin-console:' + value).digest('base64url');
}

function writeCookie(req, res, value, maxAge) {
  const secure = process.env.VERCEL === '1' || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', COOKIE + '=' + value + '; Path=/api/account; HttpOnly; SameSite=Strict; Max-Age=' + maxAge + (secure ? '; Secure' : ''));
}

function openSession(req, res, key) {
  const value = Math.floor(Date.now() / 1000 + TTL) + '.' + randomBytes(16).toString('base64url');
  writeCookie(req, res, value + '.' + sign(value, key), TTL);
}

function isAdmin(req) {
  const key = adminKey();
  if (!key) return false;
  try {
    const token = parseCookies(req)[COOKIE] || '';
    if (!/^\d{10}\.[\w-]{22}\.[\w-]{43}$/u.test(token)) return false;
    const [expires, nonce, signature] = token.split('.');
    return Number(expires) > Date.now() / 1000 && equalSecret(signature, sign(expires + '.' + nonce, key));
  } catch (_) {
    return false;
  }
}

function closeSession(req, res) {
  writeCookie(req, res, '', 0);
}

module.exports = { adminKey, equalSecret, openSession, isAdmin, closeSession };
