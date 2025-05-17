from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
import requests

router = APIRouter()

# 🔑 발급받은 Server 플랫폼 API Key
API_KEY = "7U+rJfEdoXcGMW7AsUQcEpgPjwUCMsqGtkq2vAyiDBM"

@router.get("/commute-time-odsay")
def get_commute_time_odsay(
    start_lat: float = Query(..., description="출발지 위도"),
    start_lng: float = Query(..., description="출발지 경도"),
    end_lat: float = Query(..., description="도착지 위도"),
    end_lng: float = Query(..., description="도착지 경도")
):
    url = "https://api.odsay.com/v1/api/searchPubTransPathT"
    params = {
        "SX": start_lng,  # 경도 먼저!
        "SY": start_lat,
        "EX": end_lng,
        "EY": end_lat,
        "apiKey": API_KEY,
        "OPT": 0,
        "SearchType": 0,
        "SearchPathType": 0
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        print("📦 ODsay 응답:", data)

        # 에러 메시지까지 프론트로 넘겨보자 (디버깅용)
        if "error" in data:
            return JSONResponse(content={"duration_minutes": 9999, "error": data["error"]})

        if "result" in data and "path" in data["result"]:
            total_time = data["result"]["path"][0]["info"]["totalTime"]
            return JSONResponse(content={"duration_minutes": total_time})
        else:
            return JSONResponse(content={"duration_minutes": 9999, "raw": data})
    except Exception as e:
        return JSONResponse(content={"duration_minutes": 9999, "exception": str(e)})

@router.get("/my-ip")
def get_my_ip(request: Request):
    return {"ip": request.client.host}
