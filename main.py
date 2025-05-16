from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import xml.etree.ElementTree as ET
import httpx
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = "0LjCr3pJnBLIozOEs1bN/zP8pyIVL2gMC9h/vKL5UGlQ02w4iJkzlNwM0OXLWma21CBoiBgp2SBwnt0b5ugDfg=="
KAKAO_REST_API_KEY = "18e911d85380035dff228cc1dba44960"

lawd_code_mapping = {
    "강남구": "11680", "강동구": "11740", "강북구": "11305", "강서구": "11500",
    "관악구": "11620", "광진구": "11215", "구로구": "11530", "금천구": "11545",
    "노원구": "11350", "도봉구": "11320", "동대문구": "11230", "동작구": "11590",
    "마포구": "11440", "서대문구": "11410", "서초구": "11650", "성동구": "11200",
    "성북구": "11290", "송파구": "11710", "양천구": "11470", "영등포구": "11560",
    "용산구": "11170", "은평구": "11380", "종로구": "11110", "중구": "11140", "중랑구": "11260"
}

api_endpoints = {
    "apartment_trade": "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
    "apartment_rent": "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
    "officetel_trade": "https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade",
    "officetel_rent": "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
    "rowhouse_trade": "https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade",
    "rowhouse_rent": "https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent"
}

# ✅ 중복 실행 방지용 플래그
already_called = False

def geocode_address(address: str):
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}
    params = {"query": address}
    try:
        response = httpx.get(url, headers=headers, params=params, timeout=5.0)
        print(f"📍 변환 시도 주소: {address}")
        print(f"🔍 상태코드: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            documents = data.get("documents", [])
            if not documents:
                print("⚠️ 변환 실패: documents 비어 있음")
            else:
                print("✅ 변환 성공")
                return float(documents[0]["y"]), float(documents[0]["x"])
        else:
            print("❌ API 요청 실패. 응답 내용:", response.json())
    except Exception as e:
        print("❗ 예외 발생:", e)
    return None, None

@app.get("/")
def root():
    return {"message": "ZIP-PICK 서버 작동 중입니다!"}

@app.get("/fetch-all-housing-data")
def fetch_all_data():
    global already_called
    if already_called:
        return {"message": "이미 호출됨. 서버 재시작 시 초기화됩니다."}
    already_called = True

    results = []
    total_count = 0

    for gu_name, lawd_code in lawd_code_mapping.items():
        print(f"\n[+] {gu_name} 처리 중...")

        for data_type, url in api_endpoints.items():
            print(f"   └─ {data_type} 호출 중...")
            num_of_rows = "10" if "trade" in data_type else "30"

            try:
                params = {
                    "serviceKey": API_KEY,
                    "LAWD_CD": lawd_code,
                    "DEAL_YMD": "202404",  # 필요 시 날짜 조정
                    "pageNo": "1",
                    "numOfRows": num_of_rows
                }

                response = httpx.get(url, params=params, timeout=10.0)
                if response.status_code != 200:
                    print(f"   ❌ 응답 오류 (status {response.status_code})")
                    continue

                root = ET.fromstring(response.text)
                items = root.findall(".//item")
                print(f"   └─ 수집된 항목: {len(items)}개")

                for item in items:
                    umd = item.findtext("umdNm", default="")
                    jibun_main = item.findtext("jibun") or item.findtext("bldgMainNum") or ""
                    jibun_sub = item.findtext("bldgSubNum") or ""
                    jibun = f"{jibun_main}-{jibun_sub}" if jibun_sub and jibun_sub != "0" else jibun_main
                    address = f"서울특별시 {gu_name} {umd} {jibun}".strip()

                    lat, lng = geocode_address(address)
                    if lat is None or lng is None:
                        print(f"      ⚠️ 변환 실패: {address}")
                        continue

                    y = item.findtext("dealYear", default="")
                    m = item.findtext("dealMonth", default="").zfill(2)
                    d = item.findtext("dealDay", default="").zfill(2)
                    contract_date = f"{y}.{m}.{d}" if y and m and d else ""

                    result = {
                        "구": gu_name,
                        "유형": data_type,
                        "주소": address,
                        "단지명": item.findtext("aptNm") or item.findtext("mhouseNm") or item.findtext("offiNm") or "",
                        "전용면적": item.findtext("excluUseAr") or "0",
                        "층": item.findtext("floor") or "0",
                        "거래금액": item.findtext("dealAmount") or item.findtext("deposit") or "0",
                        "월세금액": (item.findtext("monthlyRent") or "0") if "rent" in data_type else "0",
                        "계약일": contract_date,
                        "위도": lat,
                        "경도": lng
                    }

                    results.append(result)
                    total_count += 1

            except Exception as e:
                print(f"   ❗에러 ({gu_name}-{data_type}):", e)

    print(f"\n✅ 전체 수집 완료! 총 {total_count}건")

    with open("housing_data.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    return {"housing_data": results}