// ============================================
// Google Apps Script - 챌린지 참여자 수집
// ============================================
// 사용법:
// 1. Google 스프레드시트를 새로 만드세요
// 2. 첫 번째 행(A1:D1)에 헤더를 입력하세요: 이름 | 전화번호 | 참여일 | 참여코드
// 3. 상단 메뉴 → 확장 프로그램 → Apps Script 클릭
// 4. 기존 코드를 모두 지우고 아래 코드를 붙여넣으세요
// 5. 저장 (Ctrl+S)
// 6. 배포 → 새 배포 → 유형: 웹 앱
//    - 실행 주체: 본인
//    - 액세스 권한: 모든 사용자
// 7. 배포 → URL 복사
// 8. 복사한 URL을 challenge.js의 SHEET_URL에 붙여넣기
// ============================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.name,
      data.phone,
      data.date,
      data.code
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
