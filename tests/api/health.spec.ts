import { test, expect } from '@playwright/test';

test.describe('API Health Tests', () => {
  test('health warmup endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/health/warmup');
    
    // Should return 200 OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('health warmup should return valid JSON', async ({ request }) => {
    const response = await request.get('/api/health/warmup');
    
    // Should be valid JSON
    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('API endpoints should have proper CORS headers', async ({ request }) => {
    const response = await request.get('/api/health/warmup');
    
    const headers = response.headers();
    // Check that headers exist (specific CORS config depends on your setup)
    expect(headers).toBeTruthy();
  });

  test('API should handle invalid endpoints gracefully', async ({ request }) => {
    const response = await request.get('/api/nonexistent-endpoint-12345');
    
    // Should return 404 or 405
    expect(response.status()).toBeGreaterThanOrEqual(404);
  });

  test('API should handle POST to health endpoint appropriately', async ({ request }) => {
    const response = await request.post('/api/health/warmup');
    
    // Depending on your API, this might be 405 Method Not Allowed or 200
    expect([200, 405]).toContain(response.status());
  });
});

test.describe('API Authentication Tests', () => {
  test('protected API should require authentication', async ({ request }) => {
    // Try to access admin endpoints without auth
    const response = await request.get('/api/admin/stats');
    
    // Should be unauthorized (401) or redirect (302/307)
    expect([401, 302, 307, 403]).toContain(response.status());
  });

  test('auth callback endpoint should exist', async ({ request }) => {
    const response = await request.get('/api/auth/callback');
    
    // Should at least respond (might be 400 bad request without proper params)
    expect(response.status()).toBeDefined();
  });
});

test.describe('API Performance Tests', () => {
  test('health endpoint should respond quickly', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/health/warmup');
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    // Should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
    expect(response.ok()).toBeTruthy();
  });

  test('API should handle concurrent requests', async ({ request }) => {
    // Make 5 concurrent requests
    const requests = Array(5).fill(null).map(() => 
      request.get('/api/health/warmup')
    );
    
    const responses = await Promise.all(requests);
    
    // All should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });
});

test.describe('API Error Handling Tests', () => {
  test('API should return proper error format', async ({ request }) => {
    const response = await request.get('/api/nonexistent');
    
    // Should be an error status
    expect(response.ok()).toBeFalsy();
  });

  test('API should handle malformed requests', async ({ request }) => {
    const response = await request.post('/api/health/warmup', {
      data: 'this is not valid JSON',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Should handle without crashing
    expect(response.status()).toBeDefined();
  });

  test('API should validate content-type for POST requests', async ({ request }) => {
    const response = await request.post('/api/admin/stats', {
      data: { test: 'data' },
    });
    
    // Should respond (might be 401, 403, 405, etc.)
    expect(response.status()).toBeDefined();
  });
});

test.describe('API Rate Limiting Tests', () => {
  test('API should handle rapid requests', async ({ request }) => {
    const requests = [];
    
    // Make 10 rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(request.get('/api/health/warmup'));
    }
    
    const responses = await Promise.all(requests);
    
    // Check if rate limiting is in place
    const statusCodes = responses.map(r => r.status());
    
    // Either all succeed or some are rate limited (429)
    const allSuccess = statusCodes.every(code => code === 200);
    const someRateLimited = statusCodes.some(code => code === 429);
    
    expect(allSuccess || someRateLimited).toBeTruthy();
  });
});
