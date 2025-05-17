from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
import requests

router = APIRouter()

WEB_API_KEY = "IChuNdKgVADr7B2J+1d01w"  # pointSearch 전용
SERVER_API_KEY = "7U+rJfEdoXcGMW7AsUQcEpgPjwUCMsqGtkq2vAyiDBM"  # searchPubTransPathT 전용

def get_near_station(lat, lng):
    try:
        url = "https://api.odsay.com/v1/api/pointSearch"
        params = {
            "apiKey": WEB_API_KEY,
            "x": str(lng),
            "y": str(lat),
            "radius": "3000"  # 1.5km보다 넓혀서 시도
        }
        res = requests.get(url, params=params, timeout=3)
        data = res.json()
        stations = data.get("result", {}).get("station", [])
        if stations:
            return stations[0]["stationID"]
    except Exception as e:
        print("정류장 찾기 오류:", e)
    return None

@router.get("/commute-time-odsay")
def commute_time(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...)
):
    try:
        # 1. 출발·도착 정류장 찾기
        start_station = get_near_station(start_lat, start_lng)
        end_station = get_near_station(end_lat, end_lng)

        if not start_station or not end_station:
            return JSONResponse(content={"duration_minutes": 9999, "reason": "정류장 찾기 실패"})

        # 2. 실제 경로 계산 API 호출
        url = "https://api.odsay.com/v1/api/searchPubTransPathT"
        params = {
            "apiKey": SERVER_API_KEY,
            "SX": start_lng,
            "SY": start_lat,
            "EX": end_lng,
            "EY": end_lat,
            "SearchType": 0,
            "SearchPathType": 0,
            "OPT": 0
        }
        res = requests.get(url, params=params, timeout=5)
        data = res.json()
        print("🚏 ODsay 응답:", data)

        if "error" in data:
            return JSONResponse(content={"duration_minutes": 9999, "error": data["error"]})

        # 3. 경로 시간 추출
        path = data.get("result", {}).get("path", [])
        if path:
            total_time = path[0]["info"]["totalTime"]
            return JSONResponse(content={"duration_minutes": total_time})
        else:
            return JSONResponse(content={"duration_minutes": 9999, "reason": "경로 없음"})
    except Exception as e:
        return JSONResponse(content={"duration_minutes": 9999, "error": str(e)})

@router.get("/my-ip")
def get_my_ip(request: Request):
    return {"ip": request.client.host}