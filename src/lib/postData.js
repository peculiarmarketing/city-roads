import request from './request.js';
import Progress from './Progress.js';

// Peculiar People: checked 7 Oct 2026. osm.jp has a broken TLS certificate,
// mail.ru and openstreetmap.ru were failing.
let backends = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

const RETRIES_PER_SERVER = 3;

export default function postData(data, progress) {
  progress = progress || new Progress();
  const postData = {
    method: 'POST',
    responseType: 'json',
    progress,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: 'data=' + encodeURIComponent(data),
  };

  let serverIndex = 0;
  let attempt = 0;

  return fetchFrom(backends[serverIndex]);

  function fetchFrom(overpassUrl) {
    return request(overpassUrl, postData, 'POST')
      .catch(handleError);
  }

  function handleError(err) {
    if (err.cancelled) throw err;

    // A busy server (429/503/504) usually answers a few seconds later.
    if ([429, 503, 504].includes(err.statusError) && attempt < RETRIES_PER_SERVER - 1) {
      attempt += 1;
      return new Promise(resolve => setTimeout(resolve, 10000 * attempt))
        .then(() => fetchFrom(backends[serverIndex]));
    }
    attempt = 0;

    if (serverIndex >= backends.length - 1) {
      // we can't do much anymore - all servers failed
      err.allServersFailed = true;
      err.serversAttempted = backends.length;
      throw err;
    }

    if (err.statusError) {
      progress.notify({
        loaded: -1
      });
    }

    serverIndex += 1;
    return fetchFrom(backends[serverIndex])
  }
}