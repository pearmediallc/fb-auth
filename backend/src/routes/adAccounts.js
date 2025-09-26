const express = require('express');
const axios = require('axios');
const { pool } = require('../db/init');
const { decryptToken } = require('../utils/crypto');

const router = express.Router();

const META_GRAPH_VERSION = 'v18.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

async function getUserToken(userId) {
  const result = await pool.query(
    'SELECT access_token FROM user_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('No token found');
  }
  
  return decryptToken(result.rows[0].access_token);
}

router.get('/ad-accounts', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const cacheResult = await pool.query(
      'SELECT account_data, cached_at FROM ad_accounts_cache WHERE user_id = $1 ORDER BY cached_at DESC LIMIT 1',
      [req.session.userId]
    );
    
    const cacheAge = cacheResult.rows.length > 0 
      ? Date.now() - new Date(cacheResult.rows[0].cached_at).getTime()
      : Infinity;
    
    if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
      return res.json(cacheResult.rows[0].account_data);
    }
    
    const accessToken = await getUserToken(req.session.userId);
    
    const response = await axios.get(`${META_GRAPH_URL}/me/adaccounts`, {
      params: {
        fields: 'id,name,account_status,currency,timezone_name,business,spend_cap,amount_spent,balance,owner,funding_source,business_name,account_id',
        access_token: accessToken,
        limit: 100
      }
    });
    
    const adAccounts = response.data.data.map(account => ({
      id: account.id,
      account_id: account.account_id,
      name: account.name,
      status: getAccountStatus(account.account_status),
      currency: account.currency,
      timezone: account.timezone_name,
      role: account.business?.name || 'Direct Access',
      spend_cap: account.spend_cap,
      amount_spent: account.amount_spent,
      balance: account.balance,
      owner: account.owner,
      funding_source: account.funding_source,
      business_name: account.business_name
    }));
    
    await pool.query(
      'INSERT INTO ad_accounts_cache (user_id, account_data) VALUES ($1, $2)',
      [req.session.userId, JSON.stringify({ accounts: adAccounts })]
    );
    
    res.json({ accounts: adAccounts });
    
  } catch (error) {
    console.error('Get ad accounts error:', error);
    if (error.response?.data?.error?.code === 190) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(500).json({ error: 'Failed to fetch ad accounts' });
  }
});

router.post('/sync', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    await pool.query(
      'DELETE FROM ad_accounts_cache WHERE user_id = $1',
      [req.session.userId]
    );
    
    const accessToken = await getUserToken(req.session.userId);
    
    const response = await axios.get(`${META_GRAPH_URL}/me/adaccounts`, {
      params: {
        fields: 'id,name,account_status,currency,timezone_name,business,spend_cap,amount_spent,balance,owner,funding_source,business_name,account_id',
        access_token: accessToken,
        limit: 100
      }
    });
    
    const adAccounts = response.data.data.map(account => ({
      id: account.id,
      account_id: account.account_id,
      name: account.name,
      status: getAccountStatus(account.account_status),
      currency: account.currency,
      timezone: account.timezone_name,
      role: account.business?.name || 'Direct Access',
      spend_cap: account.spend_cap,
      amount_spent: account.amount_spent,
      balance: account.balance,
      owner: account.owner,
      funding_source: account.funding_source,
      business_name: account.business_name
    }));
    
    await pool.query(
      'INSERT INTO ad_accounts_cache (user_id, account_data) VALUES ($1, $2)',
      [req.session.userId, JSON.stringify({ accounts: adAccounts })]
    );
    
    res.json({ accounts: adAccounts, synced: true });
    
  } catch (error) {
    console.error('Sync ad accounts error:', error);
    if (error.response?.data?.error?.code === 190) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(500).json({ error: 'Failed to sync ad accounts' });
  }
});

function getAccountStatus(status) {
  const statusMap = {
    1: 'Active',
    2: 'Disabled',
    3: 'Unsettled',
    7: 'Pending Risk Review',
    8: 'Pending Settlement',
    9: 'In Grace Period',
    100: 'Pending Closure',
    101: 'Closed',
    201: 'Any Active',
    202: 'Any Closed'
  };
  return statusMap[status] || 'Unknown';
}

module.exports = router;