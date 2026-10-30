import {
  Viewer,
  Cartesian3,
  Color,
  CallbackProperty,
  PolylineGlowMaterialProperty,
  VerticalOrigin,
  HorizontalOrigin,
  DistanceDisplayCondition,
  Math as CesiumMath,
  UrlTemplateImageryProvider,
  ScreenSpaceEventType
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";

const nodes = [
  { name: "Singapore", city: "新加坡", lon: 103.8198, lat: 1.3521, gpu: 320, status: "online" },
  { name: "Tokyo", city: "东京", lon: 139.6917, lat: 35.6895, gpu: 420, status: "busy" },
  { name: "Shanghai", city: "上海", lon: 121.4737, lat: 31.2304, gpu: 560, status: "online" },
  { name: "Frankfurt", city: "法兰克福", lon: 8.6821, lat: 50.1109, gpu: 380, status: "online" },
  { name: "London", city: "伦敦", lon: -0.1276, lat: 51.5072, gpu: 240, status: "idle" },
  { name: "Virginia", city: "弗吉尼亚", lon: -77.436, lat: 37.5407, gpu: 360, status: "busy" },
  { name: "California", city: "加利福尼亚", lon: -121.8863, lat: 37.3382, gpu: 120, status: "idle" },
  { name: "São Paulo", city: "圣保罗", lon: -46.6333, lat: -23.5505, gpu: 80, status: "online" }
];

const dispatches = [
  { from: "上海", to: "新加坡", workload: "LLM INFERENCE", id: "DSP-2048", amount: "64 GPU" },
  { from: "东京", to: "法兰克福", workload: "MODEL TRAINING", id: "DSP-2047", amount: "128 GPU" },
  { from: "弗吉尼亚", to: "伦敦", workload: "VIDEO GENERATION", id: "DSP-2046", amount: "32 GPU" }
];

const viewer = new Viewer("globe", {
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  infoBox: false,
  selectionIndicator: false,
  fullscreenButton: false,
  vrButton: false,
  shouldAnimate: true,
  imageryProvider: new UrlTemplateImageryProvider({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    credit: "Esri, Maxar, Earthstar Geographics"
  })
});

// Add geographic labels and boundaries above the satellite imagery.
viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
  url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  credit: "Esri"
}));

const scene = viewer.scene;
scene.backgroundColor = Color.fromCssColorString("#080d14");
scene.globe.baseColor = Color.fromCssColorString("#18232b");
scene.globe.show = true;
scene.globe.enableLighting = true;
scene.globe.showGroundAtmosphere = true;
scene.skyAtmosphere.show = true;
scene.fog.enabled = true;
scene.fog.density = 0.00012;
scene.screenSpaceCameraController.minimumZoomDistance = 650000;
scene.screenSpaceCameraController.maximumZoomDistance = 26000000;
viewer.cesiumWidget.creditContainer.style.display = "none";

viewer.camera.setView({
  destination: Cartesian3.fromDegrees(112, 23, 20500000),
  orientation: { heading: CesiumMath.toRadians(12), pitch: CesiumMath.toRadians(-90), roll: 0 }
});

const statusColor = {
  online: Color.fromCssColorString("#75d6bd"),
  busy: Color.fromCssColorString("#f0bd76"),
  idle: Color.fromCssColorString("#8ba7c2")
};

nodes.forEach((node) => {
  const point = Cartesian3.fromDegrees(node.lon, node.lat, 18000);
  viewer.entities.add({
    name: node.city,
    position: point,
    point: {
      pixelSize: 9,
      color: statusColor[node.status],
      outlineColor: Color.fromCssColorString("#e9f4ff").withAlpha(0.9),
      outlineWidth: 1.5,
      disableDepthTestDistance: 0
    },
    label: {
      text: node.city.toUpperCase(),
      font: "11px Inter, sans-serif",
      fillColor: Color.fromCssColorString("#dce9f2"),
      outlineColor: Color.fromCssColorString("#07111b"),
      outlineWidth: 3,
      style: 2,
      pixelOffset: new Cartesian3(0, -19, 0),
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.BOTTOM,
      distanceDisplayCondition: new DistanceDisplayCondition(0, 15000000)
    },
    description: `<b>${node.city}</b><br/>GPU：${node.gpu}<br/>状态：${node.status}`
  });
  viewer.entities.add({
    position: point,
    ellipse: {
      semiMinorAxis: 42000,
      semiMajorAxis: 42000,
      material: statusColor[node.status].withAlpha(0.12),
      outline: true,
      outlineColor: statusColor[node.status].withAlpha(0.45),
      height: 18000
    }
  });
});

