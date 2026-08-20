require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

if (!accountSid || !authToken || !twilioPhone) {
  console.error('Configure o arquivo .env com suas credenciais Twilio');
  process.exit(1);
}

const client = twilio(accountSid, authToken);
const CODE_LENGTH = 6;
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const codes = new Map();
const WHITELIST_FILE = path.join(__dirname, 'whitelist.json');

function loadWhitelist() {
  try {
    if (fs.existsSync(WHITELIST_FILE)) {
      return JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function saveWhitelist(list) {
  fs.writeFileSync(WHITELIST_FILE, JSON.stringify(list, null, 2));
}

function isAuthorized(phone) {
  return loadWhitelist().includes(phone);
}

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: 'Chave admin invalida' });
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// === ADMIN: gerenciar numeros autorizados ===

app.get('/api/admin/whitelist', adminAuth, (_req, res) => {
  res.json({ ok: true, numbers: loadWhitelist() });
});

app.post('/api/admin/whitelist/add', adminAuth, (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ ok: false, error: 'Telefone obrigatorio' });
  }
  const list = loadWhitelist();
  if (list.includes(phone)) {
    return res.json({ ok: true, status: 'already_exists' });
  }
  list.push(phone);
  saveWhitelist(list);
  console.log(`Autorizado: ${phone}`);
  res.json({ ok: true, status: 'added' });
});

app.post('/api/admin/whitelist/remove', adminAuth, (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ ok: false, error: 'Telefone obrigatorio' });
  }
  let list = loadWhitelist();
  list = list.filter((p) => p !== phone);
  saveWhitelist(list);
  console.log(`Removido: ${phone}`);
  res.json({ ok: true, status: 'removed' });
});

// === OTP: envio e verificacao ===

app.post('/api/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ ok: false, error: 'Telefone obrigatorio' });
  }

  if (!isAuthorized(phone)) {
    return res.json({ ok: false, status: 'not_authorized' });
  }

  const existing = codes.get(phone);
  if (existing && Date.now() - existing.createdAt < 30000) {
    return res.json({ ok: true, status: 'already_sent' });
  }

  const code = generateCode();
  codes.set(phone, {
    code,
    createdAt: Date.now(),
    attempts: 0,
    verified: false,
  });

  try {
    await client.messages.create({
      body: `Seu codigo de verificacao e: ${code}. Validade: 5 minutos.`,
      from: twilioPhone,
      to: phone,
    });
    console.log(`SMS enviado para ${phone}: ${code}`);
    res.json({ ok: true, status: 'sent' });
  } catch (err) {
    console.error('Erro ao enviar SMS:', err.message);
    codes.delete(phone);
    res.status(500).json({ ok: false, error: 'Falha ao enviar SMS' });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ ok: false, error: 'Telefone e codigo obrigatorios' });
  }

  const record = codes.get(phone);
  if (!record) {
    return res.json({ ok: false, status: 'not_found' });
  }

  if (record.verified) {
    codes.delete(phone);
    return res.json({ ok: true, status: 'approved' });
  }

  if (Date.now() - record.createdAt > CODE_TTL_MS) {
    codes.delete(phone);
    return res.json({ ok: false, status: 'expired' });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    codes.delete(phone);
    return res.json({ ok: false, status: 'max_attempts' });
  }

  if (record.code !== code) {
    record.attempts += 1;
    return res.json({ ok: false, status: 'invalid' });
  }

  record.verified = true;
  return res.json({ ok: true, status: 'approved' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Admin key: ${ADMIN_KEY}`);
  console.log(`Whitelist: ${WHITELIST_FILE}`);
});
