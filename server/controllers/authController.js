const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Registers a new user with hashed password.
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Server-side validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password and save user
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), email.toLowerCase(), hashedPassword]
    );
    const newUserId = result.rows[0].id;

    const token = jwt.sign(
      { id: newUserId, name: name.trim(), email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUserId, name: name.trim(), email, role: 'user' },
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'User with this email does not exist' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit recovery code and sends it via email.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    
    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return res.json({ message: 'If this email exists, a recovery code has been sent.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const resetExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    await db.query('UPDATE users SET reset_code = $1, reset_expires = $2 WHERE id = $3', [resetCode, resetExpires, user.id]);

    const { data, error } = await resend.emails.send({
      from: 'City Transit <onboarding@resend.dev>', // Resend test sandbox domain
      to: email, // MUST be the verified identity email during Resend free trial
      subject: 'Восстановление пароля — АстанаТранзит',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
          <h2 style="color: #3b82f6;">Восстановление доступа</h2>
          <p>Здравствуйте, ${user.name}!</p>
          <p>Вы запросили сброс пароля для аккаунта <strong>${email}</strong>.</p>
          <p>Ваш секретный код подтверждения:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <strong style="font-size: 32px; letter-spacing: 4px; color: #080d1a;">${resetCode}</strong>
          </div>
          <p><em>Код действителен только 15 минут. Никому не сообщайте его.</em></p>
        </div>
      `,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return res.status(500).json({ error: 'Failed to send email: ' + error.message });
    }

    res.json({ message: 'If this email exists, a recovery code has been sent.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies code and sets new password.
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    
    if (!user || user.reset_code !== code.toString()) {
      return res.status(400).json({ error: 'Invalid or expired recovery code' });
    }

    if (Date.now() > user.reset_expires) {
      return res.status(400).json({ error: 'Recovery code has expired' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);

    await db.query(
      'UPDATE users SET password = $1, reset_code = NULL, reset_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error('[resetPassword]', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
