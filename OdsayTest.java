import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

public class OdsayTest {

    public static void main(String[] args) throws IOException {

        // ✅ 여기에 실제 발급받은 ODsay Web API 키를 넣어주세요
        String apiKey = "lChuNdKgVADr7B2J+1d01w";

        // ✅ 테스트용 출발지/도착지 좌표 (서울 마포 → 합정 근처)
        String urlInfo = "https://api.odsay.com/v1/api/searchPubTransPathT?" +
                "SX=126.9027279&SY=37.5349277" +
                "&EX=126.9145430&EY=37.5499421" +
                "&apiKey=" + URLEncoder.encode(apiKey, "UTF-8");

        // HTTP 요청
        URL url = new URL(urlInfo);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-type", "application/json");

        // 응답 읽기
        BufferedReader bufferedReader = new BufferedReader(
                new InputStreamReader(conn.getInputStream())
        );

        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            sb.append(line);
        }

        bufferedReader.close();
        conn.disconnect();

        // 결과 출력
        System.out.println("⏱ ODsay 응답 결과:");
        System.out.println(sb.toString());
    }
}
