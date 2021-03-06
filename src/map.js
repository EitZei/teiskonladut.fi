import Leaflet from "leaflet";
import moment from "moment";

moment.locale("fi");

const THUMB_UP = String.fromCodePoint("0x1F44D");
const THUMB_DOWN = String.fromCodePoint("0x1F44E");

const icons = {
  blue: new Leaflet.Icon({
    iconUrl: "img/marker-icon-2x-blue.png",
    shadowUrl: "img/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  red: new Leaflet.Icon({
    iconUrl: "img/marker-icon-2x-red.png",
    shadowUrl: "img/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  green: new Leaflet.Icon({
    iconUrl: "img/marker-icon-2x-green.png",
    shadowUrl: "img/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

const api =
  "https://rqrvbffqa8.execute-api.eu-central-1.amazonaws.com/production/skitracks";

let map = null;
let featureLayer = null;
let popupOpen = false;

const initMap = () => {
  map = Leaflet.map("map").setView([61.6741457, 23.8184606], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
};

const highlightFeature = (e, color = "red") => {
  const layer = e.target;

  layer.setStyle({
    weight: 5,
    color,
    dashArray: "",
    fillOpacity: 0.7,
  });

  if (!Leaflet.Browser.ie && !Leaflet.Browser.opera && !Leaflet.Browser.edge) {
    layer.bringToFront();
  }
};

const resetHighlight = (e) => {
  const layer = e.target;

  if (popupOpen === layer) {
    return;
  }

  layer.setStyle({
    weight: 3,
    color: "blue",
    dashArray: "",
    fillOpacity: 1,
  });

  if (!Leaflet.Browser.ie && !Leaflet.Browser.opera && !Leaflet.Browser.edge) {
    layer.bringToFront();
  }
};

window.updateCondition = (trackId, condition) =>
  fetch(`${api}/${trackId}/condition/${condition}`, { method: "PUT" }).then(
    (response) => {
      if (response.ok) {
        console.log("Track condition updated successfully", trackId, condition);
        map.closePopup();
        initTrack();
      } else {
        throw new Error("Track condition update failed");
      }
    }
  );

const initTrack = () => {
  fetch(api, { mode: "cors" })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("API response was not ok.");
    })
    .then((tracks) => {
      const newFeatureLayer = Leaflet.layerGroup();
      const polylines = [];

      tracks.forEach((track) => {
        const lengthInMeters = track.path.reduce(
          (prev, cur) => {
            if (!prev.end) {
              prev.end = cur;
            } else {
              const c1 = Leaflet.latLng(cur);
              const c2 = Leaflet.latLng(prev.end);

              prev.end = cur;
              prev.length = prev.length + c1.distanceTo(c2);
            }

            return prev;
          },
          { length: 0, end: null }
        ).length;

        const lengthInKms = parseFloat(lengthInMeters / 1000).toFixed(1);

        let conditionText = "";
        let conditionColor = "blue";

        if (!track.condition.good && !track.condition.bad) {
          conditionText = "?";
          conditionColor = "blue";
        } else if (
          track.condition.good &&
          (!track.condition.bad || track.condition.good > track.condition.bad)
        ) {
          conditionText = `${THUMB_UP}${moment(
            track.condition.good
          ).fromNow()}`;
          conditionColor = "green";
        } else if (track.condition.bad && !track.condition.good) {
          conditionText = `${THUMB_DOWN}${moment(
            track.condition.bad
          ).fromNow()}`;
          conditionColor = "red";
        } else if (track.condition.bad && track.condition.good) {
          conditionText = `${THUMB_DOWN}${moment(
            track.condition.bad
          ).fromNow()} (${THUMB_UP}${moment(track.condition.good).fromNow()})`;
          conditionColor = "red";
        }

        const polyline = Leaflet.polyline(track.path, { color: "blue" }).addTo(
          newFeatureLayer
        );
        polyline.on("mouseover", (e) => highlightFeature(e, conditionColor));
        polyline.on("mouseout", resetHighlight);
        polyline.on("popupopen", (e) => {
          popupOpen = polyline;
          highlightFeature(e, conditionColor);
        });
        polyline.on("popupclose", (e) => {
          popupOpen = null;
          resetHighlight(e);
        });

        const marker = Leaflet.marker(track.path[0], {
          title: track.name,
          icon: icons[conditionColor],
        }).addTo(newFeatureLayer);

        marker.on("mouseover", (e) =>
          highlightFeature({ target: polyline }, conditionColor)
        );
        marker.on("mouseout", (e) => resetHighlight({ target: polyline }));
        marker.on("popupopen", (e) => {
          popupOpen = polyline;
          highlightFeature({ target: polyline }, conditionColor);
        });
        marker.on("popupclose", (e) => {
          popupOpen = null;
          resetHighlight({ target: polyline });
        });

        let popupText = `<b>${track.name}</b>
          <p>
            <b>Pituus</b>: ${lengthInKms > 0 ? lengthInKms + " km" : "?"}<br>
            <b>Tyyli:</b> ${track.style}<br>
            <b>Vaikeus:</b> ${track.difficulty}<br>
            <b>Kunto:</b> ${conditionText}
          </p>`;

        popupText += `<p>
          Missä kunnossa latu on?</br>

          <button class="button condition" onClick="updateCondition('${track.id}', 'good')">${THUMB_UP}</button>
          <button class="button condition" onClick="updateCondition('${track.id}', 'bad')">${THUMB_DOWN}</button>
        </p>`;

        marker.bindPopup(popupText);
        polyline.bindPopup(popupText);

        polylines.push(polyline);
      });

      if (featureLayer) {
        map.removeLayer(featureLayer);
        featureLayer = null;
      } else {
        const group = new Leaflet.featureGroup(polylines);
        map.fitBounds(group.getBounds());
      }

      featureLayer = newFeatureLayer;
      featureLayer.addTo(map);
    });
};

module.exports = {
  initMap,
  initTrack,
};
