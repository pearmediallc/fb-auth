const express = require('express');
const axios = require('axios');
const { pool } = require('../db/init');
const { encryptToken } = require('../utils/crypto');

const router = express.Router();

const META_GRAPH_VERSION = 'v18.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

router.get('/login', (req, res) => {
  const scopes = 'public_profile,ads_read,business_management,pages_show_list';
  const authUrl = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?` +
    `client_id=${process.env.META_APP_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI)}&` +
    `scope=${scopes}&` +
    `response_type=code`;
  
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
  }
  
  try {
    const tokenResponse = await axios.get(`${META_GRAPH_URL}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.OAUTH_REDIRECT_URI,
        code
      }
    });
    
    const { access_token, token_type, expires_in } = tokenResponse.data;
    
    const userResponse = await axios.get(`${META_GRAPH_URL}/me`, {
      params: {
        fields: 'id,name,email',
        access_token
      }
    });
    
    const userData = userResponse.data;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let userResult = await client.query(
        'SELECT id FROM users WHERE meta_user_id = $1',
        [userData.id]
      );
      
      let userId;
      if (userResult.rows.length === 0) {
        const insertResult = await client.query(
          'INSERT INTO users (meta_user_id, name, email) VALUES ($1, $2, $3) RETURNING id',
          [userData.id, userData.name, userData.email]
        );
        userId = insertResult.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
        await client.query(
          'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [userData.name, userData.email, userId]
        );
      }
      
      const encryptedToken = encryptToken(access_token);
      const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
      
      await client.query(
        'DELETE FROM user_tokens WHERE user_id = $1',
        [userId]
      );
      
      await client.query(
        'INSERT INTO user_tokens (user_id, access_token, token_type, expires_at) VALUES ($1, $2, $3, $4)',
        [userId, encryptedToken, token_type, expiresAt]
      );
      
      await client.query('COMMIT');
      
      req.session.userId = userId;
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const result = await pool.query(
      'SELECT id, meta_user_id, name, email FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;