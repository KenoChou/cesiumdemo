# Cesium Compute Atlas

一个基于 CesiumJS + Vite 的全球算力调度可视化 Demo。

## 当前效果

- Esri 全球卫星影像底图与地名/国界标注
- Esri World Hillshade 山体阴影叠加
- ArcGIS WorldElevation3D 真实高程地形（服务不可用时自动回退椭球）
- 沿椭球测地线插值的跨洲调度航线
- 8 个全球算力节点，区分在线 / 高负载 / 空闲状态
- 节点名称、GPU 数量与状态信息
- 跨区域调度弧线与沿线路径移动的光点
- 自动缓慢旋转地球，支持鼠标拖动、缩放和倾斜
- 深色控制室 UI、区域容量与调度流面板

## 本地运行

要求 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开终端提示的本地地址，默认通常是 http://localhost:5173。

生产构建：

```bash
npm run build
npm run preview
```

## 离线部署说明

当前 Demo 使用 Esri 全球卫星影像、地名/国界、山体阴影和 ArcGIS WorldElevation3D 高程服务，并使用 Google Fonts，因此**当前版本不是完全离线版**。Cesium 的 Workers、Assets、Widgets 已通过 Vite 复制到构建产物的 `/cesium/` 路径。

要在内网完全离线运行：

1. 将卫星影像、地名/国界、山体阴影准备为本地 XYZ 或 WMTS 瓦片服务，并确认影像数据授权允许内网部署。
2. 将高程数据准备为 Cesium Terrain 或兼容地形服务。
3. 将 `src/main.js` 中的 Esri `UrlTemplateImageryProvider` 地址改为内网瓦片地址，并将 ArcGIS 高程服务替换为内网地形服务。
4. 将 CSS 的在线字体替换为随项目部署的本地字体，或使用系统字体。
5. 将本项目构建产物、影像和地形服务部署到内网 Web 服务器。
6. 断网验证浏览器 Network 面板无公网请求。

## 接入真实调度数据

当前 `nodes` 和 `dispatches` 是演示数据。后续可将其替换为后端 API：

- 节点：节点 ID、名称、经纬度、GPU 总量、已分配量、在线状态
- 调度事件：订单 ID、源节点、目标节点、GPU 数量、开始时间、任务状态
- 前端收到调度事件后创建或更新弧线与粒子；调度决策仍由后端负责

建议后续拆分为 `GlobeScene`、`ComputeNodes`、`DispatchAnimation` 三个模块。
