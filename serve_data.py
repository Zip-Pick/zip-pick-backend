from fastapi import APIRouter, Request, Query
import json
import random
import httpx

router = APIRouter()

@router.get("/recommendation")
async def recommend(request: Request):
    with open("housing_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    query = request.query_params
    deposit_min = int(query.get("deposit_min", 0))
    deposit_max = int(query.get("deposit_max", 99999999))
    area_min = float(query.get("area_min", 0))

    result = []

    for item in data:
        try:
            deal_type = item.get("유형", "")
            area = float(item.get("전용면적", 0))
            lat = float(item.get("위도", 0))
            lng = float(item.get("경도", 0))
            pyoung = round(area / 3.3, 1)
            address = item.get("주소", "")
            contract_date = item.get("계약일", "")

            # 거래 금액 보완 처리
            if deal_type in ["apartment_trade", "officetel_trade", "rowhouse_trade"]:
                deposit = int(item.get("거래금액", "0").replace(",", "").replace(" ", ""))
                monthly = 0
            elif deal_type in ["apartment_rent", "officetel_rent", "rowhouse_rent"]:
                deposit = int(item.get("보증금", "0").replace(",", "").replace(" ", ""))
                monthly = int(item.get("월세", "0").replace(",", "").replace(" ", ""))
            else:
                deposit = 0
                monthly = 0

            if deposit_min > deposit or deposit > deposit_max:
                continue
            if area < area_min:
                continue

            # UI 출력용 레이블
            if monthly > 0:
                label = f"보증금 {deposit}만원 / 월세 {monthly}만원 | {area}㎡ (약 {pyoung}평)"
            else:
                label = f"{deal_type} {deposit}만원 | {area}㎡ (약 {pyoung}평)"

            result.append({
                "label": label,
                "lat": lat,
                "lng": lng,
                "type": deal_type,
                "address": address,
                "deposit": deposit,
                "monthlyRent": monthly,
                "area_m2": area,
                "pyeong": pyoung,
                "contractDate": contract_date
            })

        except Exception as e:
            print("❌ 추천 처리 중 오류:", e)
            continue

    return result


@router.get("/filtered-houses")
async def filter_houses_by_commute():
    import os
    with open("housing_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    sample_houses = random.sample(data, 30)

    origin_lat = 37.5665  # 서울 시청 위도
    origin_lng = 126.9780  # 서울 시청 경도

    filtered = []

    for item in sample_houses:
        try:
            deal_type = item.get("유형", "")
            area = float(item.get("전용면적", 0))
            lat = float(item.get("위도", 0))
            lng = float(item.get("경도", 0))
            pyoung = round(area / 3.3, 1)
            address = item.get("주소", "")
            contract_date = item.get("계약일", "")

            if deal_type in ["apartment_trade", "officetel_trade", "rowhouse_trade"]:
                deposit = int(item.get("거래금액", "0").replace(",", "").replace(" ", ""))
                monthly = 0
            elif deal_type in ["apartment_rent", "officetel_rent", "rowhouse_rent"]:
                deposit = int(item.get("보증금", "0").replace(",", "").replace(" ", ""))
                monthly = int(item.get("월세", "0").replace(",", "").replace(" ", ""))
            else:
                deposit = 0
                monthly = 0

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "http://localhost:8000/commute-time-odsay",
                    params={
                        "start_lat": origin_lat,
                        "start_lng": origin_lng,
                        "end_lat": lat,
                        "end_lng": lng
                    },
                    timeout=10
                )

            res = response.json()
            duration = res.get("duration_minutes", 9999)

            if duration <= 30:
                label = f"보증금 {deposit}만원 / 월세 {monthly}만원 | {area}㎡ (약 {pyoung}평)" if monthly > 0 \
                    else f"{deal_type} {deposit}만원 | {area}㎡ (약 {pyoung}평)"

                item.update({
                    "label": label,
                    "deposit": deposit,
                    "monthlyRent": monthly,
                    "area_m2": area,
                    "pyeong": pyoung,
                    "contractDate": contract_date,
                    "commute_minutes": duration
                })
                filtered.append(item)

        except Exception as e:
            print("❌ 통근 시간 계산 오류:", e)
            continue

    with open("filtered_sample.json", "w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    print(f"✅ 저장 완료: {len(filtered)}개 매물 → filtered_sample.json")
    return filtered

@router.get("/save-random-sample")
def save_random_sample():
    import random
    with open("housing_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    sample = random.sample(data, 30)

    with open("sample_base.json", "w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)

    return {"message": "30개 샘플 저장 완료", "count": len(sample)}

# 🔥🔥 핵심! 프론트의 모든 조건 + 10% 가산 통근시간 반영
@router.get("/commute-from-address")
async def commute_from_address(
    address: str,
    commuteTimeLimit: int = Query(...),
    deposit: int = Query(99999999),
    monthly: int = Query(99999999),
    area: float = Query(0),
):
    print(f"📌 입력 조건: 주소={address} | 통근시간={commuteTimeLimit} | 예산={deposit} | 월세={monthly} | 면적={area}")

    def geocode_address(query):
        url = "https://dapi.kakao.com/v2/local/search/address.json"
        headers = {"Authorization": "KakaoAK 18e911d85380035dff228cc1dba44960"}  # 자신의 키로 교체
        params = {"query": query}
        response = httpx.get(url, headers=headers, params=params)
        if response.status_code == 200:
            docs = response.json().get("documents", [])
            if docs:
                y, x = float(docs[0]["y"]), float(docs[0]["x"])
                return y, x
        return None, None

    lat, lng = geocode_address(address)
    if lat is None or lng is None:
        print("❌ 주소 변환 실패")
        return {"error": "주소를 변환할 수 없습니다."}

    with open("sample_base.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    filtered = []
    max_minutes = int(commuteTimeLimit * 1.1)

    for item in data:
        try:
            address = item.get("주소", "주소 없음")
            area_raw = item.get("전용면적", "0")
            area_m2 = float(str(area_raw).replace(",", "").strip() or "0")

            deposit_raw = item.get("거래금액") or item.get("보증금") or "0"
            monthly_raw = item.get("월세금액") or item.get("월세") or "0"

            try:
                deposit_val = int(str(deposit_raw).replace(",", "").replace(" ", "").strip() or "0")
            except:
                deposit_val = 0
            try:
                monthly_val = int(str(monthly_raw).replace(",", "").replace(" ", "").strip() or "0")
            except:
                monthly_val = 0

            dest_lat = item.get("위도")
            dest_lng = item.get("경도")

            print(f"\n📍 매물 검사 시작: {address}")
            print(f" - 면적: {area_m2}㎡ | 보증금: {deposit_val} | 월세: {monthly_val}")

            if area_m2 < area:
                print(f"❌ 필터 탈락: 면적 {area_m2} < 최소 {area}")
                continue
            if deposit_val > deposit:
                print(f"❌ 필터 탈락: 보증금 {deposit_val} > 예산 {deposit}")
                continue
            if monthly_val > monthly:
                print(f"❌ 필터 탈락: 월세 {monthly_val} > 최대 {monthly}")
                continue
            if not dest_lat or not dest_lng:
                print("❌ 필터 탈락: 위도/경도 없음")
                continue

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "http://localhost:8000/commute-time-odsay",
                    params={
                        "start_lat": lat,
                        "start_lng": lng,
                        "end_lat": dest_lat,
                        "end_lng": dest_lng,
                    },
                    timeout=10
                )
            res = response.json()
            duration = res.get("duration_minutes", 9999)

            print(f"🚌 통근 시간: {duration}분 (허용 최대 {max_minutes}분)")
            if duration > max_minutes:
                print(f"❌ 필터 탈락: 통근 {duration} > 허용 {max_minutes}")
                continue

            # 통과
            pyoung = round(area_m2 / 3.3, 1)
            deal_type = item.get("유형", "")
            contract_date = item.get("계약일", "")
            label = (
                f"보증금 {deposit_val} / 월세 {monthly_val} | {area_m2}㎡ (약 {pyoung}평)"
                if monthly_val > 0
                else f"{deal_type} {deposit_val}만원 | {area_m2}㎡ (약 {pyoung}평)"
            )

            item.update({
                "label": label,
                "deposit": deposit_val,
                "monthlyRent": monthly_val,
                "area_m2": area_m2,
                "pyeong": pyoung,
                "contractDate": contract_date,
                "commute_minutes": duration,
            })

            print("✅ 추천 매물 통과")
            filtered.append(item)

        except Exception as e:
            print(f"❌ 매물 처리 오류: {e}")
            continue

    print(f"\n🎯 추천 매물 총 {len(filtered)}건 반환\n")
    return filtered