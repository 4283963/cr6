const BASE_URL = '/api';

function request(url, options = {}) {
  const { method = 'GET', headers = {}, body, ...rest } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    ...rest
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    config.body = JSON.stringify(body);
  }

  return fetch(`${BASE_URL}${url}`, config).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  });
}

request.get = (url, params) => {
  let query = '';
  if (params) {
    query = '?' + new URLSearchParams(params).toString();
  }
  return request(url + query, { method: 'GET' });
};

request.post = (url, body) => {
  return request(url, { method: 'POST', body });
};

request.put = (url, body) => {
  return request(url, { method: 'PUT', body });
};

request.delete = (url) => {
  return request(url, { method: 'DELETE' });
};

export default request;
