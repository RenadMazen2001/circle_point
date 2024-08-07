document.addEventListener("DOMContentLoaded", () => {
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/geometry/Point",
      "esri/geometry/Circle",
      "esri/widgets/Home",
      "esri/layers/FeatureLayer"
    ], function (
      Map,
      MapView,
      Graphic,
      GraphicsLayer,
      SimpleMarkerSymbol,
      SimpleFillSymbol,
      Point,
      Circle,
      Home,
      FeatureLayer
    ) {
      // Create the map
      let map = new Map({
        basemap: "streets-navigation-vector"
      });
  
      // Create the map view
      let view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-100, 40],
        zoom: 4
      });
  
      // Define symbols for drawing
      const spatialRelationship = "intersects";
      let circleSymbol = new SimpleFillSymbol({
        color: [255, 255, 255, 0.6],
        outline: {
          color: "red",
          width: 1
        }
      });
      let pointSymbol = new SimpleMarkerSymbol({
        color: "black",
        size: "12px", // Default size
        outline: {
          color: [255, 255, 255],
          width: 1
        }
      });
  
      // Create and add the feature layer
      const featureLayer = new FeatureLayer({
        url: "https://services.gis.ca.gov/arcgis/rest/services/Boundaries/CA_Counties/FeatureServer/0",
        popupTemplate: {
          title: "CA Counties",
          content: "OBJECTID: {OBJECTID}<br>Population: {Population}<br>AREA_ID: {AREA_ID}<br>DETAIL_CITY: {DETAIL_CITY}"
        }
      });
      map.add(featureLayer);
  
      // Add Home widget
      let homeWidget = new Home({
        view: view
      });
      view.ui.add(homeWidget, "top-left");
  
      // Create graphics layers
      let graphicsLayerPoints = new GraphicsLayer();
      let graphicsLayerCircles = new GraphicsLayer();
      map.addMany([graphicsLayerPoints, graphicsLayerCircles]);
  
      // Handle view click events
      view.on("click", (e) => {
        if (document.getElementById("drawPoint").classList.contains("active")) {
          let pointGraphic = new Graphic({
            geometry: e.mapPoint,
            symbol: pointSymbol
          });
          graphicsLayerPoints.add(pointGraphic);
        } else if (document.getElementById("drawCircle").classList.contains("active")) {
          let radius = document.getElementById("radiusSlider").value * 1000;
          let circleGeometry = new Circle({
            center: e.mapPoint,
            radius: parseFloat(radius)
          });
          let circleGraphic = new Graphic({
            geometry: circleGeometry,
            symbol: circleSymbol
          });
          graphicsLayerCircles.add(circleGraphic);
        }
      });
  
      // Add event listeners for buttons
      document.getElementById("drawPoint").addEventListener("click", () => {
        toggleActiveButton("drawPoint");
      });
  
      document.getElementById("drawCircle").addEventListener("click", () => {
        toggleActiveButton("drawCircle");
      });
  
      document.getElementById("clearPoints").addEventListener("click", () => {
        graphicsLayerPoints.removeAll();
      });
  
      document.getElementById("clearCircles").addEventListener("click", () => {
        graphicsLayerCircles.removeAll();
        featureLayer.definitionExpression = "1=1";
      });
  
      document.getElementById("searchButton").addEventListener("click", async () => {
        if (graphicsLayerCircles.graphics.length > 0) {
          let circleGraphics = graphicsLayerCircles.graphics.items;
          let allFeaturesIds = [];
  
          for (let graphic of circleGraphics) {
            let radius = parseFloat(document.getElementById("radiusSlider").value);
            let circleGeometry = new Circle({
              center: graphic.geometry.center,
              radius: radius * 1000
            });
  
            let query = featureLayer.createQuery();
            query.outFields = ["*"];
            query.where = "1=1";
            query.geometry = circleGeometry;
            query.spatialRelationship = spatialRelationship;
  
            let result = await featureLayer.queryFeatures(query);
            let featuresIds = result.features.map(
              (feature) => feature.attributes["OBJECTID"]
            );
  
            allFeaturesIds = [...new Set([...allFeaturesIds, ...featuresIds])];
          }
  
          if (allFeaturesIds.length !== 0) {
            featureLayer.definitionExpression = "OBJECTID IN (" + allFeaturesIds.join(",") + ")";
          } else {
            featureLayer.definitionExpression = "1=3";
          }
        }
      });
  
      // Update point size based on slider input
      document.getElementById("pointSizeSlider").addEventListener("input", (e) => {
        let size = `${e.target.value}px`;
        pointSymbol.size = size;
        document.getElementById("pointSizeValue").textContent = size;
      });
  
      // Toggle active button
      function toggleActiveButton(buttonId) {
        let buttons = document.querySelectorAll(".controls button");
        buttons.forEach((button) => {
          button.classList.remove("active");
        });
        document.getElementById(buttonId).classList.add("active");
      }
    });
  });
  