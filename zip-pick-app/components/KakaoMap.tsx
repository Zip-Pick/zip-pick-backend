import React from 'react';
import { View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

export interface Marker {
  lat: number;
  lng: number;
  label: string;
}

interface KakaoMapProps {
  center?: { lat: number; lng: number };
  markers: Marker[];
  userMarker?: { lat: number; lng: number } | null;
  zoomLevel?: number;
  onMarkerClick?: (label: string) => void;
  height?: number;
}

export default function KakaoMap({
  center = { lat: 37.5665, lng: 126.9780 },
  markers,
  userMarker,
  zoomLevel = 5,
  onMarkerClick,
  height = 300,
}: KakaoMapProps) {
  const markersJson = JSON.stringify(markers);
  const userMarkerJson = JSON.stringify(userMarker);

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Kakao Map</title>
      <meta name="viewport" content="initial-scale=1, maximum-scale=1">
      <style>
        html, body, #map {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=0d0781019ea8f04910a7dee63ccd2d69"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${center.lat}, ${center.lng}),
          level: ${zoomLevel}
        });

        // 추천 매물 마커 (기본색)
        const markers = ${markersJson};
        markers.forEach(item => {
          const position = new kakao.maps.LatLng(item.lat, item.lng);
          const marker = new kakao.maps.Marker({ position, map });

          const infowindow = new kakao.maps.InfoWindow({
            content: '<div style="padding:5px;">' + item.label + '</div>'
          });

          kakao.maps.event.addListener(marker, 'click', () => {
            infowindow.open(map, marker);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                label: item.label
              }));
            }
          });
        });

        // 입력 주소(출근지) 마커
        const userMarker = ${userMarkerJson};
        if (userMarker && userMarker.lat && userMarker.lng) {
          const userMarkerPosition = new kakao.maps.LatLng(userMarker.lat, userMarker.lng);
          // 📍 이모지 느낌의 마커 아이콘 사용
          const userMarkerContent =
            '<div style="display: flex; flex-direction: column; align-items: center; font-size: 32px; font-weight: bold; line-height: 1; margin-bottom: 0;">' +
              '📍' +
              '<div style="background: white; color: #d32f2f; border-radius: 10px; font-size: 15px; font-weight: bold; padding: 2px 10px 2px 10px; box-shadow: 1px 1px 3px #aaa; margin-top: -4px;">출근지</div>' +
            '</div>';

          // Overlay 마커 느낌으로 표시
          const markerOverlay = new kakao.maps.CustomOverlay({
            map: map,
            position: userMarkerPosition,
            content: userMarkerContent,
            yAnchor: 1
          });

          // 클릭 시 infowindow 하나 더 띄울 수도 있음 (생략해도 무방)
        }
      </script>
    </body>
  </html>
  `;

  return (
    <View style={{ width: width, height }}>
      <WebView
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        mixedContentMode="always"
        source={{ html }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'markerClick' && onMarkerClick) {
              onMarkerClick(message.label);
            }
          } catch (e) {
            console.warn('WebView message parse error:', e);
          }
        }}
      />
    </View>
  );
}
