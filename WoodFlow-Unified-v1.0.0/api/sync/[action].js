// Vercel Serverless Function - Sync API with Supabase
// Path: /api/sync/[action].js

import { createClient } from '@supabase/supabase-js';

// إعداد Supabase (سيتم ضبطها من متغيرات البيئة)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// إعداد CORS
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // تحقق من إعداد Supabase
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Database configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
    });
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'save':
        return await handleSave(req, res);
      case 'load':
        return await handleLoad(req, res);
      case 'check':
        return await handleCheck(req, res);
      case 'delete':
        return await handleDelete(req, res);
      case 'stats':
        return await handleStats(req, res);
      default:
        return res.status(404).json({
          success: false,
          error: 'Unknown action: ' + action
        });
    }
  } catch (error) {
    console.error('Sync API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}

// حفظ البيانات
async function handleSave(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, companyId, dataType, data } = req.body;

  if (!userId || !companyId || !dataType || !data) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, companyId, dataType, data'
    });
  }

  // إدراج أو تحديث البيانات
  const { data: result, error } = await supabase
    .from('sync_data')
    .upsert({
      user_id: userId,
      company_id: companyId,
      data_type: dataType,
      data_content: JSON.stringify(data),
      last_modified: new Date().toISOString()
    }, {
      onConflict: 'user_id,company_id,data_type'
    });

  if (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to save data: ' + error.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Data saved successfully',
    timestamp: new Date().toISOString()
  });
}

// تحميل البيانات
async function handleLoad(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, companyId, dataType } = req.query;

  if (!userId || !companyId || !dataType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: userId, companyId, dataType'
    });
  }

  const { data, error } = await supabase
    .from('sync_data')
    .select('data_content, version, last_modified')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('data_type', dataType)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    return res.status(500).json({
      success: false,
      error: 'Failed to load data: ' + error.message
    });
  }

  if (!data) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No data found'
    });
  }

  return res.status(200).json({
    success: true,
    data: JSON.parse(data.data_content),
    version: data.version,
    lastModified: data.last_modified
  });
}

// التحقق من التحديثات
async function handleCheck(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, companyId, dataType, lastVersion } = req.query;

  if (!userId || !companyId || !dataType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  const { data, error } = await supabase
    .from('sync_data')
    .select('version, last_modified')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('data_type', dataType)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({
      success: false,
      error: 'Failed to check for updates: ' + error.message
    });
  }

  const currentVersion = data ? data.version : 0;
  const hasUpdate = currentVersion > parseInt(lastVersion || 0);

  return res.status(200).json({
    success: true,
    hasUpdate,
    currentVersion,
    lastModified: data ? data.last_modified : null
  });
}

// حذف البيانات
async function handleDelete(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, companyId, dataType } = req.body;

  if (!userId || !companyId || !dataType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  const { error } = await supabase
    .from('sync_data')
    .delete()
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('data_type', dataType);

  if (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete data: ' + error.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Data deleted successfully'
  });
}

// إحصائيات النظام
async function handleStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // عدد السجلات الإجمالي
    const { count: totalRecords } = await supabase
      .from('sync_data')
      .select('*', { count: 'exact', head: true });

    // عدد المستخدمين الفريدين
    const { data: usersData } = await supabase
      .from('sync_data')
      .select('user_id');
    
    const uniqueUsers = new Set(usersData?.map(row => row.user_id) || []).size;

    // عدد الشركات الفريدة
    const { data: companiesData } = await supabase
      .from('sync_data')
      .select('company_id');
    
    const uniqueCompanies = new Set(companiesData?.map(row => row.company_id) || []).size;

    return res.status(200).json({
      success: true,
      stats: {
        totalRecords: totalRecords || 0,
        uniqueUsers,
        uniqueCompanies,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get stats: ' + error.message
    });
  }
}