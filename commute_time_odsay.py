from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
import requests

router = APIRouter()

SERVER_API_KEY = "7U+rJfEdoXcGMW7AsUQcEpgPjwUCMsqGtkq2vAyiDBM"
WEB_API_KEY = "IChuNdKgVADr7B2J+1d01w"  # ✅ pointSearch는 Web 키로 호출

def find_station(lat: float, lng: float):
    try:
        url = "https://api.odsay.com/v1/api/pointSearch"
        params = {
            "apiKey": WEB_API_KEY,
            "x": str(lng),
            "y": str(lat),
            "radius": "1500"
        }
        res = requests.get(url, params=params, timeout=5)
        data = res.json()
        station_list = data.get("result", {}).get("station", [])
        if station_list:
            return station_list[0]["stationID"]
    except Exception as e:
        print("🚫 정류장 검색 실패:", e)
    return None

@router.get("/commute-time-odsay")
def get_commute_time_odsay(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...)
):
    try:
        # ✅ 정류장 ID 보정
        start_station = find_station(start_lat, start_lng)
        end_station = find_station(end_lat, end_lng)

        if not start_station or not end_station:
            return JSONResponse(content={"duration_minutes": 9999, "reason": "정류장 찾기 실패"})

        url = "https://api.odsay.com/v1/api/searchPubTransPathT"
        params = {
            "SX": start_lng,
            "SY": start_lat,
            "EX": end_lng,
            "EY": end_lat,
            "apiKey": SERVER_API_KEY,
            "OPT": 0,
            "SearchType": 0,
            "SearchPathType": 0
        }

        res = requests.get(url, params=params)
        data = res.json()
        print("📦 ODsay 응답:", data)

        if "error" in data:
            return JSONResponse(content={"duration_minutes": 9999, "error": data["error"]})

        if "result" in data and "path" in data["result"]:
            total_time = data["result"]["path"][0]["info"]["totalTime"]
            return JSONResponse(content={"duration_minutes": total_time})

        return JSONResponse(content={"duration_minutes": 9999, "raw": data})
    except Exception as e:
        return JSONResponse(content={"duration_minutes": 9999, "exception": str(e)})

@router.get("/my-ip")
def get_my_ip(request: Request):
    return {"ip": request.client.host}