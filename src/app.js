require('isomorphic-fetch');

import Map from './map';

document.addEventListener("DOMContentLoaded", (event) => {
  Map.initMap();
  Map.initTrack();
});