function arcPositions(from, to, height = 1100000) {
  const start = Cartesian3.fromDegrees(from.lon, from.lat);
  const end = Cartesian3.fromDegrees(to.lon, to.lat);
  const distance = Cartesian3.distance(start, end);
  const steps = Math.max(48, Math.min(100, Math.round(distance / 150000)));
  const positions = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = from.lon + (to.lon - from.lon) * t;
    const lat = from.lat + (to.lat - from.lat) * t;
    const lift = Math.sin(Math.PI * t) * height;
    positions.push(Cartesian3.fromDegrees(lon, lat, lift));
  }
  return positions;
}

const activeRoutes = [
  [nodes[2], nodes[0]],
  [nodes[1], nodes[3]],
  [nodes[5], nodes[4]]
];

activeRoutes.forEach(([from, to], index) => {
  const positions = arcPositions(from, to, 850000 + index * 180000);
  viewer.entities.add({
    polyline: {
      positions,
      width: 2.2,
      arcType: 0,
      material: new PolylineGlowMaterialProperty({
        glowPower: 0.18,
        taperPower: 0.72,
        color: Color.fromCssColorString("#77c9d8").withAlpha(0.78)
      })
    }
  });

  const duration = 7200 + index * 1700;
  const startTime = performance.now() + index * 850;
  viewer.entities.add({
    position: new CallbackProperty(() => {
      const progress = ((performance.now() - startTime) % duration) / duration;
      const sample = Math.min(positions.length - 1, Math.floor(progress * (positions.length - 1)));
      return positions[sample];
    }, false),
    point: {
      pixelSize: 6,
      color: Color.WHITE,
      outlineColor: Color.fromCssColorString("#8be5e1"),
      outlineWidth: 5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  });
});

const ring = viewer.entities.add({
  position: Cartesian3.fromDegrees(121.4737, 31.2304, 22000),
  ellipse: {
    semiMinorAxis: 70000,
    semiMajorAxis: 70000,
    material: Color.fromCssColorString("#8be5e1").withAlpha(0.035),
    outline: true,
    outlineColor: Color.fromCssColorString("#8be5e1").withAlpha(0.6),
    outlineWidth: 1,
    height: 22000
  }
});

const list = document.querySelector("#dispatchList");
list.innerHTML = dispatches.map((item, index) => `
  <article class="dispatch-item">
    <div class="dispatch-route"><span>${item.from}</span><i></i><span>${item.to}</span><b>0${index + 1}</b></div>
    <div class="dispatch-meta"><span>${item.id} · ${item.workload}</span><strong>${item.amount}</strong></div>
    <div class="dispatch-progress"><i style="width:${[72, 46, 88][index]}%"></i></div>
  </article>
`).join("");

const clock = document.querySelector("#clock");
function updateClock() {
  clock.textContent = new Date().toISOString().slice(11, 19) + " UTC";
}
updateClock();
setInterval(updateClock, 1000);

let rotation = true;
let lastTime = performance.now();
viewer.clock.onTick.addEventListener(() => {
  if (!rotation) return;
  const now = performance.now();
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  viewer.camera.rotate(Cartesian3.UNIT_Z, -delta * 0.012);
});
viewer.screenSpaceEventHandler.setInputAction(() => { rotation = false; }, ScreenSpaceEventType.LEFT_DOWN);
viewer.screenSpaceEventHandler.setInputAction(() => { rotation = true; lastTime = performance.now(); }, ScreenSpaceEventType.LEFT_UP);

viewer.scene.postRender.addEventListener(() => {
  // Keep the render loop alive for CallbackProperty-based dispatch particles.
});
window.addEventListener("beforeunload", () => viewer.destroy());
