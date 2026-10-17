/**
 * IndexNow Integration for Medikart.pk
 * Submits URL changes directly to Microsoft Bing, Yandex, Seznam, and IndexNow network.
 */

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'b76ac79c65b745efb4dd58e5ec9cfcee';
export const SITE_HOST = 'medikart.pk';
export const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;

/**
 * Submit an array of URLs to the IndexNow protocol
 * @param {string[]} urlList - List of full URLs to submit (up to 10,000 URLs per call)
 * @returns {Promise<{ success: boolean, status: number, endpoint: string, message: string }>}
 */
export async function submitToIndexNow(urlList) {
  if (!urlList || !Array.isArray(urlList) || urlList.length === 0) {
    return { success: false, message: 'No URLs provided for submission.' };
  }

  // Ensure URLs are unique and formatted with https://medikart.pk
  const cleanUrls = Array.from(new Set(
    urlList.map(u => {
      if (u.startsWith('http')) return u;
      return `https://${SITE_HOST}${u.startsWith('/') ? '' : '/'}${u}`;
    })
  ));

  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: cleanUrls,
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      // IndexNow returns 200 (OK), 202 (Accepted), or 400/403/422 on failure
      const isOk = res.status === 200 || res.status === 202;
      results.push({
        endpoint,
        status: res.status,
        success: isOk,
        statusText: res.statusText,
      });
    } catch (err) {
      results.push({
        endpoint,
        status: 0,
        success: false,
        error: err.message,
      });
    }
  }

  const overallSuccess = results.some(r => r.success);
  return {
    success: overallSuccess,
    submittedCount: cleanUrls.length,
    results,
  };
}
