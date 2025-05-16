from fastapi import APIRouter, Query
import httpx

router = APIRouter()

ODSAY_API_KEY = "6UOzDV6WzbV4oLfEAoVZ3DBRMeAG4nIMj9aDDyP+Lec"

@router.get("/commute-time-odsay")
async def get_commute_time(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...),
):
    url = (
        f"https://api.odsay.com/v1/api/searchPubTransPath?"
        f"SX={start_lng}&SY={start_lat}&EX={end_lng}&EY={end_lat}"
        f"&apiKey={ODSAY_API_KEY}"
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)

        print("📦 호출 URL:", url)
        print("📦 응답 코드:", response.status_code)

        try:
            data = response.json()
        except Exception as e:
            print("❌ JSON 파싱 실패:", e)
            print("📦 원시 응답:", response.text)
            return {"duration_minutes": 9999}

        print("📦 파싱된 데이터(result.path):", data.get("result", {}).get("path"))

        paths = data.get("result", {}).get("path", [])

        if not paths:
            print("❌ ODsay 응답: 경로 없음")
            return {"duration_minutes": 9999}

        # 안전하게 totalTime 꺼내기
        info = paths[0].get("info", {})
        if not info or "totalTime" not in info:
            print("❌ info.totalTime 없음")
            return {"duration_minutes": 9999}

        duration_min = info["totalTime"]
        print(f"🚌 통근시간 계산 성공: {duration_min}분")

        return {"duration_minutes": int(duration_min)}

    except Exception as e:
        print(f"❌ ODsay 예외 발생: {e}")
        return {"duration_minutes": 9999}
