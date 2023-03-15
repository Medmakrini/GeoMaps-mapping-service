import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import Draw from "@mapbox/mapbox-gl-draw";
import './App.css';
import * as turf from "@turf/turf";

const GeoMap: React.FC = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [geoJSON, setGeoJSON] = useState<any | null>(null);
  const [lotJSON, setlotJSON] = useState<any | null>(null);
  const [FloorHeight, setFloorHeight] = useState<number | 0>(0);
  const [Floornumbers, setFloornumbers] = useState<number | 0>(0);
  const [LotConverge, setLotConverge] = useState<number | 0>(0);
  const [Area, setarea] = useState<number | 0>(0);

  useEffect(() => {
    mapboxgl.accessToken = "pk.eyJ1IjoibWVkbWFrcmluaSIsImEiOiJjbGR1bzF2d20wMDY0M29wb3Jzcnk3MGFqIn0.T3zW6ens-6wjKr68fyS4gw";
    const initializeMap = ({ setMap, setDraw }: any) => {
      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11?optimize=true",
        center: [0, 0],
        zoom: 0,

      });

      map.on("load", () => {
        setMap(map);
        setDraw(
          new Draw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              trash: true,
            },
          })
        );
      });
    };

    if (!map) initializeMap({ setMap, setDraw });
  }, [map]);

  useEffect(() => {
    if (map && geoJSON) {
      map.addSource("plot", { type: "geojson", data: geoJSON });
      map.addLayer({
        id: "plot",
        type: "line",
        source: "plot",
      });
      const bounds = turf.bbox(geoJSON);
      map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
          padding: 20
      });
      const center = turf.centerOfMass(geoJSON);
      const lng = center.geometry.coordinates[0];
      const lat = center.geometry.coordinates[1];
      const area = turf.area(geoJSON);
      setarea(area)

    }
  }, [map, geoJSON]);

  const handleUpload = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (e) => {
      setGeoJSON(JSON.parse(e.target?.result as string));
    };
  };

  const Addfloor=(event:any)=>{
    const diff=event.target.value-Floornumbers
    if (diff>0) {
     setFloornumbers(event.target.value)
    if(map){
      for (let i = 1; i < event.target.value; i++) {
          map.addLayer({
          "id": i.toString(),
          "type": "fill-extrusion",
          "source": "lot",
          "layout": {},
          "paint": {
              "fill-extrusion-color": "#FFBF00",
              "fill-extrusion-height": i*FloorHeight,
              "fill-extrusion-base":0 ,
              "fill-extrusion-opacity": 1
          },
          "filter": ["==", "$type", "Polygon"]
      });
        

      }

    } 
      
    }
    else{
      if(map){
        for (let i = event.target.value; i <= Floornumbers; i++) {
            map.removeLayer(i.toString())
        }
        setFloornumbers(event.target.value)
  
      } 
    }
    
  }

  const FloorHeightAdj=(event:any)=>{
    setFloorHeight(event.target.value)
  }
  const LotConvergeAdj=(event:any)=>{
    setLotConverge(event.target.value)

    if(map?.isSourceLoaded('lot')){
      map.removeLayer("building-center-3d");
      map.removeSource('lot')
    }
    if(map){

      let lot = turf.transformScale(geoJSON,event.target.value/100)
      setlotJSON(lot)
      console.log(lot)
      map.addSource("lot", { type: "geojson", data: lot });
      map.addLayer({
        "id": "building-center-3d",
        "type": "fill-extrusion",
        "source": "lot",
        "layout": {},
        "paint": {
            "fill-extrusion-color": "#FFBF00",
            "fill-extrusion-height": 0.5,
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 1
        },
        "filter": ["==", "$type", "Polygon"]
    });
    }

  }
  const Clean=(event:any)=>{
    setGeoJSON(null)
    if(map){
      for (let i = 0; i < Floornumbers; i++) {
        map.removeLayer(i.toString())
      }
      map.removeLayer('building-center-3d')
      map.removeLayer('plot')
      map.removeSource('plot')
      map.removeSource('lot')
      setFloorHeight(0)
      setFloornumbers(0)
      setLotConverge(0)


    }

    
  }

  return (
    <div  className="container">
      <div className="controle">
      <h2 >Controle</h2> 
     
        {geoJSON!==null?

      <div className="adj">
        <label className="controlePan" htmlFor="lot">Lot converage:{LotConverge} %</label><br />
        <input className="controlePan" type="range"  defaultValue={0} id="lot" name="lot" min="0" max="100" onChange={LotConvergeAdj}/><br />

        <label className="controlePan" htmlFor="floorHeight">Floor Height :{FloorHeight} </label><br />
        <input className="controlePan" type="range"  defaultValue={0} id="floorHeight" name="floorHeight" min="0" max="100"  onChange={FloorHeightAdj}/><br />

        <label className="controlePan" htmlFor="floorVolume">Floor Number :{Floornumbers}</label><br />
        <input className="controlePan" type="range" defaultValue={0} id="floorVolume" name="floorVolume" min="0" max="100" onChange={Addfloor}/><br />  
        <button  className="addNew" onClick={Clean}>TRY DIFFERENT DATA</button>

        </div>:
        <>
          <input className="controlePan custom-file-input"type="file" onChange={handleUpload} /><br />
          <h6>Please Load the Json file to show the control panel</h6>
        </> 
        }

     

      

      </div>
      <div className="map-container" id="map" style={{ width: "60%", height: "500px",marginTop:'50px',borderRadius:'20px' }}/>

      <div className="stat">
        <h2 className="stat1">Statistiques</h2> 
        <h6>Land Area :{Area.toFixed(2)} (m2)</h6>
        <h6>building Area :{(Area*LotConverge/100).toFixed(2)} (m2)</h6>
        <h6>volume :{(Area*FloorHeight*Floornumbers).toFixed(2)} (m3)</h6>
        <h6>building Height  : {(FloorHeight*Floornumbers).toFixed(2)} (m)</h6>

      </div>


    </div>
  );
};

export default GeoMap;
