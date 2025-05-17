from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
import requests

router = APIRouter()

# 🔑 당신이 발급받은 ODsay Server API Key를 아래에 붙여주세요
API_KEY = "7U+rJfEdoXcGMW7AsUQcEpgPjwUCMsqGtkq2vAyiDBM"

# ✅ 통근 시간 계산 API
@router.get("/commute-time-odsay")
def get_commute_time_odsay(
    start_lat: float = Query(..., description="출발지 위도"),
    start_lng: float = Query(..., description="출발지 경도"),
    end_lat: float = Query(..., description="도착지 위도"),
    end_lng: float = Query(..., description="도착지 경도")
):
    url = "https://api.odsay.com/v1/api/searchPubTransPathT"
    params = {
        "SX": start_lng,
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
        print("ODsay 응답 내용:", data)

        if "result" in data and "path" in data["result"]:
            total_time = data["result"]["path"][0]["info"]["totalTime"]
            return JSONResponse(content={"duration_minutes": total_time})
        else:
            return JSONResponse(content={"duration_minutes": 9999})
    except Exception as e:
        print("예외 발생:", str(e))
        return JSONResponse(content={"duration_minutes": 9999})

# ✅ 서버 공인 IP 확인용 API (ODsay 등록용)
@router.get("/my-ip")
def get_my_ip(request: Request):
    return {"ip": request.client.host}