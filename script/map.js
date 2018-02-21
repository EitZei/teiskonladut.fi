var api = "https://rqrvbffqa8.execute-api.eu-central-1.amazonaws.com/production/skitracks";

var map = null;

var initMap = function() {
  map = L.map('map').setView([61.6741457,23.8184606], 11);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiYWx1cGFyayIsImEiOiJjamR3bXJpNHEzYzk4MzNwMjZ6ZTBkZmd5In0.zEixa4_z_0BA5foD3_m0pA'
  }).addTo(map);
};

var initTrack = function() {
  fetch(api, { mode: 'cors' })
    .then(response => {
      if(response.ok) {
        return response.json();
      }
      throw new Error('API response was not ok.');
    })
    .then(tracks => {
      tracks.forEach(track => {
        var lengthInMeters = track.path.reduce((prev, cur) => {
          if (!prev.end) {
            prev.end = cur;
          } else {
            const c1 = L.latLng(cur);
            const c2 = L.latLng(prev.end);

            prev.end = cur;
            prev.length = prev.length + c1.distanceTo(c2);
          }

          return prev;
        }, { length: 0, end: null }).length;

        var lengthInKms = parseFloat(lengthInMeters / 1000).toFixed(1);

        var polyline = L.polyline(track.path, { color: 'blue'} ).addTo(map);
        var marker = L.marker(track.path[0], { title: track.name, color: 'blue' }).addTo(map);

        marker.bindPopup(`<b>${track.name}</b>
          <p>
            <b>Pituus</b>: ${lengthInKms} km<br>
            <b>Tyyli:</b> ${track.style}<br>
            <b>Vaikeus:</b> ${track.difficulty}
          </p>
        `);
      })
    });
}

document.addEventListener("DOMContentLoaded", function(event) {
  initMap();
  initTrack();
});